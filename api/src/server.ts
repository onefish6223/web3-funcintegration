import express from 'express';
import cors from 'cors';
import Database, { Transfer } from './database';
import ERC20Indexer from './indexer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库实例
const db = new Database(process.env.DB_PATH);

// 索引器实例（可选，如果需要在API服务器中运行索引器）
let indexer: ERC20Indexer | null = null;

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取指定地址的转账记录
app.get('/api/transfers/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = '100', offset = '0' } = req.query;
    
    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    
    if (limitNum > 1000) {
      return res.status(400).json({ error: 'Limit cannot exceed 1000' });
    }
    
    const transfers = await db.getTransfersByAddress(address, limitNum, offsetNum);
    const totalCount = await db.getTransferCount(address);
    
    res.json({
      data: transfers,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取所有转账记录（管理接口）
app.get('/api/transfers', async (req, res) => {
  try {
    const { limit = '100', offset = '0' } = req.query;
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    
    if (limitNum > 1000) {
      return res.status(400).json({ error: 'Limit cannot exceed 1000' });
    }
    
    const transfers = await db.getAllTransfers(limitNum, offsetNum);
    
    res.json({
      data: transfers,
      pagination: {
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Error fetching all transfers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取索引状态
app.get('/api/status', async (req, res) => {
  try {
    const lastIndexedBlock = await db.getLastIndexedBlock();
    
    res.json({
      lastIndexedBlock,
      tokenAddress: process.env.TOKEN_CONTRACT_ADDRESS,
      indexerRunning: indexer !== null
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动/停止索引器的管理接口
app.post('/api/indexer/start', async (req, res) => {
  try {
    if (indexer) {
      return res.status(400).json({ error: 'Indexer is already running' });
    }
    
    indexer = new ERC20Indexer();
    await indexer.start();
    
    res.json({ message: 'Indexer started successfully' });
  } catch (error) {
    console.error('Error starting indexer:', error);
    res.status(500).json({ error: 'Failed to start indexer' });
  }
});

app.post('/api/indexer/stop', async (req, res) => {
  try {
    if (!indexer) {
      return res.status(400).json({ error: 'Indexer is not running' });
    }
    
    await indexer.stop();
    indexer = null;
    
    res.json({ message: 'Indexer stopped successfully' });
  } catch (error) {
    console.error('Error stopping indexer:', error);
    res.status(500).json({ error: 'Failed to stop indexer' });
  }
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`ERC20 Transfer API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API docs: http://localhost:${port}/api/transfers/:address`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (indexer) {
    await indexer.stop();
  }
  db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (indexer) {
    await indexer.stop();
  }
  db.close();
  process.exit(0);
});

export default app;