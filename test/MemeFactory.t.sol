// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MemeFactory.sol";
import "../src/MemeToken.sol";

contract MemeFactoryTest is Test {
    MemeFactory public factory;
    address public owner;
    address public creator;
    address public user1;
    address public user2;
    
    // 接收ETH的函数
    receive() external payable {}
    
    // 测试参数
    string constant SYMBOL = "PEPE";
    uint256 constant TOTAL_SUPPLY = 1000000 * 1e18;  // 100万代币
    uint256 constant PER_MINT = 1000 * 1e18;         // 每次铸造1000个
    uint256 constant PRICE = 0.000001 ether;         // 每个代币0.000001 ETH (1 gwei)
    
    event MemeDeployed(
        address indexed tokenAddress,
        address indexed creator,
        string symbol,
        uint256 totalSupply,
        uint256 perMint,
        uint256 price
    );
    
    event MemeMinted(
        address indexed tokenAddress,
        address indexed minter,
        uint256 amount,
        uint256 payment,
        uint256 platformFee,
        uint256 creatorFee
    );
    
    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // 部署工厂合约
        factory = new MemeFactory();
        
        // 给测试账户一些ETH
        vm.deal(creator, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }
    
    function testDeployMeme() public {
        vm.startPrank(creator);
        
        // 测试部署Meme代币
        vm.expectEmit(false, true, false, true);  // 不检查tokenAddress，因为它是动态生成的
        emit MemeDeployed(address(0), creator, SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        address tokenAddr = factory.deployMeme(SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        // 验证代币地址不为零
        assertNotEq(tokenAddr, address(0));
        
        // 验证代币信息
        MemeFactory.MemeInfo memory info = factory.getMemeInfo(tokenAddr);
        assertEq(info.symbol, SYMBOL);
        assertEq(info.totalSupply, TOTAL_SUPPLY);
        assertEq(info.perMint, PER_MINT);
        assertEq(info.price, PRICE);
        assertEq(info.creator, creator);
        assertTrue(info.exists);
        
        // 验证代币合约状态
        MemeToken token = MemeToken(tokenAddr);
        assertEq(token.totalSupplyLimit(), TOTAL_SUPPLY);
        assertEq(token.perMint(), PER_MINT);
        assertEq(token.price(), PRICE);
        assertEq(token.creator(), creator);
        assertEq(token.factory(), address(factory));
        assertEq(token.totalMinted(), 0);
        assertTrue(token.canMint());
        
        vm.stopPrank();
    }
    
    function testDeployMemeInvalidParams() public {
        vm.startPrank(creator);
        
        // 测试空符号
        vm.expectRevert("Symbol cannot be empty");
        factory.deployMeme("", TOTAL_SUPPLY, PER_MINT, PRICE);
        
        // 测试零总供应量
        vm.expectRevert("Total supply must be greater than 0");
        factory.deployMeme(SYMBOL, 0, PER_MINT, PRICE);
        
        // 测试零每次铸造量
        vm.expectRevert("Per mint must be greater than 0");
        factory.deployMeme(SYMBOL, TOTAL_SUPPLY, 0, PRICE);
        
        // 测试每次铸造量超过总供应量
        vm.expectRevert("Per mint cannot exceed total supply");
        factory.deployMeme(SYMBOL, 1000, 2000, PRICE);
        
        vm.stopPrank();
    }
    
    function testMintMeme() public {
        // 首先部署代币
        vm.prank(creator);
        address tokenAddr = factory.deployMeme(SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        MemeToken token = MemeToken(tokenAddr);
        uint256 totalPayment = (PRICE * PER_MINT) / 1e18;  // 修正价格计算
        uint256 platformFee = totalPayment / 100;  // 1%
        uint256 creatorFee = totalPayment - platformFee;  // 99%
        
        // 记录初始余额
        uint256 ownerBalanceBefore = owner.balance;
        uint256 creatorBalanceBefore = creator.balance;
        uint256 user1BalanceBefore = user1.balance;
        
        // 用户1铸造代币
        vm.startPrank(user1);
        
        vm.expectEmit(false, true, false, true);  // 不检查tokenAddr，因为它是动态生成的
        emit MemeMinted(address(0), user1, PER_MINT, totalPayment, platformFee, creatorFee);
        
        factory.mintMeme{value: totalPayment}(tokenAddr);
        
        // 验证代币余额
        assertEq(token.balanceOf(user1), PER_MINT);
        assertEq(token.totalMinted(), PER_MINT);
        
        // 验证ETH分配
        assertEq(owner.balance, ownerBalanceBefore + platformFee);
        assertEq(creator.balance, creatorBalanceBefore + creatorFee);
        assertEq(user1.balance, user1BalanceBefore - totalPayment);
        
        vm.stopPrank();
    }
    
    function testMintMemeWithExcessPayment() public {
        // 部署代币
        vm.prank(creator);
        address tokenAddr = factory.deployMeme(SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        uint256 totalPayment = (PRICE * PER_MINT) / 1e18;
        uint256 excessPayment = 0.5 ether;
        uint256 totalSent = totalPayment + excessPayment;
        
        uint256 user1BalanceBefore = user1.balance;
        
        // 用户1发送超额ETH
        vm.prank(user1);
        factory.mintMeme{value: totalSent}(tokenAddr);
        
        // 验证多余的ETH被退还
        assertEq(user1.balance, user1BalanceBefore - totalPayment);
    }
    
    function testMintMemeInsufficientPayment() public {
        // 部署代币
        vm.prank(creator);
        address tokenAddr = factory.deployMeme(SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        uint256 insufficientPayment = ((PRICE * PER_MINT) / 1e18) - 1;
        
        // 测试支付不足
        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        factory.mintMeme{value: insufficientPayment}(tokenAddr);
    }
    
    function testMintMemeNonExistentToken() public {
        address fakeToken = makeAddr("fakeToken");
        
        vm.prank(user1);
        vm.expectRevert("Token does not exist");
        factory.mintMeme{value: 1 ether}(fakeToken);
    }
    
    function testMintMemeExceedTotalSupply() public {
        // 部署一个小总供应量的代币用于测试
        uint256 smallTotalSupply = PER_MINT * 2;  // 只能铸造2次
        
        vm.prank(creator);
        address tokenAddr = factory.deployMeme(SYMBOL, smallTotalSupply, PER_MINT, PRICE);
        
        uint256 totalPayment = (PRICE * PER_MINT) / 1e18;
        
        // 第一次铸造 - 成功
        vm.prank(user1);
        factory.mintMeme{value: totalPayment}(tokenAddr);
        
        // 第二次铸造 - 成功
        vm.prank(user2);
        factory.mintMeme{value: totalPayment}(tokenAddr);
        
        // 第三次铸造 - 应该失败
        vm.prank(user1);
        vm.expectRevert("Cannot mint more tokens");
        factory.mintMeme{value: totalPayment}(tokenAddr);
    }
    
    function testFeeDistribution() public {
        // 部署代币
        vm.prank(creator);
        address tokenAddr = factory.deployMeme(SYMBOL, TOTAL_SUPPLY, PER_MINT, PRICE);
        
        uint256 totalPayment = (PRICE * PER_MINT) / 1e18;
        uint256 expectedPlatformFee = totalPayment / 100;  // 1%
        uint256 expectedCreatorFee = totalPayment - expectedPlatformFee;  // 99%
        
        uint256 ownerBalanceBefore = owner.balance;
        uint256 creatorBalanceBefore = creator.balance;
        
        // 执行多次铸造来测试费用累积
        for (uint i = 0; i < 5; i++) {
            address user = makeAddr(string(abi.encodePacked("user", vm.toString(i))));
            vm.deal(user, 10 ether);
            
            vm.prank(user);
            factory.mintMeme{value: totalPayment}(tokenAddr);
        }
        
        // 验证总费用分配
        uint256 totalExpectedPlatformFee = expectedPlatformFee * 5;
        uint256 totalExpectedCreatorFee = expectedCreatorFee * 5;
        
        assertEq(owner.balance, ownerBalanceBefore + totalExpectedPlatformFee);
        assertEq(creator.balance, creatorBalanceBefore + totalExpectedCreatorFee);
    }
    
    function testGetMemeTokensInfo() public {
        // 部署多个代币
        vm.startPrank(creator);
        address token1 = factory.deployMeme("TOKEN1", TOTAL_SUPPLY, PER_MINT, PRICE);
        address token2 = factory.deployMeme("TOKEN2", TOTAL_SUPPLY * 2, PER_MINT * 2, PRICE * 2);
        vm.stopPrank();
        
        // 测试代币数量
        assertEq(factory.getAllMemeTokensCount(), 2);
        
        // 测试代币存在性
        assertTrue(factory.isMemeToken(token1));
        assertTrue(factory.isMemeToken(token2));
        assertFalse(factory.isMemeToken(makeAddr("fake")));
        
        // 测试获取代币列表
        address[] memory tokens = factory.getMemeTokens(0, 1);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], token1);
        assertEq(tokens[1], token2);
    }
    
    function testEmergencyWithdraw() public {
        // 向合约发送一些ETH
        vm.deal(address(factory), 10 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        uint256 contractBalance = address(factory).balance;
        
        // 只有所有者可以提取
        factory.emergencyWithdraw();
        
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
        assertEq(address(factory).balance, 0);
    }
    
    function testEmergencyWithdrawOnlyOwner() public {
        vm.deal(address(factory), 10 ether);
        
        // 非所有者尝试提取应该失败
        vm.prank(user1);
        vm.expectRevert();
        factory.emergencyWithdraw();
    }
}