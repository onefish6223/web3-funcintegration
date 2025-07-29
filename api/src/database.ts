import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export interface Transfer {
  id?: number;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  logIndex: number;
  transactionIndex: number;
  createdAt?: string;
}

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string = './transfers.db') {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(this.dbPath);
    this.init();
  }

  private async init() {
    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS transfers (
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
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }
        });

        // 创建索引以提高查询性能
        this.db.run('CREATE INDEX IF NOT EXISTS idx_from_address ON transfers(from_address)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_to_address ON transfers(to_address)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_block_number ON transfers(block_number)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_token_address ON transfers(token_address)', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database initialized successfully');
            resolve();
          }
        });
      });
    });
  }

  async insertTransfer(transfer: Transfer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT OR IGNORE INTO transfers (
          transaction_hash, block_number, block_timestamp, from_address, 
          to_address, value, token_address, log_index, transaction_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transfer.transactionHash,
        transfer.blockNumber,
        transfer.blockTimestamp,
        transfer.from.toLowerCase(),
        transfer.to.toLowerCase(),
        transfer.value,
        transfer.tokenAddress.toLowerCase(),
        transfer.logIndex,
        transfer.transactionIndex
      ], (err) => {
        if (err) {
          console.error('Error inserting transfer:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getTransfersByAddress(address: string, limit: number = 100, offset: number = 0): Promise<Transfer[]> {
    return new Promise<Transfer[]>((resolve, reject) => {
      this.db.all(`
        SELECT 
          id,
          transaction_hash as transactionHash,
          block_number as blockNumber,
          block_timestamp as blockTimestamp,
          from_address as \`from\`,
          to_address as \`to\`,
          value,
          token_address as tokenAddress,
          log_index as logIndex,
          transaction_index as transactionIndex,
          created_at as createdAt
        FROM transfers 
        WHERE from_address = ? OR to_address = ?
        ORDER BY block_number DESC, transaction_index DESC, log_index DESC
        LIMIT ? OFFSET ?
      `, [address.toLowerCase(), address.toLowerCase(), limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Transfer[]);
        }
      });
    });
  }

  async getTransferCount(address: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.db.get(`
        SELECT COUNT(*) as count 
        FROM transfers 
        WHERE from_address = ? OR to_address = ?
      `, [address.toLowerCase(), address.toLowerCase()], (err, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.count);
        }
      });
    });
  }

  async getLastIndexedBlock(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.db.get('SELECT MAX(block_number) as lastBlock FROM transfers', (err, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result?.lastBlock || 0);
        }
      });
    });
  }

  async getAllTransfers(limit: number = 100, offset: number = 0): Promise<Transfer[]> {
    return new Promise<Transfer[]>((resolve, reject) => {
      this.db.all(`
        SELECT 
          id,
          transaction_hash as transactionHash,
          block_number as blockNumber,
          block_timestamp as blockTimestamp,
          from_address as \`from\`,
          to_address as \`to\`,
          value,
          token_address as tokenAddress,
          log_index as logIndex,
          transaction_index as transactionIndex,
          created_at as createdAt
        FROM transfers 
        ORDER BY block_number DESC, transaction_index DESC, log_index DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Transfer[]);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export default Database;