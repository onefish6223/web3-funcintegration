# Meme发射平台工厂合约

这是一个基于EVM链的Meme代币发射平台，使用最小代理模式来降低Gas成本。

## 合约架构

### MemeToken.sol
- ERC20代币模板合约
- 支持初始化函数设置代币参数
- 包含铸造逻辑和总量限制
- 记录每次铸造的支付金额

### MemeFactory.sol
- 工厂合约，使用最小代理模式部署MemeToken实例
- 管理所有已部署的Meme代币
- 处理费用分配（1%给平台，99%给创建者）
- 支持紧急提款功能

## 主要功能

### 1. deployMeme(string symbol, uint totalSupply, uint perMint, uint price)
创建新的Meme代币：
- `symbol`: 代币符号
- `totalSupply`: 总发行量（包含18位小数）
- `perMint`: 每次铸造数量（包含18位小数）
- `price`: 每个代币价格（wei计价）

### 2. mintMeme(address tokenAddr) payable
铸造Meme代币：
- `tokenAddr`: 代币合约地址
- 自动铸造`perMint`数量的代币
- 费用按比例分配给平台和创建者
- 支持多余ETH退款

## 费用分配

- **平台费用**: 1%
- **创建者费用**: 99%

## 安全特性

- 使用OpenZeppelin的ReentrancyGuard防止重入攻击
- 使用Ownable进行权限管理
- 支持紧急提款功能
- 严格的参数验证

## 测试覆盖

测试文件：`test/MemeFactory.t.sol`

包含以下测试用例：
1. ✅ 部署Meme代币功能
2. ✅ 铸造Meme代币功能
3. ✅ 费用分配正确性
4. ✅ 铸造数量限制
5. ✅ 支付验证（不足/过量）
6. ✅ 权限控制
7. ✅ 紧急提款功能
8. ✅ 查询功能

## 使用示例

```solidity
// 部署工厂合约
MemeFactory factory = new MemeFactory(memeTokenTemplate);

// 创建Meme代币
address tokenAddr = factory.deployMeme(
    "PEPE",           // 符号
    1000000 * 1e18,   // 总量：100万代币
    1000 * 1e18,      // 每次铸造：1000代币
    0.000001 ether    // 价格：每代币0.000001 ETH
);

// 铸造代币
factory.mintMeme{value: 0.001 ether}(tokenAddr);
```

## 运行测试

```bash
forge test --match-contract MemeFactoryTest -v
```

所有测试均已通过，确保合约功能正确且安全。