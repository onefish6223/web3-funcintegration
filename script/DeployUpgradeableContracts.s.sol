// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/upgrades/UpgradeableNFTV1.sol";
import "../src/upgrades/UpgradeableNFTV2.sol";
import "../src/upgrades/UpgradeableNFTMarketV1.sol";
import "../src/upgrades/UpgradeableNFTMarketV2.sol";

/**
 * @title DeployUpgradeableContracts
 * @dev 部署可升级合约的脚本
 */
contract DeployUpgradeableContracts is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // uint256 deployerPrivateKey = vm.envUint("LOCAL_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // 1. 部署 NFT V1 实现合约
        UpgradeableNFTV1 nftV1Implementation = new UpgradeableNFTV1();
        console.log("NFT V1 Implementation deployed at:", address(nftV1Implementation));
        
        // 2. 部署 NFT 代理合约
        bytes memory nftInitData = abi.encodeWithSelector(
            UpgradeableNFTV1.initialize.selector,
            "UpgradeableNFT",
            "UNFT",
            deployer
        );
        
        ERC1967Proxy nftProxy = new ERC1967Proxy(
            address(nftV1Implementation),
            nftInitData
        );
        console.log("NFT Proxy deployed at:", address(nftProxy));
        
        // 3. 部署 NFT Market V1 实现合约
        UpgradeableNFTMarketV1 marketV1Implementation = new UpgradeableNFTMarketV1();
        console.log("NFT Market V1 Implementation deployed at:", address(marketV1Implementation));
        
        // 4. 部署 NFT Market 代理合约
        bytes memory marketInitData = abi.encodeWithSelector(
            UpgradeableNFTMarketV1.initialize.selector,
            deployer,  // owner
            deployer,  // feeReceiver
            250        // 2.5% platform fee
        );
        
        ERC1967Proxy marketProxy = new ERC1967Proxy(
            address(marketV1Implementation),
            marketInitData
        );
        console.log("NFT Market Proxy deployed at:", address(marketProxy));
        
        // 5. 部署 NFT V2 实现合约（用于后续升级）
        UpgradeableNFTV2 nftV2Implementation = new UpgradeableNFTV2();
        console.log("NFT V2 Implementation deployed at:", address(nftV2Implementation));
        
        // 6. 部署 NFT Market V2 实现合约（用于后续升级）
        UpgradeableNFTMarketV2 marketV2Implementation = new UpgradeableNFTMarketV2();
        console.log("NFT Market V2 Implementation deployed at:", address(marketV2Implementation));
        
        // 7. 测试基本功能
        UpgradeableNFTV1 nft = UpgradeableNFTV1(address(nftProxy));
        UpgradeableNFTMarketV1 market = UpgradeableNFTMarketV1(address(marketProxy));
        
        console.log("NFT name:", nft.name());
        console.log("NFT symbol:", nft.symbol());
        console.log("NFT version:", nft.version());
        console.log("Market version:", market.version());
        
        // 8. 铸造一个测试 NFT
        uint256 tokenId = nft.mint(deployer);
        console.log("Minted NFT with token ID:", tokenId);
        console.log("NFT owner:", nft.ownerOf(tokenId));
        
        vm.stopBroadcast();
        
        // 输出部署信息
        console.log("\n=== Deployment Summary ===");
        console.log("NFT Proxy (Main Contract):", address(nftProxy));
        console.log("NFT V1 Implementation:", address(nftV1Implementation));
        console.log("NFT V2 Implementation:", address(nftV2Implementation));
        console.log("Market Proxy (Main Contract):", address(marketProxy));
        console.log("Market V1 Implementation:", address(marketV1Implementation));
        console.log("Market V2 Implementation:", address(marketV2Implementation));
    }
}