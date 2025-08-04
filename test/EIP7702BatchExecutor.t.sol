// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EIP7702BatchExecutor.sol";
import "../src/MyTokenBankV4.sol";
import "../src/MyTokenV4.sol";

/**
 * @title EIP7702BatchExecutorTest
 * @dev 测试 EIP7702BatchExecutor 合约的功能
 */
contract EIP7702BatchExecutorTest is Test {
    EIP7702BatchExecutor public batchExecutor;
    MyTokenBankV4 public tokenBank;
    MyTokenV4 public token;
    
    address public user = address(0x1);
    address public deployer = address(this);
    
    function setUp() public {
        // 部署合约
        batchExecutor = new EIP7702BatchExecutor();
        tokenBank = new MyTokenBankV4();
        token = new MyTokenV4();
        
        // 给用户转移一些代币（部署者在构造函数中获得了所有代币）
        token.transfer(user, 1000 ether);
        
        // 给用户一些 ETH
        vm.deal(user, 10 ether);
    }
    
    function testExecuteBatchApproveAndDeposit() public {
        uint256 depositAmount = 100 ether;
        
        // 在真实的 EIP-7702 场景中，用户的 EOA 会临时获得 BatchExecutor 的代码
        // 这里我们模拟这种情况：先给用户转移代币，然后用户将代币转移给 BatchExecutor
        // 然后 BatchExecutor 执行批量操作
        
        // 用户先将代币转移给 BatchExecutor（模拟 EIP-7702 的临时授权）
        vm.prank(user);
        token.transfer(address(batchExecutor), depositAmount);
        
        // 构建批量操作
        EIP7702BatchExecutor.BatchOperation[] memory operations = new EIP7702BatchExecutor.BatchOperation[](2);
        
        // 操作1: 授权代币给银行合约
        operations[0] = EIP7702BatchExecutor.BatchOperation({
            to: address(token),
            data: abi.encodeWithSelector(
                token.approve.selector,
                address(tokenBank),
                depositAmount
            ),
            value: 0
        });
        
        // 操作2: 存款代币到银行
        operations[1] = EIP7702BatchExecutor.BatchOperation({
            to: address(tokenBank),
            data: abi.encodeWithSelector(
                tokenBank.depositToken.selector,
                address(token),
                depositAmount
            ),
            value: 0
        });
        
        // 模拟用户调用（在 EIP-7702 中，tx.origin == msg.sender）
        vm.startPrank(user, user);
        
        // 检查初始状态
        assertEq(token.balanceOf(user), 900 ether); // 用户转移了 100 ether 给 BatchExecutor
        assertEq(token.balanceOf(address(batchExecutor)), depositAmount);
        assertEq(tokenBank.getTokenBalance(address(token), user), 0);
        
        // 执行批量操作
        batchExecutor.executeBatch(operations);
        
        // 检查最终状态
        assertEq(token.balanceOf(address(batchExecutor)), 0); // BatchExecutor 的代币被转移到银行
        assertEq(tokenBank.getTokenBalance(address(token), address(batchExecutor)), depositAmount); // 银行中有 100 ether（记录在 BatchExecutor 名下）
        
        vm.stopPrank();
    }
    
    function testExecuteBatchWithEthTransfer() public {
        uint256 ethAmount = 1 ether;
        
        // 给 BatchExecutor 一些 ETH（模拟 EIP-7702 场景）
        vm.deal(address(batchExecutor), ethAmount);
        
        // 构建批量操作：存入 ETH 到银行
        EIP7702BatchExecutor.BatchOperation[] memory operations = new EIP7702BatchExecutor.BatchOperation[](1);
        
        operations[0] = EIP7702BatchExecutor.BatchOperation({
            to: address(tokenBank),
            data: abi.encodeWithSelector(tokenBank.depositEth.selector),
            value: ethAmount
        });
        
        // 模拟用户调用
        vm.startPrank(user, user);
        
        // 检查初始状态
        assertEq(tokenBank.getEthBalance(address(batchExecutor)), 0);
        assertEq(address(batchExecutor).balance, ethAmount);
        
        // 执行批量操作
        batchExecutor.executeBatch(operations);
        
        // 检查最终状态
        assertEq(tokenBank.getEthBalance(address(batchExecutor)), ethAmount);
        assertEq(address(batchExecutor).balance, 0);
        
        vm.stopPrank();
    }
    
    function testExecuteBatchFailsWithInvalidContext() public {
        // 构建一个简单的批量操作
        EIP7702BatchExecutor.BatchOperation[] memory operations = new EIP7702BatchExecutor.BatchOperation[](1);
        
        operations[0] = EIP7702BatchExecutor.BatchOperation({
            to: address(tokenBank),
            data: abi.encodeWithSelector(tokenBank.depositEth.selector),
            value: 1 ether
        });
        
        // 使用不同的 msg.sender 和 tx.origin（违反 EIP-7702 要求）
        vm.startPrank(user); // msg.sender = user, tx.origin = address(this)
        
        // 应该失败
        vm.expectRevert("EIP7702: invalid execution context");
        batchExecutor.executeBatch(operations);
        
        vm.stopPrank();
    }
    
    function testExecuteBatchFailsOnOperationFailure() public {
        // 构建一个会失败的批量操作（尝试转移用户没有的代币）
        EIP7702BatchExecutor.BatchOperation[] memory operations = new EIP7702BatchExecutor.BatchOperation[](1);
        
        operations[0] = EIP7702BatchExecutor.BatchOperation({
            to: address(token),
            data: abi.encodeWithSelector(
                token.transfer.selector,
                address(0x2),
                2000 ether // 用户只有 1000 ether
            ),
            value: 0
        });
        
        // 模拟用户调用
        vm.startPrank(user, user);
        
        // 应该失败
        vm.expectRevert("Batch operation failed");
        batchExecutor.executeBatch(operations);
        
        vm.stopPrank();
    }
    
    function testBatchOperationExecutedEvent() public {
        uint256 depositAmount = 50 ether;
        
        // 构建批量操作
        EIP7702BatchExecutor.BatchOperation[] memory operations = new EIP7702BatchExecutor.BatchOperation[](1);
        
        operations[0] = EIP7702BatchExecutor.BatchOperation({
            to: address(token),
            data: abi.encodeWithSelector(
                token.approve.selector,
                address(tokenBank),
                depositAmount
            ),
            value: 0
        });
        
        // 模拟用户调用
        vm.startPrank(user, user);
        
        // 期望事件被发射
        vm.expectEmit(true, true, false, false);
        emit EIP7702BatchExecutor.BatchOperationExecuted(0, address(token), true, "");
        
        // 执行批量操作
        batchExecutor.executeBatch(operations);
        
        vm.stopPrank();
    }
}