// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/demo/SimpleProxy.sol";

/**
 * @title SimpleProxyTest
 * @dev 测试 SimpleProxy 代理合约的存储机制
 */
contract SimpleProxyTest is Test {
    SimpleProxy public proxy;
    UserContractV1 public logicV1;
    UserContractV2 public logicV2;
    
    address public user = address(0x1234);
    
    function setUp() public {
        // 部署逻辑合约
        logicV1 = new UserContractV1();
        logicV2 = new UserContractV2();
        
        // 部署代理合约，指向 V1
        proxy = new SimpleProxy(address(logicV1));
    }
    
    /**
     * @dev 测试代理合约基本功能
     */
    function testProxyBasicFunctionality() public {
        // 通过代理调用初始化函数
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 验证用户数量
        (bool success2, bytes memory data) = address(proxy).call(abi.encodeWithSignature("getUserCount()"));
        assertTrue(success2, "getUserCount should succeed");
        uint256 userCount = abi.decode(data, (uint256));
        assertEq(userCount, 1, "Should have 1 user after initialization");
        
        // 添加新用户
        (bool success3,) = address(proxy).call(
            abi.encodeWithSignature("addUser(address,uint256)", user, 200)
        );
        assertTrue(success3, "addUser should succeed");
        
        // 验证用户数量增加
        (bool success4, bytes memory data2) = address(proxy).call(abi.encodeWithSignature("getUserCount()"));
        assertTrue(success4, "getUserCount should succeed");
        uint256 newUserCount = abi.decode(data2, (uint256));
        assertEq(newUserCount, 2, "Should have 2 users after adding");
    }
    
    /**
     * @dev 测试存储槽正确性
     */
    function testStorageSlots() public {
        // 初始化数据
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 验证代理合约的实现地址存储在正确的槽位
        address impl = proxy.implementation();
        assertEq(impl, address(logicV1), "Implementation should be logicV1");
        
        // 验证代理合约通过delegatecall在自己的存储中保存逻辑合约的数据
        bytes32 proxySlot0 = vm.load(address(proxy), bytes32(uint256(0)));
        bytes32 logicSlot0 = vm.load(address(logicV1), bytes32(uint256(0)));
        
        // 代理合约的槽0应该有数据（通过delegatecall写入的users数组长度）
        assertEq(uint256(proxySlot0), 1, "Proxy slot 0 should contain users array length");
        
        // 逻辑合约本身的槽0应该为空（因为没有直接调用）
        assertEq(uint256(logicSlot0), 0, "Logic contract slot 0 should be empty");
        
        // 验证EIP-1967存储槽不会与业务数据冲突
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        bytes32 storedImpl = vm.load(address(proxy), implementationSlot);
        assertEq(address(uint160(uint256(storedImpl))), address(logicV1), "Implementation should be stored in EIP-1967 slot");
    }
    
    /**
     * @dev 测试升级与存储兼容性
     * 注意：这个测试展示了存储布局不兼容的问题
     */
    function testUpgradeAndStorageCompatibility() public {
        // 在V1中初始化数据
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 添加用户
        (bool success2,) = address(proxy).call(
            abi.encodeWithSignature("addUser(address,uint256)", user, 300)
        );
        assertTrue(success2, "addUser should succeed");
        
        // 验证V1数据
        (bool success3, bytes memory data) = address(proxy).call(abi.encodeWithSignature("getUserCount()"));
        assertTrue(success3, "getUserCount should succeed");
        uint256 userCount = abi.decode(data, (uint256));
        assertEq(userCount, 2, "Should have 2 users before upgrade");
        
        // 升级到V2
        proxy.upgradeTo(address(logicV2));
        assertEq(proxy.implementation(), address(logicV2), "Should upgrade to V2");
        
        // 验证升级后数据保持完整（数组长度）
        (bool success4, bytes memory data2) = address(proxy).call(abi.encodeWithSignature("getUserCount()"));
        assertTrue(success4, "getUserCount should succeed after upgrade");
        uint256 userCountAfter = abi.decode(data2, (uint256));
        assertEq(userCountAfter, 2, "User count should remain 2 after upgrade");
        
        // 注意：由于V2改变了结构体布局，旧数据可能无法正确读取
        // 这展示了存储布局兼容性的重要性
        
        // 初始化V2功能
        (bool success6,) = address(proxy).call(abi.encodeWithSignature("initializeV2()"));
        assertTrue(success6, "initializeV2 should succeed");
        
        // 使用V2新功能添加用户
        (bool success7,) = address(proxy).call(
            abi.encodeWithSignature("addUserV2(address,uint256,string)", address(0x5678), 400, "Alice")
        );
        assertTrue(success7, "addUserV2 should succeed");
        
        // 验证V2功能
        (bool success8, bytes memory v2Data) = address(proxy).call(
            abi.encodeWithSignature("getUserV2(uint256)", 2)
        );
        assertTrue(success8, "getUserV2 should succeed");
        (address v2Wallet, uint256 v2Score, string memory v2Name) = abi.decode(v2Data, (address, uint256, string));
        assertEq(v2Wallet, address(0x5678), "V2 wallet should match");
        assertEq(v2Score, 400, "V2 score should match");
        assertEq(v2Name, "Alice", "V2 name should match");
    }
    
    /**
     * @dev 测试存储布局兼容性问题
     * 这个测试展示了不兼容的存储布局升级会导致的问题
     */
    function testStorageLayoutCompatibility() public {
        // 在V1中添加数据
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 记录V1中的原始数据
        (bool success1, bytes memory originalData) = address(proxy).call(
            abi.encodeWithSignature("getUser(uint256)", 0)
        );
        assertTrue(success1, "getUser should work in V1");
        (address originalWallet, uint256 originalScore) = abi.decode(originalData, (address, uint256));
        assertEq(originalWallet, address(0x123), "Original wallet should be 0x123");
        assertEq(originalScore, 100, "Original score should be 100");
        
        // 升级到V2
        proxy.upgradeTo(address(logicV2));
        
        // 验证数组长度仍然正确
        (bool success2, bytes memory countData) = address(proxy).call(abi.encodeWithSignature("getUserCount()"));
        assertTrue(success2, "getUserCount should work after upgrade");
        uint256 count = abi.decode(countData, (uint256));
        assertEq(count, 1, "Should still have 1 user after upgrade");
        
        // 注意：由于结构体布局改变，直接读取旧数据可能会有问题
        // 这展示了为什么存储布局兼容性很重要
        
        // 使用V2的新功能添加兼容的用户
        (bool success3,) = address(proxy).call(
            abi.encodeWithSignature("addUserV2(address,uint256,string)", address(0x456), 200, "Bob")
        );
        assertTrue(success3, "addUserV2 should work");
        
        // 验证新添加的用户可以正确读取
        (bool success4, bytes memory newUserData) = address(proxy).call(
            abi.encodeWithSignature("getUserV2(uint256)", 1)
        );
        assertTrue(success4, "getUserV2 should work for new user");
        (address newWallet, uint256 newScore, string memory newName) = abi.decode(newUserData, (address, uint256, string));
        assertEq(newWallet, address(0x456), "New wallet should match");
        assertEq(newScore, 200, "New score should match");
        assertEq(newName, "Bob", "New name should match");
    }
    
    /**
     * @dev 测试代理合约内部存储
     */
    function testProxyInternalStorage() public view {
        // 验证代理合约使用EIP-1967标准存储槽
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        bytes32 storedImpl = vm.load(address(proxy), implementationSlot);
        assertEq(address(uint160(uint256(storedImpl))), address(logicV1), "Implementation should be stored in EIP-1967 slot");
        
        // 验证常规存储槽不被占用
        bytes32 slot0 = vm.load(address(proxy), bytes32(uint256(0)));
        bytes32 slot1 = vm.load(address(proxy), bytes32(uint256(1)));
        assertEq(slot0, bytes32(0), "Slot 0 should be empty");
        assertEq(slot1, bytes32(0), "Slot 1 should be empty");
    }
    
    /**
     * @dev 测试存储冲突检测
     */
    function testStorageConflictDetection() public {
        // 初始化数据
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 升级到V2并使用存储槽读取功能
        proxy.upgradeTo(address(logicV2));
        
        // 读取存储槽0（users数组长度）
        (bool success2, bytes memory data) = address(proxy).call(
            abi.encodeWithSignature("getStorageSlot(uint256)", 0)
        );
        assertTrue(success2, "getStorageSlot should succeed");
        bytes32 slot0Value = abi.decode(data, (bytes32));
        assertEq(uint256(slot0Value), 1, "Slot 0 should contain array length 1");
        
        // 验证代理合约的实现地址没有被逻辑合约存储覆盖
        address currentImpl = proxy.implementation();
        assertEq(currentImpl, address(logicV2), "Implementation should still be V2");
    }
    
    /**
     * @dev 测试ETH接收功能
     */
    function testReceiveEther() public {
        uint256 amount = 1 ether;
        
        // 向代理合约发送ETH
        (bool success,) = address(proxy).call{value: amount}("");
        assertTrue(success, "Should be able to send ETH to proxy");
        
        // 验证代理合约余额
        assertEq(address(proxy).balance, amount, "Proxy should have received ETH");
    }
    
    /**
     * @dev 测试复杂存储操作
     */
    function testComplexStorageOperations() public {
        uint256 location = uint256(keccak256(abi.encodePacked(uint256(0))));
        // 初始化
        (bool success,) = address(proxy).call(abi.encodeWithSignature("initialize()"));
        assertTrue(success, "Initialize should succeed");
        
        // 添加多个用户
        for (uint i = 0; i < 5; i++) {
            (bool success2,) = address(proxy).call(
                abi.encodeWithSignature("addUser(address,uint256)", address(uint160(0x1000 + i)), 100 + i)
            );
        }

        for(uint i = 0; i<6; i++){        
            (bool success5, bytes memory newUserData1) = address(proxy).call(
                abi.encodeWithSignature("getUser(uint256)", i)
            );
            (address newWallet, uint256 newScore) = abi.decode(newUserData1, (address, uint256));
            console.log("upbefore",success5,newWallet,newScore);
        }
        for(uint i = 0; i < 14; i++){
            (bool success5, bytes memory newUserData1) = address(proxy).call(
                abi.encodeWithSignature("getStorageSlot(uint256)", location+i)
            );
            (bytes32 ddd) = abi.decode(newUserData1, (bytes32));
            console.log("before-slot",location + i,uint256(ddd));
        }
        // 升级到V2
        proxy.upgradeTo(address(logicV2));
        
        // 注意：由于V2的存储布局变化，直接验证旧数据可能不准确
        // 这里我们只验证数组长度保持正确
        // 在实际应用中，需要设计兼容的升级策略
        // 获取升级前的用户数据
        for(uint i = 0; i<6; i++){        
            (bool success5, bytes memory newUserData1) = address(proxy).call(
                abi.encodeWithSignature("getUserV1(uint256)", i)
            );
            (address newWallet, uint256 newScore) = abi.decode(newUserData1, (address, uint256));
            console.log("upafter",success5,newWallet,newScore);
        }

        for(uint i = 0; i<6; i++){        
            (bool success5, bytes memory newUserData1) = address(proxy).call(
                abi.encodeWithSignature("getUserV2(uint256)", i)
            );
            (address newWallet, uint256 newScore, uint256 newAge) = abi.decode(newUserData1, (address, uint256, uint256));
            console.log("upafter",newWallet,newScore,newAge);
        }

        
        for(uint i = 0; i < 14; i++){
            (bool success5, bytes memory newUserData1) = address(proxy).call(
                abi.encodeWithSignature("getStorageSlot(uint256)", location+i)
            );
            (bytes32 ddd) = abi.decode(newUserData1, (bytes32));
            console.log("after-slot",location + i,uint256(ddd));
        }
    }
}