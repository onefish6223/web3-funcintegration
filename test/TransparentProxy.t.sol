// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/demo/TransparentProxy.sol";

/**
 * @title TransparentProxyTest
 * @dev 测试透明代理合约的存储机制
 */
contract TransparentProxyTest is Test {
    TransparentProxy public proxy;
    LogicContractV1 public logicV1;
    LogicContractV2 public logicV2;
    
    address public admin;
    address public user;
    
    function setUp() public {
        admin = address(this);
        user = makeAddr("user");
        
        // 部署逻辑合约V1
        logicV1 = new LogicContractV1();
        
        // 部署代理合约
        proxy = new TransparentProxy(address(logicV1));
        
        // 部署逻辑合约V2
        logicV2 = new LogicContractV2();
    }
    
    /**
     * @dev 测试代理合约的基本功能
     */
    function testProxyBasicFunctionality() public {
        // 验证管理员和实现地址
        assertEq(proxy.admin(), admin);
        assertEq(proxy.implementation(), address(logicV1));
        
        // 使用普通用户通过代理调用逻辑合约的初始化函数
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 100));
        assertTrue(success1);
        
        // 使用普通用户验证状态变量是否正确设置
        vm.prank(user);
        (bool success2, bytes memory data) = address(proxy).call(abi.encodeWithSignature("value()"));
        assertTrue(success2);
        uint256 value = abi.decode(data, (uint256));
        assertEq(value, 100);
    }
    
    /**
     * @dev 测试存储槽的正确性
     */
    function testStorageSlots() public {
        // 使用普通用户初始化代理合约
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 42));
        assertTrue(success1);
        
        // 直接读取存储槽来验证数据存储在代理合约中
        // 存储槽0应该包含value变量
        bytes32 slot0 = vm.load(address(proxy), bytes32(uint256(0)));
        assertEq(uint256(slot0), 42);
        
        // 使用普通用户更新值
        vm.prank(user);
        (bool success2,) = address(proxy).call(abi.encodeWithSignature("setValue(uint256)", 123));
        assertTrue(success2);
        
        // 再次验证存储槽
        slot0 = vm.load(address(proxy), bytes32(uint256(0)));
        assertEq(uint256(slot0), 123);
    }
    
    /**
     * @dev 测试升级功能和存储兼容性
     */
    function testUpgradeAndStorageCompatibility() public {
        // 使用普通用户初始化V1合约
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 999));
        assertTrue(success1);
        
        // 使用普通用户验证初始值
        vm.prank(user);
        (bool success2, bytes memory data1) = address(proxy).call(abi.encodeWithSignature("value()"));
        assertTrue(success2);
        uint256 value = abi.decode(data1, (uint256));
        assertEq(value, 999);
        
        // 管理员升级到V2
        vm.stopPrank(); // 确保停止任何之前的prank
        proxy.upgradeTo(address(logicV2));
        assertEq(proxy.implementation(), address(logicV2));
        
        // 使用普通用户验证升级后原有数据仍然存在
        vm.prank(user);
        (bool success3, bytes memory data2) = address(proxy).call(abi.encodeWithSignature("value()"));
        assertTrue(success3);
        uint256 valueAfterUpgrade = abi.decode(data2, (uint256));
        assertEq(valueAfterUpgrade, 999); // 原有数据应该保持不变
        
        // 使用普通用户初始化V2的新功能
        vm.prank(user);
        (bool success4,) = address(proxy).call(abi.encodeWithSignature("initializeV2(string)", "TestName"));
        assertTrue(success4);
        
        // 使用普通用户验证新功能
        vm.prank(user);
        (bool success5, bytes memory data3) = address(proxy).call(abi.encodeWithSignature("name()"));
        assertTrue(success5);
        string memory name = abi.decode(data3, (string));
        assertEq(name, "TestName");
        
        // 使用普通用户验证组合函数
        vm.prank(user);
        (bool success6, bytes memory data4) = address(proxy).call(abi.encodeWithSignature("getValueAndName()"));
        assertTrue(success6);
        (uint256 returnedValue, string memory returnedName) = abi.decode(data4, (uint256, string));
        assertEq(returnedValue, 999);
        assertEq(returnedName, "TestName");
    }
    
    /**
     * @dev 测试存储槽布局在升级后的兼容性
     */
    function testStorageLayoutCompatibility() public {
        // 使用普通用户初始化V1
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 777));
        assertTrue(success1);
        
        // 记录升级前的存储状态
        bytes32 slot0Before = vm.load(address(proxy), bytes32(uint256(0)));
        assertEq(uint256(slot0Before), 777);
        
        // 管理员升级到V2
        vm.stopPrank(); // 确保停止任何之前的prank
        proxy.upgradeTo(address(logicV2));
        
        // 验证存储槽0的数据没有被破坏
        bytes32 slot0After = vm.load(address(proxy), bytes32(uint256(0)));
        assertEq(slot0Before, slot0After);
        
        // 使用普通用户初始化V2的新变量
        vm.prank(user);
        (bool success2,) = address(proxy).call(abi.encodeWithSignature("initializeV2(string)", "StorageTest"));
        assertTrue(success2);
        
        // 验证新变量存储在不同的槽中（字符串存储比较复杂，这里验证槽1有数据）
        bytes32 slot1 = vm.load(address(proxy), bytes32(uint256(1)));
        assertTrue(uint256(slot1) > 0); // 字符串长度应该大于0
    }
    
    /**
     * @dev 测试权限控制
     */
    function testAccessControl() public {
        // 非管理员不能升级
        vm.prank(user);
        vm.expectRevert("just admin can do");
        proxy.upgradeTo(address(logicV2));
        
        // 管理员可以升级
        proxy.upgradeTo(address(logicV2));
        assertEq(proxy.implementation(), address(logicV2));
    }
    
    /**
     * @dev 测试升级参数验证
     */
    function testUpgradeValidation() public {
        // 不能升级到零地址
        vm.expectRevert("newImplementation  zero");
        proxy.upgradeTo(address(0));
        
        // 不能升级到相同地址
        vm.expectRevert("newImplementation == _implementation");
        proxy.upgradeTo(address(logicV1));
    }
    
    /**
     * @dev 测试代理合约的ETH接收功能
     */
    function testReceiveEther() public {
        uint256 amount = 1 ether;
        
        // 向代理合约发送ETH
        (bool success,) = address(proxy).call{value: amount}("");
        assertTrue(success);
        
        // 验证代理合约收到了ETH
        assertEq(address(proxy).balance, amount);
    }
    
    /**
     * @dev 测试复杂的存储操作
     */
    function testComplexStorageOperations() public {
        // 使用普通用户初始化V1
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 100));
        assertTrue(success1);
        
        // 使用普通用户多次更新值
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(user);
            (bool success2,) = address(proxy).call(abi.encodeWithSignature("setValue(uint256)", i * 100));
            assertTrue(success2);
            
            // 使用普通用户验证每次更新
            vm.prank(user);
            (bool success3, bytes memory data) = address(proxy).call(abi.encodeWithSignature("value()"));
            assertTrue(success3);
            uint256 currentValue = abi.decode(data, (uint256));
            assertEq(currentValue, i * 100);
        }
        
        // 管理员升级到V2并验证数据完整性
        vm.stopPrank(); // 确保停止任何之前的prank
        proxy.upgradeTo(address(logicV2));
        
        vm.prank(user);
        (bool success4, bytes memory finalData) = address(proxy).call(abi.encodeWithSignature("value()"));
        assertTrue(success4);
        uint256 finalValue = abi.decode(finalData, (uint256));
        assertEq(finalValue, 500); // 最后一次设置的值
    }
    
    /**
     * @dev 测试代理合约的管理员和实现地址存储
     */
    function testProxyInternalStorage() public {
        // 代理合约的内部存储不应该与逻辑合约冲突
        // 这里我们验证管理员和实现地址的正确性
        assertEq(proxy.admin(), admin);
        assertEq(proxy.implementation(), address(logicV1));
        
        // 升级后验证
        proxy.upgradeTo(address(logicV2));
        assertEq(proxy.admin(), admin); // 管理员不变
        assertEq(proxy.implementation(), address(logicV2)); // 实现地址更新
    }
    
    /**
     * @dev 测试存储冲突检测
     */
    function testStorageConflictDetection() public {
        // 使用普通用户初始化代理合约
        vm.prank(user);
        (bool success1,) = address(proxy).call(abi.encodeWithSignature("initialize(uint256)", 12345));
        assertTrue(success1);
        
        // 验证逻辑合约的存储槽0被正确使用
        bytes32 logicSlot0 = vm.load(address(proxy), bytes32(uint256(0)));
        assertEq(uint256(logicSlot0), 12345);
        
        // 代理合约的管理员和实现地址应该存储在不同的位置
        // 通常使用特殊的存储槽来避免冲突
        address currentAdmin = proxy.admin();
        address currentImpl = proxy.implementation();
        
        assertEq(currentAdmin, admin);
        assertEq(currentImpl, address(logicV1));
        
        // 使用普通用户验证代理合约的内部状态不会被逻辑合约的操作影响
        vm.prank(user);
        (bool success2,) = address(proxy).call(abi.encodeWithSignature("setValue(uint256)", 99999));
        assertTrue(success2);
        
        // 管理员和实现地址应该保持不变
        assertEq(proxy.admin(), admin);
        assertEq(proxy.implementation(), address(logicV1));
    }
}