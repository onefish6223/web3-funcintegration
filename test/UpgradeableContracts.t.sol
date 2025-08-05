// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../src/upgrades/UpgradeableNFTV1.sol";
import "../src/upgrades/UpgradeableNFTV2.sol";
import "../src/upgrades/UpgradeableNFTMarketV1.sol";
import "../src/upgrades/UpgradeableNFTMarketV2.sol";

/**
 * @title UpgradeableContractsTest
 * @dev 测试可升级合约的功能和升级过程
 */
contract UpgradeableContractsTest is Test {
    using ECDSA for bytes32;
    UpgradeableNFTV1 public nftV1Implementation;
    UpgradeableNFTV2 public nftV2Implementation;
    UpgradeableNFTMarketV1 public marketV1Implementation;
    UpgradeableNFTMarketV2 public marketV2Implementation;
    
    ERC1967Proxy public nftProxy;
    ERC1967Proxy public marketProxy;
    
    UpgradeableNFTV1 public nft;
    UpgradeableNFTMarketV1 public market;
    
    uint256 public user1PrivateKey = 0xa11ce;
    address public owner = address(0x1);
    address public user1 = vm.addr(user1PrivateKey); // 对应私钥 0xa11ce 的地址
    address public user2 = address(0x3);
    address public feeReceiver = address(0x4);
    

    
    
    function setUp() public {
        vm.startPrank(owner);
        
        // 部署实现合约
        nftV1Implementation = new UpgradeableNFTV1();
        nftV2Implementation = new UpgradeableNFTV2();
        marketV1Implementation = new UpgradeableNFTMarketV1();
        marketV2Implementation = new UpgradeableNFTMarketV2();
        
        // 部署代理合约
        bytes memory nftInitData = abi.encodeWithSelector(
            UpgradeableNFTV1.initialize.selector,
            "TestNFT",
            "TNFT",
            owner
        );
        
        nftProxy = new ERC1967Proxy(
            address(nftV1Implementation),
            nftInitData
        );
        
        bytes memory marketInitData = abi.encodeWithSelector(
            UpgradeableNFTMarketV1.initialize.selector,
            owner,
            feeReceiver,
            250 // 2.5%
        );
        
        marketProxy = new ERC1967Proxy(
            address(marketV1Implementation),
            marketInitData
        );
        
        // 包装代理为接口
        nft = UpgradeableNFTV1(address(nftProxy));
        market = UpgradeableNFTMarketV1(address(marketProxy));
        
        vm.stopPrank();
        
        // 给用户一些 ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    //wake-disable
    function testInitialState() public {
        assertEq(nft.name(), "TestNFT");
        assertEq(nft.symbol(), "TNFT");
        assertEq(nft.version(), "1.0.0");
        assertEq(nft.owner(), owner);
        assertEq(nft.nextTokenId(), 1);
        assertEq(nft.totalSupply(), 0);
        
        assertEq(market.version(), "1.0.0");
        assertEq(market.owner(), owner);
        assertEq(market.feeReceiver(), feeReceiver);
        assertEq(market.platformFeePercentage(), 250);
        assertEq(market.nextListingId(), 1);
    }
    
    function testNFTMinting() public {
        vm.startPrank(owner);
        
        uint256 tokenId1 = nft.mint(user1);
        assertEq(tokenId1, 1);
        assertEq(nft.ownerOf(tokenId1), user1);
        assertEq(nft.totalSupply(), 1);
        assertEq(nft.nextTokenId(), 2);
        
        uint256 tokenId2 = nft.mint(user2);
        assertEq(tokenId2, 2);
        assertEq(nft.ownerOf(tokenId2), user2);
        assertEq(nft.totalSupply(), 2);
        
        vm.stopPrank();
    }
    
    function testMarketListing() public {
        // 铸造 NFT
        vm.prank(owner);
        uint256 tokenId = nft.mint(user1);
        
        // 授权市场合约
        vm.prank(user1);
        nft.approve(address(market), tokenId);
        
        // 上架 NFT
        vm.prank(user1);
        market.createListing(address(nft), tokenId, 1 ether);
        
        // 检查 listing
        (uint256 id, address nftContract, address seller, address buyer, uint256 listingTokenId, uint256 price, bool active) = market.listings(1);
        assertEq(id, 1);
        assertEq(nftContract, address(nft));
        assertEq(seller, user1);
        assertEq(listingTokenId, tokenId);
        assertEq(price, 1 ether);
        assertTrue(active);
    }
    
    function testMarketPurchase() public {
        // 铸造和上架 NFT
        vm.prank(owner);
        uint256 tokenId = nft.mint(user1);
        
        vm.prank(user1);
        nft.approve(address(market), tokenId);
        
        vm.prank(user1);
        market.createListing(address(nft), tokenId, 1 ether);
        
        // 记录初始余额
        uint256 user1BalanceBefore = user1.balance;
        uint256 feeReceiverBalanceBefore = feeReceiver.balance;
        
        // 购买 NFT
        vm.prank(user2);
        market.buyNFT{value: 1 ether}(1);
        
        // 检查 NFT 所有权转移
        assertEq(nft.ownerOf(tokenId), user2);
        
        // 检查 listing 状态
        (, , , address buyer, , , bool active) = market.listings(1);
        assertFalse(active);
        assertEq(buyer, user2);
        
        // 检查资金分配
        uint256 platformFee = (1 ether * 250) / 10000; // 2.5%
        uint256 sellerAmount = 1 ether - platformFee;
        
        assertEq(user1.balance, user1BalanceBefore + sellerAmount);
        assertEq(feeReceiver.balance, feeReceiverBalanceBefore + platformFee);
    }
    
    function testUpgradeToV2() public {
        // 铸造一些 NFT 和创建一些 listing 来测试状态保持
        vm.startPrank(owner);
        uint256 tokenId1 = nft.mint(user1);
        uint256 tokenId2 = nft.mint(user2);
        vm.stopPrank();
        
        vm.prank(user1);
        nft.approve(address(market), tokenId1);
        
        vm.prank(user1);
        market.createListing(address(nft), tokenId1, 1 ether);
        
        // 记录升级前的状态
        uint256 totalSupplyBefore = nft.totalSupply();
        uint256 nextTokenIdBefore = nft.nextTokenId();
        uint256 nextListingIdBefore = market.nextListingId();
        uint256 platformFeeBefore = market.platformFeePercentage();
        
        // 升级合约
        vm.startPrank(owner);
        nft.upgradeToAndCall(address(nftV2Implementation), "");
        market.upgradeToAndCall(address(marketV2Implementation), "");
        vm.stopPrank();
        
        // 包装为 V2 接口
        UpgradeableNFTV2 nftV2 = UpgradeableNFTV2(address(nftProxy));
        UpgradeableNFTMarketV2 marketV2 = UpgradeableNFTMarketV2(address(marketProxy));
        
        // 检查状态保持
        assertEq(nftV2.totalSupply(), totalSupplyBefore);
        assertEq(nftV2.nextTokenId(), nextTokenIdBefore);
        assertEq(marketV2.nextListingId(), nextListingIdBefore);
        assertEq(marketV2.platformFeePercentage(), platformFeeBefore);
        
        // 检查版本更新
        assertEq(nftV2.version(), "2.0.0");
        assertEq(marketV2.version(), "2.0.0");
        
        // 检查原有 NFT 仍然存在
        assertEq(nftV2.ownerOf(tokenId1), user1);
        assertEq(nftV2.ownerOf(tokenId2), user2);
        
        // 检查原有 listing 仍然有效
        (, , address seller, , , uint256 price, bool active, ) = marketV2.listings(1);
        assertTrue(active);
        assertEq(seller, user1);
        assertEq(price, 1 ether);
    }
    
    function testV2NewFeatures() public {
        // 先升级到 V2
        vm.startPrank(owner);
        nft.upgradeToAndCall(address(nftV2Implementation), "");
        market.upgradeToAndCall(address(marketV2Implementation), "");
        vm.stopPrank();
        
        UpgradeableNFTV2 nftV2 = UpgradeableNFTV2(address(nftProxy));
        UpgradeableNFTMarketV2 marketV2 = UpgradeableNFTMarketV2(address(marketProxy));
        
        // 测试设置市场合约
        vm.prank(owner);
        nftV2.setMarketContract(address(marketV2));
        
        // 铸造 NFT
        vm.prank(owner);
        uint256 tokenId = nftV2.mint(user1);
        
        // 测试一次性授权功能
        vm.prank(user1);
        nftV2.approveAllToMarket();
        
        assertTrue(nftV2.isApprovedForMarket(user1));
        assertTrue(nftV2.isApprovedForAll(user1, address(marketV2)));
        
        // 测试取消授权
        vm.prank(user1);
        nftV2.revokeApprovalFromMarket();
        
        assertFalse(nftV2.isApprovedForMarket(user1));
        assertFalse(nftV2.isApprovedForAll(user1, address(marketV2)));
    }
    
    function testSignatureListing() public {
        // 升级到 V2
        vm.startPrank(owner);
        nft.upgradeToAndCall(address(nftV2Implementation), "");
        market.upgradeToAndCall(address(marketV2Implementation), "");
        vm.stopPrank();
        
        UpgradeableNFTV2 nftV2 = UpgradeableNFTV2(address(nftProxy));
        UpgradeableNFTMarketV2 marketV2 = UpgradeableNFTMarketV2(address(marketProxy));
        
        // 设置市场合约并铸造 NFT
        vm.prank(owner);
        nftV2.setMarketContract(address(marketV2));
        
        vm.prank(owner);
        uint256 tokenId = nftV2.mint(user1);
        
        // 用户授权给市场
        vm.prank(user1);
        nftV2.approveAllToMarket();
        
        // 创建签名数据
        uint256 price = 1 ether;
        uint256 nonce = marketV2.getNonce(user1);
        uint256 deadline = block.timestamp + 1 hours;
        
        // 创建 EIP-712 签名
        bytes32 structHash = keccak256(
            abi.encode(
                marketV2.LISTING_TYPEHASH(),
                address(nftV2),
                tokenId,
                price,
                user1,
                nonce,
                deadline
            )
        );
        
        // 使用合约提供的方法来获取正确的 typed data hash
        bytes32 digest = marketV2.getTypedDataHash(structHash);
        
        // 使用 user1 的私钥签名
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // 验证签名恢复正确
        address recoveredSigner = digest.recover(signature);
        assertEq(recoveredSigner, user1, "Signature recovery failed");
        
        // 测试签名上架功能
        marketV2.createListingWithSignature(
            address(nftV2),
            tokenId,
            price,
            user1,
            nonce,
            deadline,
            signature
        );
        
        // 验证签名上架成功
        (, , , , , , bool active, bool isSignatureListing) = marketV2.listings(1);
        assertTrue(isSignatureListing);
        assertTrue(active);
        
        // 验证 nonce 已增加
        assertEq(marketV2.getNonce(user1), 1);
        
        // 测试普通上架仍然工作（使用另一个 NFT）
        vm.prank(owner);
        uint256 tokenId2 = nftV2.mint(user1);
        vm.prank(user1);
        marketV2.createListing(address(nftV2), tokenId2, price);
        
        (, , , , , , bool active2, bool isSignatureListing2) = marketV2.listings(2);
        assertFalse(isSignatureListing2);
        assertTrue(active2);
    }
    
    function test_RevertWhen_UpgradeByNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        nft.upgradeToAndCall(address(nftV2Implementation), "");
    }
    
    function test_RevertWhen_DoubleInitialize() public {
        vm.expectRevert();
        nft.initialize("NewName", "NEW", user1);
    }
}