// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract SimpleProxy {
    // EIP-1967 标准存储槽
    // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    constructor(address implementation1) {
        _setImplementation(implementation1);
    }
    fallback() external payable {
        // 转发调用到逻辑合约
        _delegate(_getImplementation());
    }
    receive() external payable {}
    function upgradeTo(address newImplementation) external {
        _setImplementation(newImplementation);
    }
    function implementation() external view returns (address) {
        return _getImplementation();
    }
    function _getImplementation() private view returns (address impl) {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }
    function _setImplementation(address impl) private {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, impl)
        }
    }
    function _delegate(address target) private {
        // 组装调用数据：包含msg.data
        assembly {
            // 复制calldata到内存
            calldatacopy(0, 0, calldatasize())
            
            // 调用目标合约
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            
            // 复制返回数据到内存
            returndatacopy(0, 0, returndatasize())
            
            // 根据调用结果返回或 revert
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
// 第一个版本合约
contract UserContractV1 {
    struct User {
        address wallet;
        uint256 score;
    }
    
    User[] public users;
    
    // 初始化函数，添加一个测试用户
    function initialize() external {
        users.push(User({
            wallet: address(0x123),
            score: 100
        }));
    }
    
    // 添加用户（旧版本方法）
    function addUser(address _wallet, uint256 _score) external {
        users.push(User({
            wallet: _wallet,
            score: _score
        }));
    }
    
    // 获取用户数量
    function getUserCount() external view returns (uint256) {
        return users.length;
    }
    
    // 获取用户数据（旧版本）
    function getUser(uint256 index) external view returns (address, uint256) {
        User storage user = users[index];
        return (user.wallet, user.score);
    }

    // 验证存储布局的关键函数：直接读取存储槽数据
    function getStorageSlot(uint256 slot) external view returns (bytes32) {
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return value;
    }
}

// 第二个版本合约（升级后）
contract UserContractV2 {
    // 结构体末尾添加新字段name
    struct User {
        address wallet;
        uint256 score;
        // string name; // 新增字段
        uint256 age;
    }
    
    User[] public users;
    
    // 升级后的初始化函数
    function initializeV2() external {
        // 可以在这里初始化新功能，不影响原有存储
    }
    
    // 保留旧版本的添加用户方法
    function addUser(address _wallet, uint256 _score) external {
        users.push(User({
            wallet: _wallet,
            score: _score,
            // name: "" // 旧方法默认空字符串
            age: 0
        }));
    }
    
    // 新增带name字段的添加用户方法
    function addUserV2(address _wallet, uint256 _score, uint256 _age) external {
        users.push(User({
            wallet: _wallet,
            score: _score,
            age: _age
        }));
    }
    
    // 获取用户数量（保持兼容）
    function getUserCount() external view returns (uint256) {
        return users.length;
    }
    
    // 获取旧版本字段
    function getUserV1(uint256 index) external view returns (address, uint256) {
        User storage user = users[index];
        return (user.wallet, user.score);
    }
    
    // 获取包含新字段的完整用户数据
    function getUserV2(uint256 index) external view returns (address, uint256, uint256) {
        User storage user = users[index];
        return (user.wallet, user.score, user.age);
    }
    
    // 验证存储布局的关键函数：直接读取存储槽数据
    function getStorageSlot(uint256 slot) external view returns (bytes32) {
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return value;
    }
}