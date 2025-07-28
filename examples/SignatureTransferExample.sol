// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/Permit2.sol";
import "../src/MyTokenV4.sol";

/**
 * @title 签名转账示例合约
 * @notice 演示如何使用Permit2合约的签名转账功能
 * @dev 这个示例展示了如何构造签名转账数据并执行转账
 */
contract SignatureTransferExample {
    Permit2 public immutable permit2;
    
    constructor(address _permit2) {
        permit2 = Permit2(_permit2);
    }
    
    /**
     * @notice 执行签名转账的示例函数
     * @dev 这个函数展示了如何使用Permit2的permitTransferFrom功能
     * @param signatureTransfer 签名转账数据结构
     * @param signature 用户的EIP712签名
     */
    function executeSignatureTransfer(
        Permit2.SignatureTransfer calldata signatureTransfer,
        bytes calldata signature
    ) external {
        // 调用Permit2合约执行签名转账
        permit2.permitTransferFrom(signatureTransfer, signature);
    }
    
    /**
     * @notice 获取签名转账所需的EIP712类型哈希
     * @dev 前端可以使用这些哈希来构造正确的签名数据
     */
    function getTypeHashes() external view returns (
        bytes32 signatureTransferTypehash,
        bytes32 signatureTransferDetailsTypehash
    ) {
        return (
            permit2.SIGNATURE_TRANSFER_TYPEHASH(),
            permit2.SIGNATURE_TRANSFER_DETAILS_TYPEHASH()
        );
    }
    
    /**
     * @notice 获取域分隔符
     * @dev 前端构造EIP712签名时需要使用域分隔符
     */
    function getDomainSeparator() external view returns (bytes32) {
        return permit2.DOMAIN_SEPARATOR();
    }
}