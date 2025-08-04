# EIP-7702 交易构建器

本项目实现了 EIP-7702 交易（类型 0x4）的构建和发送功能，允许 EOA（外部拥有账户）临时获得智能合约的能力。

## 什么是 EIP-7702？

EIP-7702 是以太坊的一个提案，允许 EOA 在单个交易中临时"升级"为智能合约。通过授权列表（Authorization List），用户可以将自己的地址临时委托给智能合约的代码，从而执行复杂的批量操作。

### 核心概念

- **交易类型 0x4**：EIP-7702 引入的新交易类型
- **授权列表**：包含用户签名的授权，允许地址临时获得合约代码
- **临时委托**：用户地址在交易执行期间临时变成智能合约
- **原子性**：整个批量操作要么全部成功，要么全部失败

## 功能特性

### 1. 授权数据构建
- 生成符合 EIP-712 标准的授权签名数据
- 支持自定义 nonce 和执行器合约地址
- 提供完整的签名数据结构

### 2. 交易构建
- 构建完整的 EIP-7702 交易（类型 0x4）
- 支持批量操作（授权 + 存款）
- 自动计算 Gas 参数

### 3. 交易发送
- 支持通过兼容的钱包发送 EIP-7702 交易
- 提供详细的错误处理和用户反馈
- 兼容性检测和提示

## 使用方法

### 1. 准备工作

首先确保你有：
- 支持 EIP-7702 的钱包（目前大多数钱包还不支持）
- 支持 EIP-7702 的以太坊网络
- 已部署的 `EIP7702BatchExecutor` 合约

### 2. 构建授权数据

1. 在 "EIP-7702" 标签页中填写：
   - **执行器合约地址**：EIP7702BatchExecutor 合约地址
   - **用户 Nonce**：当前用户的 nonce 值
   - **代币合约地址**：要操作的 ERC20 代币地址
   - **银行合约地址**：TokenBank 合约地址
   - **存款金额**：要存入的代币数量

2. 点击 "构建授权数据" 按钮

3. 复制生成的 EIP-712 签名数据到支持的钱包中进行签名

### 3. 构建交易

1. 配置 Gas 参数：
   - **Gas Limit**：交易的 Gas 限制
   - **Max Fee Per Gas**：最大 Gas 费用（Gwei）
   - **Max Priority Fee Per Gas**：最大优先费用（Gwei）

2. 点击 "构建EIP-7702交易" 按钮

3. 查看生成的交易结构

### 4. 发送交易

1. 确保授权签名已完成并填入交易中
2. 点击 "发送交易" 按钮
3. 在钱包中确认交易

## 技术实现

### 授权结构

```typescript
interface Authorization {
  chainId: bigint;     // 链 ID
  address: string;     // 执行器合约地址
  nonce: bigint;       // 用户 nonce
  v: number;           // 签名 v 值
  r: string;           // 签名 r 值
  s: string;           // 签名 s 值
}
```

### EIP-7702 交易结构

```typescript
interface EIP7702Transaction {
  type: '0x4';                    // 交易类型
  to: string;                     // 目标地址（用户地址）
  value: string;                  // ETH 数量
  data: string;                   // 调用数据
  gasLimit: string;               // Gas 限制
  maxFeePerGas: string;           // 最大 Gas 费用
  maxPriorityFeePerGas: string;   // 最大优先费用
  authorizationList: Authorization[]; // 授权列表
}
```

### 执行流程

1. **授权签名**：用户使用 EIP-712 标准签名授权数据
2. **交易构建**：构建包含授权列表的 type-4 交易
3. **临时委托**：交易执行时，用户地址临时获得执行器合约代码
4. **批量执行**：执行器合约执行批量操作（授权 + 存款）
5. **状态恢复**：交易完成后，用户地址恢复为普通 EOA

## EIP-712 签名数据格式

授权签名使用以下 EIP-712 结构：

```json
{
  "types": {
    "Authorization": [
      { "name": "chainId", "type": "uint256" },
      { "name": "address", "type": "address" },
      { "name": "nonce", "type": "uint64" }
    ]
  },
  "domain": {
    "name": "EIP7702Domain",
    "version": "1",
    "chainId": 31337
  },
  "primaryType": "Authorization",
  "message": {
    "chainId": 31337,
    "address": "0x...",
    "nonce": 0
  }
}
```

## 兼容性说明

### 钱包支持

目前支持 EIP-7702 的钱包很少，主要包括：
- 实验性的开发钱包
- 支持最新以太坊标准的测试钱包

### 网络支持

- **主网**：尚未支持
- **测试网**：部分测试网可能支持
- **本地网络**：Hardhat、Anvil 等开发网络可能支持

## 错误处理

常见错误及解决方案：

### 1. "unsupported transaction type"
- **原因**：钱包不支持 EIP-7702 交易类型
- **解决**：使用支持 EIP-7702 的钱包或等待钱包更新

### 2. "invalid execution context"
- **原因**：执行上下文不符合 EIP-7702 要求
- **解决**：确保 `tx.origin == msg.sender`

### 3. "authorization signature invalid"
- **原因**：授权签名无效或过期
- **解决**：重新生成并签名授权数据

## 安全注意事项

1. **授权范围**：仔细检查授权的合约地址和权限
2. **Nonce 管理**：确保使用正确的 nonce 值
3. **Gas 设置**：设置合理的 Gas 参数避免交易失败
4. **网络验证**：确保在正确的网络上操作
5. **合约验证**：验证执行器合约的安全性

## 示例场景

### 场景：一键授权并存款

传统方式需要两个交易：
1. `approve(tokenBank, amount)` - 授权代币
2. `depositToken(token, amount)` - 存入代币

EIP-7702 方式只需一个交易：
1. 用户签名授权，临时获得 BatchExecutor 代码
2. 在一个交易中执行：授权 + 存款

### 优势

- **用户体验**：减少交易次数，降低 Gas 成本
- **原子性**：要么全部成功，要么全部失败
- **安全性**：临时委托，交易后自动恢复
- **灵活性**：支持复杂的批量操作

## 开发和测试

### 本地测试

```bash
# 启动本地网络（需要支持 EIP-7702）
npx hardhat node --eip7702

# 部署合约
forge script script/DeployEIP7702BatchExecutor.s.sol --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY> --broadcast

# 启动前端
npm run dev
```

### 测试用例

参考 `test/EIP7702BatchExecutor.t.sol` 中的测试用例：
- 批量执行测试
- 授权验证测试
- 错误处理测试
- 事件发射测试

## 未来发展

随着 EIP-7702 的正式实施和钱包支持的完善，这个功能将变得更加实用。预期的改进包括：

1. **钱包集成**：主流钱包支持 EIP-7702
2. **网络支持**：主网和测试网全面支持
3. **工具完善**：更好的开发工具和调试支持
4. **标准化**：签名格式和交易结构的标准化

## 参考资源

- [EIP-7702 规范](https://eips.ethereum.org/EIPS/eip-7702)
- [EIP-712 签名标准](https://eips.ethereum.org/EIPS/eip-712)
- [项目源码](https://github.com/your-repo/web3-funcintegration)
- [合约文档](./README-EIP7702.md)

---

**注意**：EIP-7702 仍在开发中，实际实现可能与规范有所不同。请在生产环境中谨慎使用。