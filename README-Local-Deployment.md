# 本地 Anvil 部署指南

本指南介绍如何使用 `deploy-local.sh` 脚本在本地 Anvil 节点上部署和测试智能合约。

## 前置要求

1. **安装 Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **确保项目依赖已安装**
   ```bash
   forge install
   ```

## 使用方法

### 基本部署

启动 Anvil 并部署合约：
```bash
./deploy-local.sh
```

这个命令会：
1. 检查依赖和环境变量
2. 启动本地 Anvil 节点 (端口 8545)
3. 编译智能合约
4. 部署初始合约 (V1 版本)
5. 可选择运行合约升级测试 (升级到 V2)
6. 显示部署信息

### 管理 Anvil 节点

**查看状态：**
```bash
./deploy-local.sh status
```

**停止节点：**
```bash
./deploy-local.sh stop
```

**重启节点：**
```bash
./deploy-local.sh restart
```

**显示帮助：**
```bash
./deploy-local.sh help
```

## 配置选项

### 环境变量

脚本支持以下环境变量（可选）：

- `PRIVATE_KEY`: 部署账户的私钥（默认使用 Anvil 的第一个账户）

### 设置私钥的方法

1. **使用环境变量：**
   ```bash
   export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ./deploy-local.sh
   ```

2. **使用 .env 文件：**
   ```bash
   echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env
   ./deploy-local.sh
   ```

3. **使用默认值：**
   如果不设置，脚本会自动使用 Anvil 的默认私钥

## 默认配置

- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **默认私钥**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **默认账户**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **初始余额**: 10,000 ETH (每个账户)

## 部署的合约

### 初始部署 (V1)
- `UpgradeableNFTV1`: 可升级的 NFT 合约
- `UpgradeableNFTMarketV1`: 可升级的 NFT 市场合约
- 相应的代理合约

### 升级部署 (V2)
- `UpgradeableNFTV2`: NFT 合约的升级版本
- `UpgradeableNFTMarketV2`: NFT 市场合约的升级版本

## 常用命令

部署完成后，你可以使用以下命令与合约交互：

**查看账户余额：**
```bash
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545
```

**查看合约代码：**
```bash
cast code <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545
```

**调用合约函数：**
```bash
cast call <CONTRACT_ADDRESS> "functionName()" --rpc-url http://127.0.0.1:8545
```

**发送交易：**
```bash
cast send <CONTRACT_ADDRESS> "functionName()" --private-key $PRIVATE_KEY --rpc-url http://127.0.0.1:8545
```

## 日志和调试

- **Anvil 日志**: `tail -f anvil.log`
- **部署详情**: 查看 `broadcast/` 目录中的 JSON 文件
- **合约地址**: 部署完成后会在终端显示

## 故障排除

### 端口被占用
如果端口 8545 被占用，脚本会自动尝试停止现有进程。如果仍有问题：
```bash
# 手动查找并停止占用端口的进程
lsof -ti:8545 | xargs kill
```

### 编译失败
确保所有依赖已正确安装：
```bash
forge install
forge build
```

### 部署失败
检查：
1. Anvil 是否正常运行
2. 私钥是否正确
3. 合约代码是否有语法错误

## 清理

停止所有服务并清理临时文件：
```bash
./deploy-local.sh stop
rm -f anvil.log .anvil.pid
```

## 注意事项

1. **数据持久性**: Anvil 重启后所有数据会丢失
2. **网络隔离**: 这是一个完全本地的测试环境
3. **Gas 费用**: 本地环境中 gas 费用很低，适合测试
4. **账户管理**: 使用 Anvil 提供的测试账户，不要在主网使用这些私钥

## 进阶用法

### 自定义 Anvil 配置

如需自定义 Anvil 配置，可以修改脚本中的启动参数：
```bash
# 在 start_anvil() 函数中修改
anvil --host $ANVIL_HOST --port $ANVIL_PORT --accounts 20 --balance 50000
```

### 集成到 CI/CD

脚本支持非交互模式，可以集成到自动化测试中：
```bash
# 设置环境变量跳过交互式升级提示
export AUTO_UPGRADE=true
./deploy-local.sh
```