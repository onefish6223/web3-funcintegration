// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/MyNFTMarketV4.sol";
import "../contracts/mocks/MockERC20WithPermit.sol";
import "../contracts/mocks/MockERC721.sol";
import "../contracts/mocks/MockERC1155.sol";

contract MyNFTMarketV4ExtendedTest is Test {
    MyNFTMarketV4 public nftMarket;
    MockERC721 public mockERC721;
    MockERC1155 public mockERC1155;
    MockERC20WithPermit public mockERC20;
    
    address public owner;
    address public seller;
    address public buyer;
    address public whitelistUser;
    address public nonWhitelistUser;
    
    uint256 constant PLATFORM_FEE = 250; // 2.5%
    uint256 constant WHITELIST_DISCOUNT = 5000; // 50%
    uint256 constant NFT_PRICE = 2 ether; // 2 tokens
    
    bytes32 public merkleRoot;
    bytes32[] public whitelistProof;
    
    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        whitelistUser = makeAddr("whitelistUser");
        nonWhitelistUser = makeAddr("nonWhitelistUser");
        
        // 部署Mock合约
        mockERC20 = new MockERC20WithPermit("Test Token", "TEST", 18);
        mockERC721 = new MockERC721("Test NFT", "TNFT");
        mockERC1155 = new MockERC1155("https://test.com/{id}.json");
        
        // 部署NFT市场
        nftMarket = new MyNFTMarketV4(owner);
        
        // 设置白名单折扣
        nftMarket.setWhitelistDiscount(WHITELIST_DISCOUNT);
        
        // 创建简单的默克尔树根（仅包含whitelistUser）
        merkleRoot = keccak256(abi.encodePacked(whitelistUser));
        nftMarket.setMerkleRoot(merkleRoot);
        
        // 为whitelistUser创建证明（简单情况下就是自己的hash）
        //todo
        whitelistProof.push(merkleRoot);
        
        // 给用户铸造代币
        mockERC20.mint(buyer, 100 ether);
        mockERC20.mint(whitelistUser, 100 ether);
        
        // 给卖家铸造NFT
        vm.prank(seller);
        mockERC721.mint(seller, 1);
        
        vm.prank(seller);
        mockERC1155.mint(seller, 1, 10, "");
        
        // 授权NFT市场转移NFT
        vm.prank(seller);
        mockERC721.setApprovalForAll(address(nftMarket), true);
        
        vm.prank(seller);
        mockERC1155.setApprovalForAll(address(nftMarket), true);
    }
    
    function testCreateERC721ListingWithToken() public {
        vm.prank(seller);
        nftMarket.create721ListingWithToken(
            address(mockERC721),
            1,
            address(mockERC20),
            NFT_PRICE,
            true
        );
        
        MyNFTMarketV4.Listing memory listing = nftMarket.getNFTListing(address(mockERC721), 1);
        assertEq(listing.paymentToken, address(mockERC20));
        assertTrue(listing.requiresWhitelist);
        assertEq(listing.price, NFT_PRICE);
    }
    
    function testCreateERC1155ListingWithToken() public {
        vm.prank(seller);
        nftMarket.create1155ListingWithToken(
            address(mockERC1155),
            1,
            address(mockERC20),
            NFT_PRICE,
            5,
            false
        );
        
        MyNFTMarketV4.Listing memory listing = nftMarket.getNFTListing(address(mockERC1155), 1);
        assertEq(listing.paymentToken, address(mockERC20));
        assertFalse(listing.requiresWhitelist);
        assertEq(listing.amount, 5);
    }
    
    function testPermitPrePay() public {
        uint256 amount = 10 ether;
        uint256 deadline = block.timestamp + 3600;
        
        // 创建permit签名
        uint256 buyerPrivateKey = 0x1234;
        address buyerAddr = vm.addr(buyerPrivateKey);
        
        // 给buyer铸造代币
        mockERC20.mint(buyerAddr, 100 ether);
        
        // 获取nonce
        uint256 nonce = mockERC20.nonces(buyerAddr);
        
        // 创建permit签名
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                buyerAddr,
                address(nftMarket),
                amount,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                mockERC20.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPrivateKey, hash);
        
        // 执行permitPrePay
        vm.prank(buyerAddr);
        nftMarket.permitPrePay(
            address(mockERC20),
            amount,
            deadline,
            v,
            r,
            s
        );
        
        // 验证预付费余额
        uint256 balance = nftMarket.getPermitPrePaidBalance(buyerAddr, address(mockERC20));
        assertEq(balance, amount);
    }
    
    function testClaimNFTWithWhitelist() public {
        // 创建需要白名单的listing
        vm.prank(seller);
        nftMarket.create721ListingWithToken(
            address(mockERC721),
            1,
            address(mockERC20),
            NFT_PRICE,
            true
        );
        
        // 为whitelistUser设置预付费
        uint256 amount = 10 ether;
        uint256 deadline = block.timestamp + 3600;
        
        uint256 whitelistPrivateKey = 0x5678;
        address whitelistAddr = vm.addr(whitelistPrivateKey);
        
        // 更新merkleRoot以包含新的whitelistAddr
        merkleRoot = keccak256(abi.encodePacked(whitelistAddr));
        nftMarket.setMerkleRoot(merkleRoot);
        
        // 给whitelistAddr铸造代币
        mockERC20.mint(whitelistAddr, 100 ether);
        
        // 创建permit签名
        uint256 nonce = mockERC20.nonces(whitelistAddr);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                whitelistAddr,
                address(nftMarket),
                amount,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                mockERC20.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(whitelistPrivateKey, hash);
        
        // 执行permitPrePay
        vm.prank(whitelistAddr);
        nftMarket.permitPrePay(
            address(mockERC20),
            amount,
            deadline,
            v,
            r,
            s
        );
        
        // 创建默克尔证明
        bytes32[] memory proof = new bytes32[](0); // 单个叶子节点，不需要证明
        
        // 执行claimNFT
        vm.prank(whitelistAddr);
        nftMarket.claimNFT(1, 1, proof);
        
        // 验证NFT所有权
        assertEq(mockERC721.ownerOf(1), whitelistAddr);
        
        // 验证已认领状态
        assertTrue(nftMarket.hasClaimedNFT(whitelistAddr, 1));
        
        // 验证折扣价格计算
        uint256 originalPrice = NFT_PRICE;
        uint256 discountedPrice = (originalPrice * (10000 - WHITELIST_DISCOUNT)) / 10000;
        uint256 remainingBalance = nftMarket.getPermitPrePaidBalance(whitelistAddr, address(mockERC20));
        assertEq(remainingBalance, amount - discountedPrice);
    }
    
    function testMulticall() public {
        // 创建需要白名单的listing
        vm.prank(seller);
        nftMarket.create721ListingWithToken(
            address(mockERC721),
            1,
            address(mockERC20),
            NFT_PRICE,
            true
        );
        
        // 构建包含4个叶子节点的默克尔树
        uint256 whitelistPrivateKey1 = 0x1111;
        uint256 whitelistPrivateKey2 = 0x2222;
        uint256 whitelistPrivateKey3 = 0x3333;
        uint256 whitelistPrivateKey4 = 0x4444;
        
        address whitelistAddr1 = vm.addr(whitelistPrivateKey1);
        address whitelistAddr2 = vm.addr(whitelistPrivateKey2);
        address whitelistAddr3 = vm.addr(whitelistPrivateKey3);
        address whitelistAddr4 = vm.addr(whitelistPrivateKey4);
        
        // 构建叶子节点
        bytes32 leaf1 = keccak256(abi.encodePacked(whitelistAddr1));
        bytes32 leaf2 = keccak256(abi.encodePacked(whitelistAddr2));
        bytes32 leaf3 = keccak256(abi.encodePacked(whitelistAddr3));
        bytes32 leaf4 = keccak256(abi.encodePacked(whitelistAddr4));
        
        // 构建默克尔树（确保按字典序排列）
        bytes32 node1 = leaf1 < leaf2 ? keccak256(abi.encodePacked(leaf1, leaf2)) : keccak256(abi.encodePacked(leaf2, leaf1));
        bytes32 node2 = leaf3 < leaf4 ? keccak256(abi.encodePacked(leaf3, leaf4)) : keccak256(abi.encodePacked(leaf4, leaf3));
        
        // 根节点
        merkleRoot = node1 < node2 ? keccak256(abi.encodePacked(node1, node2)) : keccak256(abi.encodePacked(node2, node1));
        nftMarket.setMerkleRoot(merkleRoot);
        
        // 给whitelistAddr1铸造代币
        mockERC20.mint(whitelistAddr1, 100 ether);
        
        // 创建permit签名
        uint256 amount = 10 ether;
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = mockERC20.nonces(whitelistAddr1);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                whitelistAddr1,
                address(nftMarket),
                amount,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                mockERC20.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(whitelistPrivateKey1, hash);
        
        // 构建multicall调用
        bytes[] memory calls = new bytes[](2);
        
        // permitPrePay调用
        calls[0] = abi.encodeWithSelector(
            nftMarket.permitPrePay.selector,
            address(mockERC20),
            amount,
            deadline,
            v,
            r,
            s
        );
        
        // 为whitelistAddr1构建默克尔证明
        bytes32[] memory proof = new bytes32[](2);
        
        // whitelistAddr1的证明路径：
        // 1. 需要leaf2作为兄弟节点来构建node1
        proof[0] = leaf2;
        // 2. 需要node2作为兄弟节点来构建根节点
        proof[1] = node2;
        
        // claimNFT调用
        calls[1] = abi.encodeWithSelector(
            nftMarket.claimNFT.selector,
            1,
            1,
            proof
        );
        
        // 执行multicall
        vm.prank(whitelistAddr1);
        nftMarket.multicall(calls);
        
        // 验证结果
        assertEq(mockERC721.ownerOf(1), whitelistAddr1);
        assertTrue(nftMarket.hasClaimedNFT(whitelistAddr1, 1));
        
        // 验证默克尔树结构正确性
        // 手动验证whitelistAddr1的路径
        bytes32 computedHash = leaf1;
        
        // 第一层合并：leaf1 + leaf2 -> node1
        if (leaf1 < leaf2) {
            computedHash = keccak256(abi.encodePacked(computedHash, leaf2));
        } else {
            computedHash = keccak256(abi.encodePacked(leaf2, computedHash));
        }
        
        // 第二层合并：node1 + node2 -> root
        if (computedHash < node2) {
            computedHash = keccak256(abi.encodePacked(computedHash, node2));
        } else {
            computedHash = keccak256(abi.encodePacked(node2, computedHash));
        }
        
        assertEq(computedHash, merkleRoot, "Manual verification should match merkle root");
    }
    
    function testSetMerkleRoot() public {
        bytes32 newRoot = keccak256("new root");
        
        vm.expectEmit(true, true, true, true);
        emit MyNFTMarketV4.MerkleRootUpdated(newRoot, block.timestamp);
        
        nftMarket.setMerkleRoot(newRoot);
    }
    
    function testSetWhitelistDiscount() public {
        uint256 newDiscount = 3000; // 30%
        
        vm.expectEmit(true, true, true, true);
        emit MyNFTMarketV4.WhitelistDiscountUpdated(newDiscount, block.timestamp);
        
        nftMarket.setWhitelistDiscount(newDiscount);
    }
    
    function testRevertDiscountOver100Percent() public {
        vm.expectRevert("Discount cannot exceed 100%");
        nftMarket.setWhitelistDiscount(10001);
    }
    
    function testRevertInvalidMerkleProof() public {
        // 创建需要白名单的listing
        vm.prank(seller);
        nftMarket.create721ListingWithToken(
            address(mockERC721),
            1,
            address(mockERC20),
            NFT_PRICE,
            true
        );
        
        // 尝试用错误的证明认领
        bytes32[] memory invalidProof = new bytes32[](1);
        invalidProof[0] = keccak256("invalid");
        
        vm.expectRevert("Invalid merkle proof");
        vm.prank(nonWhitelistUser);
        nftMarket.claimNFT(1, 1, invalidProof);
    }
    
    function testRevertDoubleClaimNFT() public {
        // 创建需要白名单的listing
        vm.prank(seller);
        nftMarket.create721ListingWithToken(
            address(mockERC721),
            1,
            address(mockERC20),
            NFT_PRICE,
            true
        );
        
        uint256 whitelistPrivateKey = 0x7777;
        address whitelistAddr = vm.addr(whitelistPrivateKey);
        
        // 更新merkleRoot
        merkleRoot = keccak256(abi.encodePacked(whitelistAddr));
        nftMarket.setMerkleRoot(merkleRoot);
        
        // 给whitelistAddr铸造代币并设置预付费
        mockERC20.mint(whitelistAddr, 100 ether);
        
        uint256 amount = 10 ether;
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = mockERC20.nonces(whitelistAddr);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                whitelistAddr,
                address(nftMarket),
                amount,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                mockERC20.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(whitelistPrivateKey, hash);
        
        vm.prank(whitelistAddr);
        nftMarket.permitPrePay(
            address(mockERC20),
            amount,
            deadline,
            v,
            r,
            s
        );
        
        bytes32[] memory proof = new bytes32[](0);
        
        // 第一次认领
        vm.prank(whitelistAddr);
        nftMarket.claimNFT(1, 1, proof);
        
        // 尝试第二次认领
        vm.expectRevert("Already claimed this NFT");
        vm.prank(whitelistAddr);
        nftMarket.claimNFT(1, 1, proof);
    }
}