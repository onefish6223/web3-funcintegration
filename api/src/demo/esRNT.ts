import { createPublicClient, http, Address } from 'viem';
import { getStorageAt } from 'viem/actions';
import { foundry } from 'viem/chains';

// 创建公共客户端连接到本地 Anvil 链
const client = createPublicClient({
  chain: foundry,
  transport: http('http://localhost:8545'),
});

// 合约地址
const contractAddress: Address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// LockInfo 结构体:
// struct LockInfo {
//     address user;     // 20 bytes
//     uint64 startTime; // 8 bytes  
//     uint256 amount;   // 32 bytes
// }
// 总共 60 bytes，但由于 Solidity 存储对齐，实际占用 2 个存储槽（64 bytes）

async function readLocksArray() {
  console.log('Reading _locks array from esRNT contract...');
  console.log('Contract Address:', contractAddress);
  console.log('');

  try {
    // 首先读取数组长度（存储在槽 0）
    const lengthHex = await getStorageAt(client, {
      address: contractAddress,
      slot: '0x0',
    });
    
    const arrayLength = parseInt(lengthHex || '0x0', 16);
    console.log(`Array length: ${arrayLength}`);
    console.log('');

    // 读取每个数组元素
    for (let i = 0; i < arrayLength; i++) {
      // 计算数组元素的存储位置
      // 动态数组的元素存储在 keccak256(slot) + index * elementSize
      // 这里 slot = 0, elementSize = 2 (每个 LockInfo 占用 2 个槽)
      
      // 计算基础存储位置
      const baseSlot = BigInt('0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563'); // keccak256(0)
      
      // 第一个槽：user (20 bytes) + startTime (8 bytes) + padding (4 bytes)
      const slot1 = baseSlot + BigInt(i * 2);
      const slot1Data = await getStorageAt(client, {
        address: contractAddress,
        slot: `0x${slot1.toString(16)}`,
      });
      
      // 第二个槽：amount (32 bytes)
      const slot2 = baseSlot + BigInt(i * 2 + 1);
      const slot2Data = await getStorageAt(client, {
        address: contractAddress,
        slot: `0x${slot2.toString(16)}`,
      });
      
      if (slot1Data && slot2Data) {
        // 解析第一个槽的数据
        const slot1Hex = slot1Data.slice(2); // 移除 '0x' 前缀
        
        // 在 Solidity 中，结构体字段按声明顺序打包：
        // address user (20 bytes) + uint64 startTime (8 bytes) + 4 bytes padding
        // 但是在存储中，数据是右对齐的（小端序）
        
        // user address 占用前 20 bytes，但需要从右边开始计算
        // 整个槽是 64 字符（32 bytes），user 是 40 字符（20 bytes）
        const userHex = slot1Hex.slice(24, 64); // 跳过前 12 字符（6 bytes padding），取 40 字符
        const user = '0x' + userHex;
        
        // startTime 在 user 之后的 8 bytes
        const startTimeHex = slot1Hex.slice(8, 24); // 8-24 位置的 16 字符（8 bytes）
        const startTime = parseInt(startTimeHex, 16);
        
        // 解析第二个槽的数据 (amount)
        const amount = BigInt(slot2Data);
        
        console.log(`locks[${i}]: user: ${user}, startTime: ${startTime}, amount: ${amount.toString()}`);
      }
    }
  } catch (error) {
    console.error('Error reading storage:', error);
  }
}

// 执行读取函数
readLocksArray().catch(console.error);