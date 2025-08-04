// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MyTokenV4.sol";
import "../src/MyNFTV4.sol";
import "../src/MyTokenBankV4.sol";
import "../src/MyNFTMarketV4.sol";
import "../src/Permit2.sol";
import "../src/EIP7702BatchExecutor.sol";

/**
 * @title DeployToSepolia
 * @dev 部署所有合约到 Sepolia 测试网并进行验证的脚本
 */
contract DeployToSepolia is Script {
    // Sepolia 链 ID
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    
    function run() external {
        // 确保在 Sepolia 网络上运行
        require(block.chainid == SEPOLIA_CHAIN_ID, "This script is only for Sepolia network");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Sepolia Deployment Started ===");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. 部署 MyTokenV4
        console.log("Deploying MyTokenV4...");
        MyTokenV4 token = new MyTokenV4();
        console.log("MyTokenV4 deployed to:", address(token));
        
        // 2. 部署 MyNFTV4
        console.log("Deploying MyNFTV4...");
        MyNFTV4 nft = new MyNFTV4();
        console.log("MyNFTV4 deployed to:", address(nft));
        
        // 3. 部署 Permit2
        console.log("Deploying Permit2...");
        Permit2 permit2 = new Permit2();
        console.log("Permit2 deployed to:", address(permit2));
        
        // 4. 部署 MyTokenBankV4
        console.log("Deploying MyTokenBankV4...");
        MyTokenBankV4 bank = new MyTokenBankV4();
        console.log("MyTokenBankV4 deployed to:", address(bank));
        
        // 5. 部署 MyNFTMarketV4
        console.log("Deploying MyNFTMarketV4...");
        MyNFTMarketV4 market = new MyNFTMarketV4(deployer);
        console.log("MyNFTMarketV4 deployed to:", address(market));
        
        // 6. 部署 EIP7702BatchExecutor
        console.log("Deploying EIP7702BatchExecutor...");
        EIP7702BatchExecutor batchExecutor = new EIP7702BatchExecutor();
        console.log("EIP7702BatchExecutor deployed to:", address(batchExecutor));
        
        vm.stopBroadcast();
        
        // 输出部署摘要
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("MyTokenV4:", address(token));
        console.log("MyNFTV4:", address(nft));
        console.log("Permit2:", address(permit2));
        console.log("MyTokenBankV4:", address(bank));
        console.log("MyNFTMarketV4:", address(market));
        console.log("EIP7702BatchExecutor:", address(batchExecutor));
        console.log("");
        
        // 输出验证命令
        console.log("=== Verification Commands ===");
        console.log("Run the following commands to verify contracts on Etherscan:");
        console.log("");
        
        // console.log("forge verify-contract %s src/MyTokenV4.sol:MyTokenV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY", address(token));
        // console.log("forge verify-contract %s src/MyNFTV4.sol:MyNFTV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY", address(nft));
        // console.log("forge verify-contract %s src/Permit2.sol:Permit2 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY", address(permit2));
        console.log("forge verify-contract %s src/MyTokenBankV4.sol:MyTokenBankV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY", address(bank));
        // console.log("forge verify-contract %s src/MyNFTMarketV4.sol:MyNFTMarketV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY --constructor-args %s", address(market), vm.toString(abi.encode(deployer)));
        // console.log("forge verify-contract %s src/EIP7702BatchExecutor.sol:EIP7702BatchExecutor --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY", address(batchExecutor));
        
        console.log("");
        console.log("=== Deployment Completed Successfully ===");
    }
}