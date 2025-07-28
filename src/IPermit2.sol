// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPermit2
 * @notice Permit2合约的接口定义
 * @dev 定义了Permit2合约的核心功能接口，用于解耦合约依赖
 */
interface IPermit2 {
    // ============ 数据结构定义 ============
    
    /**
     * @notice 签名转账详情结构体
     */
    struct SignatureTransferDetails {
        address to;              // 代币转入地址
        uint256 requestedAmount; // 请求转账的数量
    }

    /**
     * @notice 签名转账结构体
     */
    struct SignatureTransfer {
        address token;           // 代币合约地址
        address from;            // 代币转出地址（签名者）
        SignatureTransferDetails transfer; // 转账详情
        uint256 nonce;           // 防重放攻击的随机数
        uint256 deadline;        // 签名过期时间戳
    }

    // ============ 核心功能接口 ============
    
    /**
     * @notice 通过签名直接进行代币转账
     * @param signatureTransfer 包含转账详情的结构体
     * @param signature 用户的EIP712签名
     */
    function permitTransferFrom(
        SignatureTransfer calldata signatureTransfer,
        bytes calldata signature
    ) external;

    /**
     * @notice 获取EIP712域分隔符
     * @return bytes32 域分隔符
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /**
     * @notice 获取签名转账的类型哈希
     * @return bytes32 类型哈希
     */
    function SIGNATURE_TRANSFER_TYPEHASH() external view returns (bytes32);

    /**
     * @notice 获取签名转账详情的类型哈希
     * @return bytes32 类型哈希
     */
    function SIGNATURE_TRANSFER_DETAILS_TYPEHASH() external view returns (bytes32);

    /**
     * @notice 检查nonce是否已被使用
     * @param user 用户地址
     * @param nonce nonce值
     * @return bool 是否已被使用
     */
    function isNonceUsed(address user, uint256 nonce) external view returns (bool);
}