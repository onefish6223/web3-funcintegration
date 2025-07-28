// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MyTokenV4.sol";
import "../src/MyNFTV4.sol";
import "../src/MyTokenBankV4.sol";
import "../src/MyNFTMarketV4.sol";
import "../src/Permit2.sol";

contract DeployContracts is Script {
    function run() external {
        vm.startBroadcast();
        MyTokenV4 token = new MyTokenV4();
        MyNFTV4 nft = new MyNFTV4();
        Permit2 permit2 = new Permit2();
        MyTokenBankV4 bank = new MyTokenBankV4(address(permit2));
        MyNFTMarketV4 market = new MyNFTMarketV4(msg.sender);
        vm.stopBroadcast();
        console.logAddress(address(token));
        console.logAddress(address(nft));
        console.logAddress(address(permit2));
        console.logAddress(address(bank));
        console.logAddress(address(market));
    }
}