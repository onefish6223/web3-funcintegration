// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Permit2.sol";
import "../src/MyTokenV4.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Permit2Test is Test {
    using ECDSA for bytes32;

    Permit2 public permit2;
    MyTokenV4 public token;
    
    uint256 public ownerPrivateKey = 0xa11ce;
    uint256 public spenderPrivateKey = 0xb0b;
    address public owner = vm.addr(ownerPrivateKey);
    address public spender = vm.addr(spenderPrivateKey);
    address public recipient = address(0x3);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant APPROVE_AMOUNT = 1000 * 10**18;
    
    function setUp() public {
        // 部署合约
        permit2 = new Permit2();
        
        // 使用owner部署token合约，这样owner就拥有所有代币
        vm.prank(owner);
        token = new MyTokenV4();
        
        // 设置账户
        vm.deal(owner, 10 ether);
        vm.deal(spender, 10 ether);
        vm.deal(recipient, 10 ether);
        
        // owner授权给permit2合约
        vm.prank(owner);
        token.approve(address(permit2), type(uint256).max);
    }
    
    function testDirectApprove() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        (uint256 amount, uint256 exp) = permit2.getAllowance(owner, address(token), spender);
        assertEq(amount, APPROVE_AMOUNT);
        assertEq(exp, expiration);
    }
    
    function testPermitSingle() public {
        uint256 expiration = block.timestamp + 1 hours;
        uint256 nonce = 1; // 使用非零nonce
        uint256 sigDeadline = block.timestamp + 30 minutes;
        
        // 构造permit数据
        Permit2.PermitDetails memory details = Permit2.PermitDetails({
            token: address(token),
            amount: APPROVE_AMOUNT,
            expiration: expiration,
            nonce: nonce
        });
        
        Permit2.PermitSingle memory permitSingle = Permit2.PermitSingle({
            details: details,
            spender: spender,
            sigDeadline: sigDeadline
        });
        
        // 生成签名 - 使用正确的哈希计算方式
        bytes32 detailsHash = keccak256(
            abi.encode(
                permit2.PERMIT_DETAILS_TYPEHASH(),
                details.token,
                details.amount,
                details.expiration,
                details.nonce
            )
        );
        
        bytes32 structHash = keccak256(
            abi.encode(
                permit2.PERMIT_SINGLE_TYPEHASH(),
                detailsHash,
                permitSingle.spender,
                permitSingle.sigDeadline
            )
        );
        
        bytes32 domainSeparator = permit2.DOMAIN_SEPARATOR();
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // 执行permit
        permit2.permit(owner, permitSingle, signature);
        
        // 验证授权
        (uint256 amount, uint256 exp) = permit2.getAllowance(owner, address(token), spender);
        assertEq(amount, APPROVE_AMOUNT);
        assertEq(exp, expiration);
    }
    
    function testTransferFrom() public {
        // 先进行授权
        uint256 expiration = block.timestamp + 1 hours;
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        // 构造转账数据
        uint256 transferAmount = 100 * 10**18;
        Permit2.AllowanceTransferDetails memory transferDetails = Permit2.AllowanceTransferDetails({
            from: owner,
            to: recipient,
            amount: transferAmount,
            token: address(token)
        });
        
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);
        
        // 执行转账
        vm.prank(spender);
        permit2.transferFrom(transferDetails);
        
        // 验证余额变化
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount);
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount);
        
        // 验证授权减少
        (uint256 remainingAllowance,) = permit2.getAllowance(owner, address(token), spender);
        assertEq(remainingAllowance, APPROVE_AMOUNT - transferAmount);
    }
    
    function testTransferFromBatch() public {
        // 先进行授权
        uint256 expiration = block.timestamp + 1 hours;
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        // 构造批量转账数据
        uint256 transferAmount1 = 50 * 10**18;
        uint256 transferAmount2 = 30 * 10**18;
        
        Permit2.AllowanceTransferDetails[] memory transferDetails = new Permit2.AllowanceTransferDetails[](2);
        transferDetails[0] = Permit2.AllowanceTransferDetails({
            from: owner,
            to: recipient,
            amount: transferAmount1,
            token: address(token)
        });
        transferDetails[1] = Permit2.AllowanceTransferDetails({
            from: owner,
            to: address(0x4),
            amount: transferAmount2,
            token: address(token)
        });
        
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        
        // 执行批量转账
        vm.prank(spender);
        permit2.transferFromBatch(transferDetails);
        
        // 验证余额变化
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount1 - transferAmount2);
        assertEq(token.balanceOf(recipient), transferAmount1);
        assertEq(token.balanceOf(address(0x4)), transferAmount2);
    }
    
    function testInvalidateNonces() public {
        uint256 wordPos = 0;
        uint256 mask = 0x1; // 使第0位失效
        
        vm.prank(owner);
        permit2.invalidateNonces(wordPos, mask);
        
        // 验证nonce已失效
        assertTrue(permit2.isNonceUsed(owner, 0));
        assertFalse(permit2.isNonceUsed(owner, 1));
    }
    
    function testExpiredSignature() public {
        uint256 expiration = block.timestamp + 1 hours;
        uint256 nonce = 1;
        uint256 sigDeadline = block.timestamp - 1; // 已过期
        
        Permit2.PermitDetails memory details = Permit2.PermitDetails({
            token: address(token),
            amount: APPROVE_AMOUNT,
            expiration: expiration,
            nonce: nonce
        });
        
        Permit2.PermitSingle memory permitSingle = Permit2.PermitSingle({
            details: details,
            spender: spender,
            sigDeadline: sigDeadline
        });
        
        bytes memory signature = "";
        
        vm.expectRevert(Permit2.SignatureExpired.selector);
        permit2.permit(owner, permitSingle, signature);
    }
    
    function testInsufficientAllowance() public {
        // 授权较小金额
        uint256 smallAmount = 10 * 10**18;
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(owner);
        permit2.approve(address(token), spender, smallAmount, expiration);
        
        // 尝试转账更大金额
        uint256 largeAmount = 100 * 10**18;
        Permit2.AllowanceTransferDetails memory transferDetails = Permit2.AllowanceTransferDetails({
            from: owner,
            to: recipient,
            amount: largeAmount,
            token: address(token)
        });
        
        vm.prank(spender);
        vm.expectRevert(Permit2.InsufficientAllowance.selector);
        permit2.transferFrom(transferDetails);
    }
    
    function testExpiredAllowance() public {
        // 设置已过期的授权
        uint256 expiration = block.timestamp - 1;
        
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        // 尝试使用过期授权进行转账
        Permit2.AllowanceTransferDetails memory transferDetails = Permit2.AllowanceTransferDetails({
            from: owner,
            to: recipient,
            amount: 100 * 10**18,
            token: address(token)
        });
        
        vm.prank(spender);
        vm.expectRevert(Permit2.SignatureExpired.selector);
        permit2.transferFrom(transferDetails);
    }
    
    function testZeroAmountTransfer() public {
        uint256 expiration = block.timestamp + 1 hours;
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        Permit2.AllowanceTransferDetails memory transferDetails = Permit2.AllowanceTransferDetails({
            from: owner,
            to: recipient,
            amount: 0,
            token: address(token)
        });
        
        vm.prank(spender);
        vm.expectRevert(Permit2.InvalidAmount.selector);
        permit2.transferFrom(transferDetails);
    }
    
    function testInvalidSpenderApprove() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(owner);
        vm.expectRevert(Permit2.InvalidSpender.selector);
        permit2.approve(address(token), address(0), APPROVE_AMOUNT, expiration);
    }
    
    function testInvalidTokenApprove() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(owner);
        vm.expectRevert(Permit2.InvalidToken.selector);
        permit2.approve(address(0), spender, APPROVE_AMOUNT, expiration);
    }
    
    function testGetVersion() public {
        string memory version = permit2.version();
        assertEq(version, "1");
    }
    
    function testDomainSeparator() public {
        bytes32 domainSeparator = permit2.DOMAIN_SEPARATOR();
        assertTrue(domainSeparator != bytes32(0));
    }
    
    function testEmergencyPause() public {
        // 测试emergencyPause函数会抛出"Emergency pause not implemented"错误
        vm.expectRevert("Emergency pause not implemented");
        permit2.emergencyPause();
        
        // 非所有者调用也应该抛出同样的错误
        vm.prank(spender);
        vm.expectRevert("Emergency pause not implemented");
        permit2.emergencyPause();
    }
}