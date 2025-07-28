// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Permit2.sol";
import "../src/MyTokenV4.sol";

contract Permit2SimpleTest is Test {
    Permit2 public permit2;
    MyTokenV4 public token;
    
    uint256 public ownerPrivateKey = 0xa11ce;
    address public owner = vm.addr(ownerPrivateKey);
    address public spender = address(0x2);
    address public recipient = address(0x3);
    
    uint256 public constant APPROVE_AMOUNT = 1000 * 10**18;
    
    function setUp() public {
        // 部署合约
        permit2 = new Permit2();
        
        // 使用owner部署token合约
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
    
    function testBasicApprove() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(owner);
        permit2.approve(address(token), spender, APPROVE_AMOUNT, expiration);
        
        (uint256 amount, uint256 exp) = permit2.getAllowance(owner, address(token), spender);
        assertEq(amount, APPROVE_AMOUNT);
        assertEq(exp, expiration);
    }
    
    function testBasicTransfer() public {
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
    
    function testBatchTransfer() public {
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
    
    function testNonceInvalidation() public {
        uint256 wordPos = 0;
        uint256 mask = 0x1; // 使第0位失效
        
        vm.prank(owner);
        permit2.invalidateNonces(wordPos, mask);
        
        // 验证nonce已失效
        assertTrue(permit2.isNonceUsed(owner, 0));
        assertFalse(permit2.isNonceUsed(owner, 1));
    }
    
    function testContractInfo() public view {
        // 测试版本
        string memory version = permit2.version();
        assertEq(version, "1");
        
        // 测试域分隔符
        bytes32 domainSeparator = permit2.DOMAIN_SEPARATOR();
        assertTrue(domainSeparator != bytes32(0));
    }
    
    function testErrorCases() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        // 测试无效spender
        vm.prank(owner);
        vm.expectRevert(Permit2.InvalidSpender.selector);
        permit2.approve(address(token), address(0), APPROVE_AMOUNT, expiration);
        
        // 测试无效token
        vm.prank(owner);
        vm.expectRevert(Permit2.InvalidToken.selector);
        permit2.approve(address(0), spender, APPROVE_AMOUNT, expiration);
        
        // 测试零金额转账
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
    
    function testSignatureTransfer() public {
        // 准备签名转账数据
        uint256 transferAmount = 100 * 10**18;
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;
        
        Permit2.SignatureTransfer memory signatureTransfer = Permit2.SignatureTransfer({
            token: address(token),
            from: owner,
            transfer: Permit2.SignatureTransferDetails({
                to: recipient,
                requestedAmount: transferAmount
            }),
            nonce: nonce,
            deadline: deadline
        });
        
        // 构造EIP712签名数据
        bytes32 transferHash = keccak256(
            abi.encode(
                permit2.SIGNATURE_TRANSFER_DETAILS_TYPEHASH(),
                signatureTransfer.transfer.to,
                signatureTransfer.transfer.requestedAmount
            )
        );
        
        bytes32 structHash = keccak256(
            abi.encode(
                permit2.SIGNATURE_TRANSFER_TYPEHASH(),
                signatureTransfer.token,
                signatureTransfer.from,
                transferHash,
                signatureTransfer.nonce,
                signatureTransfer.deadline
            )
        );
        
        bytes32 domainSeparator = permit2.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                structHash
            )
        );
        
        // 使用owner的私钥签名
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // 记录转账前的余额
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);
        
        // 执行签名转账
        permit2.permitTransferFrom(signatureTransfer, signature);
        
        // 验证余额变化
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount);
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount);
        
        // 验证nonce已被使用
        assertTrue(permit2.isNonceUsed(owner, nonce));
    }
}