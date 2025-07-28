# Permit2 合约

## 概述

Permit2 是一个标准化的代币授权合约，基于 Uniswap Permit2 设计的简化版本。它提供了一个统一的接口来管理 ERC20 代币的授权，支持签名授权、批量操作和安全的代币转账。

## 主要功能

### 1. 授权管理
- **直接授权**: 无需签名的标准授权
- **签名授权**: 使用 EIP712 签名进行授权，无需预先调用 approve
- **批量授权**: 一次性授权多个代币
- **过期时间**: 支持设置授权过期时间

### 2. 安全特性
- **Nonce 机制**: 防止重放攻击
- **签名验证**: 基于 EIP712 标准的签名验证
- **重入保护**: 使用 ReentrancyGuard 防止重入攻击
- **权限控制**: 基于 Ownable 的管理员权限

### 3. 转账功能
- **单笔转账**: 通过授权进行代币转账
- **批量转账**: 一次性执行多笔转账
- **授权扣减**: 自动扣减已使用的授权额度

## 合约结构

### 核心数据结构

```solidity
// 授权详情
struct PermitDetails {
    address token;      // 代币地址
    uint256 amount;     // 授权数量
    uint256 expiration; // 过期时间
    uint256 nonce;      // 防重放攻击的随机数
}

// 单个授权
struct PermitSingle {
    PermitDetails details;
    address spender;    // 被授权地址
    uint256 sigDeadline; // 签名过期时间
}

// 批量授权
struct PermitBatch {
    PermitDetails[] details;
    address spender;
    uint256 sigDeadline;
}

// 转账详情
struct AllowanceTransferDetails {
    address from;       // 转出地址
    address to;         // 转入地址
    uint256 amount;     // 转账数量
    address token;      // 代币地址
}
```

### 主要函数

#### 授权函数

```solidity
// 直接授权
function approve(
    address token,
    address spender,
    uint256 amount,
    uint256 expiration
) external;

// 签名授权
function permit(
    address owner,
    PermitSingle memory permitSingle,
    bytes calldata signature
) external;

// 批量签名授权
function permitBatch(
    address owner,
    PermitBatch memory permitBatch,
    bytes calldata signature
) external;
```

#### 转账函数

```solidity
// 单笔转账
function transferFrom(
    AllowanceTransferDetails calldata transferDetails
) external;

// 批量转账
function transferFromBatch(
    AllowanceTransferDetails[] calldata transferDetails
) external;
```

#### 查询函数

```solidity
// 获取授权信息
function getAllowance(
    address owner,
    address token,
    address spender
) external view returns (uint256 amount, uint256 expiration);

// 检查 nonce 是否已使用
function isNonceUsed(address owner, uint256 nonce) external view returns (bool);
```

## 使用示例

### 1. 直接授权

```solidity
// 授权 spender 使用 1000 个代币，1小时后过期
permit2.approve(
    tokenAddress,
    spenderAddress,
    1000 * 10**18,
    block.timestamp + 3600
);
```

### 2. 签名授权

```solidity
// 构造授权数据
Permit2.PermitDetails memory details = Permit2.PermitDetails({
    token: tokenAddress,
    amount: 1000 * 10**18,
    expiration: block.timestamp + 3600,
    nonce: 1
});

Permit2.PermitSingle memory permitSingle = Permit2.PermitSingle({
    details: details,
    spender: spenderAddress,
    sigDeadline: block.timestamp + 1800
});

// 生成签名（需要在前端或脚本中实现）
bytes memory signature = generateSignature(owner, permitSingle);

// 执行授权
permit2.permit(owner, permitSingle, signature);
```

### 3. 转账

```solidity
// 构造转账数据
Permit2.AllowanceTransferDetails memory transferDetails = Permit2.AllowanceTransferDetails({
    from: ownerAddress,
    to: recipientAddress,
    amount: 100 * 10**18,
    token: tokenAddress
});

// 执行转账
permit2.transferFrom(transferDetails);
```

## 部署和测试

### 编译合约

```bash
forge build
```

### 运行测试

```bash
# 运行所有测试
forge test

# 运行基本功能测试
forge test --match-contract Permit2SimpleTest

# 运行详细测试
forge test --match-contract Permit2Test
```

### 部署合约

```bash
# 本地部署
forge script script/DeployPermit2.s.sol:DeployPermit2Script --rpc-url http://localhost:8545 --broadcast

# 测试网部署
forge script script/DeployPermit2.s.sol:DeployPermit2Script --rpc-url $RPC_URL --broadcast --verify
```

## 安全考虑

1. **签名验证**: 所有签名都通过 EIP712 标准验证
2. **Nonce 管理**: 使用位图管理 nonce，防止重放攻击
3. **过期检查**: 所有授权和签名都有过期时间检查
4. **重入保护**: 转账函数使用 ReentrancyGuard 保护
5. **权限控制**: 管理员功能受 Ownable 保护

## 错误处理

合约定义了以下自定义错误：

- `InvalidSignature()`: 无效签名
- `SignatureExpired()`: 签名已过期
- `InsufficientAllowance()`: 授权额度不足
- `InvalidNonce()`: 无效的 nonce
- `TransferFailed()`: 转账失败
- `InvalidAmount()`: 无效金额
- `InvalidSpender()`: 无效的被授权地址
- `InvalidToken()`: 无效的代币地址

## 事件

合约会发出以下事件：

- `Approval`: 授权事件
- `Permit`: 签名授权事件
- `NonceInvalidation`: Nonce 失效事件

## 兼容性

- Solidity 版本: ^0.8.20
- OpenZeppelin 合约: 最新版本
- EIP 标准: EIP712, ERC20

## 许可证

MIT License