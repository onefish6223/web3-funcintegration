// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TransparentProxy
 * @dev 透明代理合约，将所有调用转发给逻辑合约
 * 管理员可以升级逻辑合约地址
 * 使用 EIP-1967 标准存储槽避免存储冲突
 */
contract TransparentProxy {
    // EIP-1967 标准存储槽
    // bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
    bytes32 private constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    
    // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /**
     * @dev 构造函数，设置初始管理员和逻辑合约
     * @param implementation1 初始逻辑合约地址
     */
    constructor(address implementation1) {
        require(implementation1 != address(0), "imp zero");
        _setAdmin(msg.sender);
        _setImplementation(implementation1);
    }

    /**
     * @dev  fallback函数，实现透明代理模式
     * 管理员只能调用管理函数，普通用户的调用转发给逻辑合约
     */
    fallback() external payable {
        require(msg.sender != _getAdmin(), "admin cannot call fallback");
        // 转发调用到逻辑合约
        _delegate(_getImplementation());
    }

    /**
     * @dev receive函数，接收ETH
     */
    receive() external payable {}

    /**
     * @dev 升级逻辑合约
     * @param newImplementation 新的逻辑合约地址
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _getAdmin(), "just admin can do");
        require(newImplementation != address(0), "newImplementation  zero");
        require(newImplementation != _getImplementation(), "newImplementation == _implementation");
        
        _setImplementation(newImplementation);
    }

    /**
     * @dev 获取当前管理员地址
     * @return 管理员地址
     */
    function admin() external view returns (address) {
        return _getAdmin();
    }

    /**
     * @dev 获取当前逻辑合约地址
     * @return 逻辑合约地址
     */
    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev 获取管理员地址
     */
    function _getAdmin() private view returns (address adminAddr) {
        bytes32 slot = _ADMIN_SLOT;
        assembly {
            adminAddr := sload(slot)
        }
    }
    
    /**
     * @dev 设置管理员地址
     */
    function _setAdmin(address adminAddr) private {
        bytes32 slot = _ADMIN_SLOT;
        assembly {
            sstore(slot, adminAddr)
        }
    }
    
    /**
     * @dev 获取实现地址
     */
    function _getImplementation() private view returns (address impl) {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }
    
    /**
     * @dev 设置实现地址
     */
    function _setImplementation(address impl) private {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, impl)
        }
    }

    /**
     * @dev 将调用转发给目标合约
     * @param target 目标合约地址
     */
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

/**
 * @title LogicContractV1
 * @dev 第一个版本的逻辑合约
 */
contract LogicContractV1 {
    // 状态变量必须与后续版本保持存储布局兼容
    uint256 public value;
    
    // 初始化函数（仅在代理部署后调用一次）
    function initialize(uint256 initialValue) external {
        value = initialValue;
    }
    
    // 简单的更新函数
    function setValue(uint256 newValue) external {
        value = newValue;
    }
}

/**
 * @title LogicContractV2
 * @dev 第二个版本的逻辑合约（升级版本）
 */
contract LogicContractV2 {
    // 保持原有状态变量（存储布局兼容）
    uint256 public value;
    
    // 新增状态变量（必须添加在末尾）
    string public name;
    
    // 升级后的初始化函数
    function initializeV2(string calldata newName) external {
        name = newName;
    }
    
    // 保留原有函数
    function setValue(uint256 newValue) external {
        value = newValue;
    }
    
    // 新增函数
    function setName(string calldata newName) external {
        name = newName;
    }
    
    // 新增函数：组合值和名称
    function getValueAndName() external view returns (uint256, string memory) {
        return (value, name);
    }
}