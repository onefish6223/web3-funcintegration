# ERC20 转账索引系统

这是一个完整的ERC20转账数据索引和展示系统，包含后端索引服务和前端展示界面。

## 系统架构

### 后端 API 服务 (`/api`)
- **技术栈**: Node.js + Express + TypeScript + Viem + SQLite
- **功能**: 索引链上ERC20转账数据，提供RESTful API
- **端口**: 3001

### 前端界面 (`/app`)
- **技术栈**: Next.js + React + TypeScript + Wagmi + Viem
- **功能**: 用户连接钱包后查看转账历史
- **端口**: 3000

## 快速开始

### 1. 启动后端API服务

```bash
# 进入API目录
cd api

# 安装依赖（如果还没安装）
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置正确的代币合约地址和RPC URL

# 启动开发服务器
npm run dev
```

### 2. 启动前端服务

```bash
# 在项目根目录
npm run dev
```

### 3. 部署和配置代币合约

```bash
# 部署合约到Sepolia测试网
forge script script/DeployContracts.s.sol --rpc-url https://rpc.sepolia.org --broadcast --private-key YOUR_PRIVATE_KEY

# 复制部署后的MyTokenV4合约地址到 api/.env 文件中的 TOKEN_CONTRACT_ADDRESS
```

### 4. 启动索引器

```bash
# 在api目录下运行索引器
cd api
npm run indexer
```

## API 接口文档

### 健康检查
```
GET /health
```

### 获取指定地址的转账记录
```
GET /api/transfers/:address?limit=100&offset=0
```

**参数:**
- `address`: 以太坊地址
- `limit`: 每页记录数（最大1000，默认100）
- `offset`: 偏移量（默认0）

**响应:**
```json
{
  "data": [
    {
      "id": 1,
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "blockTimestamp": 1640995200,
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000000000",
      "tokenAddress": "0x...",
      "logIndex": 0,
      "transactionIndex": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 获取所有转账记录（管理接口）
```
GET /api/transfers?limit=100&offset=0
```

### 获取索引状态
```
GET /api/status
```

### 索引器控制
```
POST /api/indexer/start  # 启动索引器
POST /api/indexer/stop   # 停止索引器
```

## 前端功能

### 转账历史页面
- 连接钱包后自动显示用户的转账记录
- 支持分页加载更多记录
- 显示转账方向（转入/转出）
- 链接到Etherscan查看交易详情
- 实时检查API服务状态

### 功能特点
- **实时索引**: 监听链上新的转账事件
- **历史数据**: 索引指定区块范围的历史转账
- **分页查询**: 支持大量数据的分页展示
- **错误处理**: 完善的错误处理和重试机制
- **性能优化**: 数据库索引优化查询性能

## 环境配置

### 后端环境变量 (`api/.env`)
```env
# RPC URL for blockchain connection
RPC_URL=https://rpc.sepolia.org

# ERC20 Token Contract Address (MyTokenV4)
TOKEN_CONTRACT_ADDRESS=0x...

# Database file path
DB_PATH=./transfers.db

# API Server Port
PORT=3001

# Block range for indexing
START_BLOCK=0
END_BLOCK=latest

# Indexing interval (in milliseconds)
INDEXING_INTERVAL=30000
```

## 数据库结构

### transfers 表
```sql
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  block_timestamp INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  token_address TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  transaction_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_hash, log_index)
);
```

## 部署说明

### 生产环境部署

1. **后端API服务**
   ```bash
   cd api
   npm run build
   npm start
   ```

2. **前端应用**
   ```bash
   npm run build
   npm start
   ```

3. **索引器服务**
   ```bash
   cd api
   npm run indexer
   ```

### Docker 部署（可选）

可以创建Docker容器来部署各个服务，确保环境一致性。

## 故障排除

### 常见问题

1. **API服务离线**
   - 检查后端服务是否正常运行
   - 确认端口3001没有被占用
   - 检查环境变量配置

2. **没有转账记录**
   - 确认代币合约地址配置正确
   - 检查索引器是否正常运行
   - 确认RPC URL可访问

3. **索引器错误**
   - 检查RPC URL是否有效
   - 确认代币合约地址存在
   - 查看索引器日志排查具体错误

## 扩展功能

### 可能的扩展
- 支持多个ERC20代币的索引
- 添加转账金额统计和图表
- 支持导出转账记录
- 添加转账通知功能
- 支持更多链（Polygon、BSC等）

## 技术细节

### 索引策略
- 使用Viem的`watchEvent`监听实时事件
- 定期检查遗漏的区块
- 批量处理历史数据避免RPC限制
- 数据库唯一约束防止重复记录

### 性能优化
- 数据库索引优化查询
- 分页查询避免大量数据加载
- 前端虚拟滚动（可扩展）
- API响应缓存（可扩展）