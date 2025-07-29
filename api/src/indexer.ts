import { createPublicClient, http, parseAbiItem, getContract, Log } from 'viem';
import { sepolia } from 'viem/chains';
import Database, { Transfer } from './database';
import dotenv from 'dotenv';

dotenv.config();

// ERC20 Transfer event ABI
const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

class ERC20Indexer {
  private client;
  private db: Database;
  private tokenAddress: string;
  private isRunning: boolean = false;
  private indexingInterval: number;

  constructor() {
    this.client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL)
    });
    
    this.db = new Database(process.env.DB_PATH);
    this.tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS!;
    this.indexingInterval = parseInt(process.env.INDEXING_INTERVAL || '30000');
    
    if (!this.tokenAddress) {
      throw new Error('TOKEN_CONTRACT_ADDRESS is required in environment variables');
    }
  }

  async start() {
    console.log('Starting ERC20 indexer...');
    console.log('Token address:', this.tokenAddress);
    
    this.isRunning = true;
    
    // 首次运行时索引历史数据
    await this.indexHistoricalData();
    
    // 开始监听新的转账事件
    this.startWatching();
    
    // 定期检查遗漏的区块
    this.startPeriodicIndexing();
  }

  async stop() {
    console.log('Stopping ERC20 indexer...');
    this.isRunning = false;
    this.db.close();
  }

  private async indexHistoricalData() {
    try {
      const lastIndexedBlock = await this.db.getLastIndexedBlock();
      const currentBlock = await this.client.getBlockNumber();
      
      const startBlock = lastIndexedBlock > 0 ? BigInt(lastIndexedBlock + 1) : BigInt(process.env.START_BLOCK || '0');
      const endBlock = currentBlock;
      
      if (startBlock > endBlock) {
        console.log('No new blocks to index');
        return;
      }
      
      console.log(`Indexing historical data from block ${startBlock} to ${endBlock}`);
      
      // 分批处理大量区块，避免RPC限制
      const batchSize = 1000n;
      
      for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += batchSize) {
        const toBlock = fromBlock + batchSize - 1n > endBlock ? endBlock : fromBlock + batchSize - 1n;
        
        console.log(`Processing blocks ${fromBlock} to ${toBlock}`);
        
        try {
          const logs = await this.client.getLogs({
            address: this.tokenAddress as `0x${string}`,
            event: transferEventAbi,
            fromBlock,
            toBlock
          });
          
          await this.processLogs(logs);
          
          // 添加小延迟避免RPC限制
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing blocks ${fromBlock} to ${toBlock}:`, error);
          // 继续处理下一批
        }
      }
      
      console.log('Historical data indexing completed');
    } catch (error) {
      console.error('Error indexing historical data:', error);
    }
  }

  private startWatching() {
    console.log('Starting to watch for new Transfer events...');
    
    // 使用 viem 的 watchEvent 监听新事件
    this.client.watchEvent({
      address: this.tokenAddress as `0x${string}`,
      event: transferEventAbi,
      onLogs: async (logs) => {
        console.log(`Received ${logs.length} new transfer events`);
        await this.processLogs(logs);
      },
      onError: (error) => {
        console.error('Error watching events:', error);
      }
    });
  }

  private startPeriodicIndexing() {
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.indexHistoricalData();
      } catch (error) {
        console.error('Error in periodic indexing:', error);
      }
    }, this.indexingInterval);
  }

  private async processLogs(logs: Log[]) {
    for (const log of logs) {
      try {
        // 获取区块信息以获取时间戳
        const block = await this.client.getBlock({ blockNumber: log.blockNumber! });
        
        const transfer: Transfer = {
          transactionHash: log.transactionHash!,
          blockNumber: Number(log.blockNumber!),
          blockTimestamp: Number(block.timestamp),
          from: log.topics[1]! as string, // from address
          to: log.topics[2]! as string,   // to address
          value: log.data!, // transfer amount
          tokenAddress: this.tokenAddress,
          logIndex: log.logIndex!,
          transactionIndex: log.transactionIndex!
        };
        
        // 处理地址格式（移除前导零）
        transfer.from = `0x${transfer.from.slice(26)}`;
        transfer.to = `0x${transfer.to.slice(26)}`;
        
        await this.db.insertTransfer(transfer);
        
        console.log(`Indexed transfer: ${transfer.from} -> ${transfer.to}, amount: ${transfer.value}`);
      } catch (error) {
        console.error('Error processing log:', error, log);
      }
    }
  }
}

// 如果直接运行此文件，启动索引器
if (require.main === module) {
  const indexer = new ERC20Indexer();
  
  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });
  
  indexer.start().catch(console.error);
}

export default ERC20Indexer;