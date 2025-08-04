// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EIP7702BatchExecutor
 * @dev 支持批量执行合约调用的临时合约，符合 EIP-7702 标准
 */
contract EIP7702BatchExecutor {
    // 定义单批操作的结构：目标地址、调用数据、ETH转账金额
    struct BatchOperation {
        address to;           // 目标合约地址
        bytes data;           // 调用数据（calldata）
        uint256 value;        // 转账的ETH金额（wei）
    }

    // 事件：记录每笔操作的执行结果
    event BatchOperationExecuted(
        uint256 indexed operationIndex,  // 操作索引（用于追踪顺序）
        address indexed target,          // 目标合约地址
        bool success,                    // 执行是否成功
        bytes returnData                 // 调用返回数据
    );

    /**
     * @dev 批量执行操作的入口函数
     * @param operations 批量操作数组
     */
    function executeBatch(BatchOperation[] calldata operations) external {
        // 验证执行上下文（EIP-7702 要求顶层调用必须满足 tx.origin == msg.sender）
        // wake-disable-next-line
        require(tx.origin == msg.sender, "EIP7702: invalid execution context");

        // 循环执行所有操作
        for (uint256 i = 0; i < operations.length; i++) {
            BatchOperation calldata op = operations[i];
            
            // 调用目标合约（使用 low-level call 支持任意函数）
            (bool success, bytes memory returnData) = op.to.call{value: op.value}(op.data);
            
            // 发射事件记录结果
            emit BatchOperationExecuted(i, op.to, success, returnData);

            // 若操作失败，回滚整个批量执行（可根据需求改为继续执行其他操作）
            require(success, "Batch operation failed");
        }
    }
}