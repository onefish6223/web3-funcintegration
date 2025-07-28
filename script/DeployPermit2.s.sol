// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Permit2.sol";

contract DeployPermit2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署 Permit2 合约
        Permit2 permit2 = new Permit2();
        
        console.log("Permit2 deployed to:", address(permit2));
        console.log("Domain Separator:", vm.toString(permit2.DOMAIN_SEPARATOR()));
        console.log("Version:", permit2.version());
        
        vm.stopBroadcast();
    }
    
    function runLocal() external {
        vm.startBroadcast();
        
        // 部署 Permit2 合约
        Permit2 permit2 = new Permit2();
        
        console.log("Permit2 deployed to:", address(permit2));
        console.log("Domain Separator:", vm.toString(permit2.DOMAIN_SEPARATOR()));
        console.log("Version:", permit2.version());
        
        vm.stopBroadcast();
    }
}