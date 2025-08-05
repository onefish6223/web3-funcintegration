// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/upgrades/UpgradeableNFTV1.sol";
import "../src/upgrades/UpgradeableNFTV2.sol";
import "../src/upgrades/UpgradeableNFTMarketV1.sol";
import "../src/upgrades/UpgradeableNFTMarketV2.sol";

/**
 * @title UpgradeContracts
 * @dev 升级合约从 V1 到 V2 的脚本
 */
contract UpgradeContracts is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // 从环境变量获取代理合约地址
        address nftProxyAddress = 0x552e25C62519730450BDBC5ee32Da2381b7944CC;
        address marketProxyAddress = 0xd6090807ED532914c876d0ba25053642038f1C12;
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Upgrader:", deployer);
        console.log("NFT Proxy Address:", nftProxyAddress);
        console.log("Market Proxy Address:", marketProxyAddress);
        
        // 1. 升级前检查状态
        UpgradeableNFTV1 nftV1 = UpgradeableNFTV1(nftProxyAddress);
        UpgradeableNFTMarketV1 marketV1 = UpgradeableNFTMarketV1(marketProxyAddress);
        
        console.log("\n=== Pre-upgrade State ===");
        // 保存升级前状态用于后续对比
        uint256 preNftTotalSupply = nftV1.totalSupply();
        uint256 preNftNextTokenId = nftV1.nextTokenId();
        uint256 preMarketNextListingId = marketV1.nextListingId();
        uint256 preMarketPlatformFee = marketV1.platformFeePercentage();
        
        console.log("NFT Version:", nftV1.version());
        console.log("NFT Total Supply:", preNftTotalSupply);
        console.log("NFT Next Token ID:", preNftNextTokenId);
        console.log("Market Version:", marketV1.version());
        console.log("Market Next Listing ID:", preMarketNextListingId);
        console.log("Market Platform Fee:", preMarketPlatformFee);
        
        // 2. 部署新的实现合约
        UpgradeableNFTV2 nftV2Implementation = UpgradeableNFTV2(0xdd4453f35708D24cBcA2E9A076f089600E9Fb7EE);
        UpgradeableNFTMarketV2 marketV2Implementation = UpgradeableNFTMarketV2(0x728dAEB4FEBF21248659E5d30c84b4096eae8c3c);
        
        console.log("\n=== New Implementations ===");
        console.log("NFT V2 Implementation:", address(nftV2Implementation));
        console.log("Market V2 Implementation:", address(marketV2Implementation));
        
        // 3. 升级 NFT 合约
        nftV1.upgradeToAndCall(address(nftV2Implementation), "");
        console.log("NFT contract upgraded to V2");
        
        // 4. 升级 Market 合约
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        console.log("Market contract upgraded to V2");
        
        // 5. 升级后检查状态
        UpgradeableNFTV2 nftV2 = UpgradeableNFTV2(nftProxyAddress);
        UpgradeableNFTMarketV2 marketV2 = UpgradeableNFTMarketV2(marketProxyAddress);
        
        console.log("\n=== Post-upgrade State ===");
        uint256 postNftTotalSupply = nftV2.totalSupply();
        uint256 postNftNextTokenId = nftV2.nextTokenId();
        uint256 postMarketNextListingId = marketV2.nextListingId();
        uint256 postMarketPlatformFee = marketV2.platformFeePercentage();
        
        console.log("NFT Version:", nftV2.version());
        console.log("NFT Total Supply:", postNftTotalSupply);
        console.log("NFT Next Token ID:", postNftNextTokenId);
        console.log("Market Version:", marketV2.version());
        console.log("Market Next Listing ID:", postMarketNextListingId);
        console.log("Market Platform Fee:", postMarketPlatformFee);
        
        // 6. 状态对比验证
        console.log("\n=== State Comparison Verification ===");
        bool stateValid = true;
        
        // 验证 NFT 状态保持
         if (preNftTotalSupply != postNftTotalSupply) {
             console.log("[ERROR] NFT Total Supply mismatch! Pre:", preNftTotalSupply, "Post:", postNftTotalSupply);
             stateValid = false;
         } else {
             console.log("[PASS] NFT Total Supply preserved:", postNftTotalSupply);
         }
         
         if (preNftNextTokenId != postNftNextTokenId) {
             console.log("[ERROR] NFT Next Token ID mismatch! Pre:", preNftNextTokenId, "Post:", postNftNextTokenId);
             stateValid = false;
         } else {
             console.log("[PASS] NFT Next Token ID preserved:", postNftNextTokenId);
         }
         
         // 验证 Market 状态保持
         if (preMarketNextListingId != postMarketNextListingId) {
             console.log("[ERROR] Market Next Listing ID mismatch! Pre:", preMarketNextListingId, "Post:", postMarketNextListingId);
             stateValid = false;
         } else {
             console.log("[PASS] Market Next Listing ID preserved:", postMarketNextListingId);
         }
         
         if (preMarketPlatformFee != postMarketPlatformFee) {
             console.log("[ERROR] Market Platform Fee mismatch! Pre:", preMarketPlatformFee, "Post:", postMarketPlatformFee);
             stateValid = false;
         } else {
             console.log("[PASS] Market Platform Fee preserved:", postMarketPlatformFee);
         }
         
         // 验证版本升级
         string memory nftVersion = nftV2.version();
         string memory marketVersion = marketV2.version();
         
         if (keccak256(abi.encodePacked(nftVersion)) == keccak256(abi.encodePacked("2.0.0"))) {
             console.log("[PASS] NFT version correctly upgraded to:", nftVersion);
         } else {
             console.log("[ERROR] NFT version upgrade failed. Expected: 2.0.0, Got:", nftVersion);
             stateValid = false;
         }
         
         if (keccak256(abi.encodePacked(marketVersion)) == keccak256(abi.encodePacked("2.0.0"))) {
             console.log("[PASS] Market version correctly upgraded to:", marketVersion);
         } else {
             console.log("[ERROR] Market version upgrade failed. Expected: 2.0.0, Got:", marketVersion);
             stateValid = false;
         }
         
         // 总体验证结果
         if (stateValid) {
             console.log("\n[SUCCESS] State verification PASSED - All data preserved correctly!");
         } else {
             console.log("\n[FAILED] State verification FAILED - Data inconsistency detected!");
             revert("Upgrade state verification failed");
         }
        
        // 6. 测试新功能
        console.log("\n=== Testing New Features ===");
        
        // 设置市场合约地址到 NFT 合约
        nftV2.setMarketContract(marketProxyAddress);
        console.log("Market contract set in NFT V2");
        
        // 铸造一个新的 NFT 来测试
        uint256 newTokenId = nftV2.mint(deployer);
        console.log("Minted new NFT with token ID:", newTokenId);
        
        // 测试一次性授权功能
        nftV2.approveAllToMarket();
        console.log("Approved all NFTs to market");
        
        bool isApproved = nftV2.isApprovedForMarket(deployer);
        console.log("Is approved for market:", isApproved);
        
        // 获取用户的 nonce（V2 新功能）
        uint256 userNonce = marketV2.getNonce(deployer);
        console.log("User nonce:", userNonce);
        
        vm.stopBroadcast();
        
        console.log("\n=== Upgrade Complete ===");
        console.log("Both contracts successfully upgraded to V2");
        console.log("State preservation verified");
        console.log("New features are functional");
    }
}