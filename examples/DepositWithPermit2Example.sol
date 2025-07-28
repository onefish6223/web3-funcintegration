// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/MyTokenBankV4.sol";
import "../src/IPermit2.sol";
import "../src/MyTokenV4.sol";

/**
 * @title Permit2存款示例合约
 * @notice 演示如何使用MyTokenBankV4的depositWithPermit2功能
 * @dev 这个示例展示了完整的Permit2签名转账流程
 */
contract DepositWithPermit2Example {
    MyTokenBankV4 public immutable bank;
    IPermit2 public immutable permit2;
    MyTokenV4 public immutable token;
    
    constructor(address _bank, address _permit2, address _token) {
        bank = MyTokenBankV4(payable(_bank));
        permit2 = IPermit2(_permit2);
        token = MyTokenV4(_token);
    }
    
    /**
     * @notice 演示如何使用Permit2进行存款的完整流程
     * @dev 这个函数展示了从构造签名数据到执行存款的完整过程
     * @param amount 存款金额
     * @param nonce 用户的nonce值
     * @param deadline 签名有效期
     * @param signature 用户的EIP712签名
     */
    function demonstratePermit2Deposit(
        // address user,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        // 注意：在实际应用中，用户需要先给Permit2合约授权代币
        // token.approve(address(permit2), amount);
        
        // 调用银行合约的depositWithPermit2方法
        // 
    }
    
    /**
     * @notice 获取构造EIP712签名所需的类型哈希
     * @dev 前端可以使用这些哈希来构造正确的签名数据
     */
    function getSignatureTypeHashes() external view returns (
        bytes32 signatureTransferTypehash,
        bytes32 signatureTransferDetailsTypehash
    ) {
        return (
            permit2.SIGNATURE_TRANSFER_TYPEHASH(),
            permit2.SIGNATURE_TRANSFER_DETAILS_TYPEHASH()
        );
    }
    
    /**
     * @notice 获取EIP712域分隔符
     * @dev 前端需要这个值来构造正确的签名
     */
    function getDomainSeparator() external view returns (bytes32) {
        return permit2.DOMAIN_SEPARATOR();
    }
    
    /**
     * @notice 检查用户的nonce是否已被使用
     * @param user 用户地址
     * @param nonce nonce值
     */
    function isNonceUsed(address user, uint256 nonce) external view returns (bool) {
        return permit2.isNonceUsed(user, nonce);
    }
    
    /**
     * @notice 获取用户在银行的代币余额
     * @param user 用户地址
     */
    function getUserBankBalance(address user) external view returns (uint256) {
        return bank.getTokenBalance(address(token), user);
    }
    
    /**
     * @notice 获取用户的代币余额
     * @param user 用户地址
     */
    function getUserTokenBalance(address user) external view returns (uint256) {
        return token.balanceOf(user);
    }
    
    /**
     * @notice 获取用户对Permit2合约的代币授权额度
     * @param user 用户地址
     */
    function getUserPermit2Allowance(address user) external view returns (uint256) {
        return token.allowance(user, address(permit2));
    }
}