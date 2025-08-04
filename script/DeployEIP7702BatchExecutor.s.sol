// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EIP7702BatchExecutor.sol";

/**
 * @title DeployEIP7702BatchExecutor
 * @dev 部署 EIP7702BatchExecutor 合约的脚本
 */
contract DeployEIP7702BatchExecutor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署 EIP7702BatchExecutor 合约
        EIP7702BatchExecutor batchExecutor = new EIP7702BatchExecutor();
        
        vm.stopBroadcast();
        
        console.log("EIP7702BatchExecutor deployed to:", address(batchExecutor));
        console.log("Deployment completed successfully!");
        
        // 输出部署信息
        console.log("\n=== Deployment Summary ===");
        console.log("Contract: EIP7702BatchExecutor");
        console.log("Address:", address(batchExecutor));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
    }
}