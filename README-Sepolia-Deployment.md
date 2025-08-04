# Sepolia 网络部署指南

本指南介绍如何将项目中的智能合约部署到 Sepolia 测试网并进行验证。

## 📋 前置要求

### 1. 环境准备
- 安装 [Foundry](https://book.getfoundry.sh/getting-started/installation)
- 确保有足够的 Sepolia ETH 用于部署（可从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取）

### 2. 必需的 API 密钥
- **Infura Project ID**: 用于连接 Sepolia 网络
- **Etherscan API Key**: 用于合约验证（可选）

## 🔧 环境变量设置

在部署前，请设置以下环境变量：

```bash
# 必需 - 部署者私钥
export PRIVATE_KEY="your_private_key_here"

# 必需 - Infura 项目 ID
export INFURA_PROJECT_ID="your_infura_project_id"

# 可选 - Etherscan API 密钥（用于合约验证）
export ETHERSCAN_API_KEY="your_etherscan_api_key"
```

### 获取 API 密钥

#### Infura Project ID
1. 访问 [Infura](https://infura.io/)
2. 注册并创建新项目
3. 选择 "Web3 API" 产品
4. 复制项目 ID

#### Etherscan API Key
1. 访问 [Etherscan](https://etherscan.io/)
2. 注册账户
3. 前往 [API Keys](https://etherscan.io/myapikey) 页面
4. 创建新的 API 密钥

## 🚀 部署方法

### 方法 1: 使用自动化脚本（推荐）

```bash
# 运行自动化部署脚本
./deploy-sepolia.sh
```

这个脚本会自动：
- 检查环境变量
- 编译合约
- 部署所有合约到 Sepolia
- 尝试自动验证合约

### 方法 2: 手动使用 Foundry

```bash
# 编译合约
forge build

# 部署合约
forge script script/DeployToSepolia.s.sol:DeployToSepolia \
    --rpc-url https://sepolia.infura.io/v3/$INFURA_PROJECT_ID \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    -vvvv
```

## 📦 部署的合约

脚本将部署以下合约：

1. **MyTokenV4** - ERC20 代币合约
2. **MyNFTV4** - ERC721 NFT 合约
3. **Permit2** - 许可证合约
4. **MyTokenBankV4** - 代币银行合约
5. **MyNFTMarketV4** - NFT 市场合约
6. **EIP7702BatchExecutor** - EIP-7702 批量执行器

## 🔍 合约验证

### 自动验证
如果设置了 `ETHERSCAN_API_KEY`，脚本会尝试自动验证所有合约。

### 手动验证
如果自动验证失败，可以使用以下命令手动验证：

```bash
# MyTokenV4
forge verify-contract <CONTRACT_ADDRESS> src/MyTokenV4.sol:MyTokenV4 \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY

# MyNFTV4
forge verify-contract <CONTRACT_ADDRESS> src/MyNFTV4.sol:MyNFTV4 \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY

# Permit2
forge verify-contract <CONTRACT_ADDRESS> src/Permit2.sol:Permit2 \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY

# MyTokenBankV4
forge verify-contract <CONTRACT_ADDRESS> src/MyTokenBankV4.sol:MyTokenBankV4 \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY

# MyNFTMarketV4 (需要构造函数参数)
forge verify-contract <CONTRACT_ADDRESS> src/MyNFTMarketV4.sol:MyNFTMarketV4 \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)

# EIP7702BatchExecutor
forge verify-contract <CONTRACT_ADDRESS> src/EIP7702BatchExecutor.sol:EIP7702BatchExecutor \
    --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
```

## 📁 部署记录

部署完成后，相关信息会保存在以下位置：

- **广播记录**: `broadcast/DeployToSepolia.s.sol/11155111/run-latest.json`
- **敏感信息**: `cache/DeployToSepolia.s.sol/11155111/run-latest.json`

## 🔧 故障排除

### 常见问题

1. **资金不足错误**
   - 确保部署地址有足够的 Sepolia ETH
   - 可从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试 ETH

2. **RPC 连接错误**
   - 检查 `INFURA_PROJECT_ID` 是否正确
   - 确保网络连接正常

3. **验证失败**
   - 检查 `ETHERSCAN_API_KEY` 是否正确
   - 等待几分钟后重试（Etherscan 有时需要时间同步）
   - 使用手动验证命令

4. **私钥错误**
   - 确保私钥格式正确（以 0x 开头）
   - 确保私钥对应的地址有足够余额

### 调试技巧

```bash
# 检查账户余额
cast balance <YOUR_ADDRESS> --rpc-url https://sepolia.infura.io/v3/$INFURA_PROJECT_ID

# 检查网络连接
cast chain-id --rpc-url https://sepolia.infura.io/v3/$INFURA_PROJECT_ID

# 估算 gas 费用
cast estimate <CONTRACT_ADDRESS> "functionName()" --rpc-url https://sepolia.infura.io/v3/$INFURA_PROJECT_ID
```

## 📚 相关资源

- [Foundry 文档](https://book.getfoundry.sh/)
- [Sepolia 测试网信息](https://sepolia.dev/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
- [Infura 文档](https://docs.infura.io/)

## 🔒 安全注意事项

- **永远不要**将私钥提交到版本控制系统
- 使用环境变量或 `.env` 文件存储敏感信息
- 在生产环境中使用硬件钱包或多签钱包
- 定期轮换 API 密钥

---

如有问题，请查看 Foundry 文档或提交 issue。