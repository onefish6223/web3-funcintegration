'use client';

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAccount, useChainId } from "wagmi";
import { isAddress, parseEther, encodeFunctionData, keccak256, toHex, hexToBytes } from "viem";
import { toast } from "sonner";
import { useState } from "react";
import { EIP7702BatchExecutor_ABI } from "@/app/abi/EIP7702BatchExecutor";
import { MyTokenV4_ABI } from "@/app/abi/MyTokenV4";
import { MyTokenBankV4_ABI } from "@/app/abi/MyTokenBankV4";
import { LOCAL_TOKEN_BANK_ADDRESS, LOCAL_TOKEN_ADDRESS } from '@/app/config';

// EIP-7702 授权结构
interface Authorization {
  chainId: bigint;
  address: string;
  nonce: bigint;
  v: number;
  r: string;
  s: string;
}

// EIP-7702 交易结构
interface EIP7702Transaction {
  type: '0x4';
  to: string;
  value: string;
  data: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  authorizationList: Authorization[];
}

export default function EIP7702Transaction() {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  // 状态管理
  const [executorAddress, setExecutorAddress] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<string>(LOCAL_TOKEN_ADDRESS);
  const [bankAddress, setBankAddress] = useState<string>(LOCAL_TOKEN_BANK_ADDRESS);
  const [amount, setAmount] = useState<string>('');
  const [nonce, setNonce] = useState<string>('0');
  const [gasLimit, setGasLimit] = useState<string>('500000');
  const [maxFeePerGas, setMaxFeePerGas] = useState<string>('20');
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<string>('2');
  
  // 构建的交易和授权
  const [builtTransaction, setBuiltTransaction] = useState<EIP7702Transaction | null>(null);
  const [authorizationData, setAuthorizationData] = useState<string>('');
  
  // 保存签名数据
  const [signatureData, setSignatureData] = useState<{v: number, r: string, s: string} | null>(null);
  
  // 构建授权数据
  const buildAuthorizationData = () => {
    if (!executorAddress || !isAddress(executorAddress)) {
      toast.error("请输入有效的执行器合约地址");
      return;
    }
    
    if (!userAddress) {
      toast.error("请连接钱包");
      return;
    }
    
    try {
      // EIP-7702 授权的 EIP-712 类型定义
      const authorizationTypes = {
        Authorization: [
          { name: 'chainId', type: 'uint256' },
          { name: 'address', type: 'address' },
          { name: 'nonce', type: 'uint64' }
        ]
      };
      
      const authorizationData = {
        chainId: BigInt(chainId || 31337),
        address: executorAddress,
        nonce: BigInt(nonce)
      };
      
      // 构建用于签名的数据
      const domain = {
        name: 'EIP7702Domain',
        version: '1',
        chainId: chainId || 31337
      };
      
      const authDataString = JSON.stringify({
        types: authorizationTypes,
        domain,
        primaryType: 'Authorization',
        message: {
          chainId: authorizationData.chainId.toString(),
          address: authorizationData.address,
          nonce: authorizationData.nonce.toString()
        }
      }, null, 2);
      
      setAuthorizationData(authDataString);
      toast.success("授权数据已构建，请使用钱包签名");
    } catch (error) {
      console.error("构建授权数据失败:", error);
      toast.error("构建授权数据失败");
    }
  };

  // 调用MetaMask进行EIP-7702授权签名
  const signAuthorizationWithMetaMask = async () => {
    if (!executorAddress || !isAddress(executorAddress)) {
      toast.error("请输入有效的执行器合约地址");
      return;
    }
    
    if (!userAddress) {
      toast.error("请连接钱包");
      return;
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      toast.error("未检测到MetaMask");
      return;
    }

    try {
      // EIP-7702 授权的 EIP-712 类型定义
      const authorizationTypes = {
        Authorization: [
          { name: 'chainId', type: 'uint256' },
          { name: 'address', type: 'address' },
          { name: 'nonce', type: 'uint64' }
        ]
      };
      
      const authorizationData = {
        chainId: BigInt(chainId || 31337),
        address: executorAddress,
        nonce: BigInt(nonce)
      };
      
      // 构建用于签名的数据
      const domain = {
        name: 'EIP7702Domain',
        version: '1',
        chainId: chainId || 31337
      };

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' }
          ],
          ...authorizationTypes
        },
        domain,
        primaryType: 'Authorization',
        message: {
          chainId: authorizationData.chainId.toString(),
          address: authorizationData.address,
          nonce: authorizationData.nonce.toString()
        }
      };

      // 调用MetaMask进行签名
      const signature = await (window as any).ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [userAddress, JSON.stringify(typedData)]
      });

      // 解析签名
      const signatureBytes = hexToBytes(signature as `0x${string}`);
      const r = toHex(signatureBytes.slice(0, 32));
      const s = toHex(signatureBytes.slice(32, 64));
      const v = signatureBytes[64];

      // 更新授权数据显示
      const signedAuthData = {
        ...typedData,
        signature: {
          v,
          r,
          s
        }
      };

      setAuthorizationData(JSON.stringify(signedAuthData, null, 2));
      
      // 保存签名数据
      setSignatureData({ v, r, s });
      
      // 更新构建的交易中的签名字段
      if (builtTransaction) {
        const updatedTransaction = {
          ...builtTransaction,
          authorizationList: [{
            ...builtTransaction.authorizationList[0],
            v,
            r,
            s
          }]
        };
        setBuiltTransaction(updatedTransaction);
      }

      toast.success(`授权签名完成! v: ${v}, r: ${r.slice(0, 10)}..., s: ${s.slice(0, 10)}...`);
     } catch (error: any) {
       console.error("签名失败:", error);
       if (error.code === 4001) {
         toast.error("用户取消了签名");
       } else {
         toast.error(`签名失败: ${error.message}`);
       }
     }
   };
  
  // 构建批量操作的calldata
  const buildBatchCalldata = () => {
    if (!tokenAddress || !bankAddress || !amount) {
      throw new Error("缺少必要参数");
    }
    
    const amountWei = parseEther(amount);
    
    // 构建批量操作
    const operations = [
      {
        to: tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: MyTokenV4_ABI,
          functionName: "approve",
          args: [bankAddress as `0x${string}`, amountWei]
        }),
        value: BigInt(0)
      },
      {
        to: bankAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: MyTokenBankV4_ABI,
          functionName: "depositToken",
          args: [tokenAddress as `0x${string}`, amountWei]
        }),
        value: BigInt(0)
      }
    ];
    
    // 构建executeBatch的calldata
    return encodeFunctionData({
      abi: EIP7702BatchExecutor_ABI,
      functionName: "executeBatch",
      args: [operations]
    });
  };
  
  // 构建EIP-7702交易
  const buildEIP7702Transaction = () => {
    if (!executorAddress || !isAddress(executorAddress)) {
      toast.error("请输入有效的执行器合约地址");
      return;
    }
    
    if (!tokenAddress || !bankAddress || !amount) {
      toast.error("请填写完整的交易信息");
      return;
    }
    
    if (!isAddress(tokenAddress) || !isAddress(bankAddress)) {
      toast.error("请输入有效的合约地址");
      return;
    }
    
    try {
      const calldata = buildBatchCalldata();
      
      // 构建EIP-7702交易（注意：这里的授权列表需要实际签名）
      const transaction: EIP7702Transaction = {
        type: '0x4',
        to: userAddress || '',  // 发送给用户自己的地址（因为用户地址会临时获得执行器代码）
        value: '0',
        data: calldata,
        gasLimit,
        maxFeePerGas: parseEther(maxFeePerGas, 'gwei').toString(),
        maxPriorityFeePerGas: parseEther(maxPriorityFeePerGas, 'gwei').toString(),
        authorizationList: [
          {
            chainId: BigInt(chainId || 31337),
            address: executorAddress,
            nonce: BigInt(nonce),
            v: signatureData?.v || 0, // 使用已签名的数据或默认值
            r: signatureData?.r || '0x0000000000000000000000000000000000000000000000000000000000000000', // 使用已签名的数据或默认值
            s: signatureData?.s || '0x0000000000000000000000000000000000000000000000000000000000000000'  // 使用已签名的数据或默认值
          }
        ]
      };
      
      setBuiltTransaction(transaction);
      toast.success("EIP-7702交易已构建完成");
    } catch (error) {
      console.error("构建交易失败:", error);
      toast.error("构建交易失败");
    }
  };
  
  // 发送EIP-7702交易（需要支持EIP-7702的钱包或provider）
  const sendEIP7702Transaction = async () => {
    if (!builtTransaction) {
      toast.error("请先构建交易");
      return;
    }
    
    if (!isConnected) {
      toast.error("请先连接钱包");
      return;
    }
    
    try {
      // 注意：这需要支持EIP-7702的钱包或provider
      // 目前大多数钱包还不支持EIP-7702，这里提供示例代码
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // 检查钱包连接状态
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts'
        });
        
        if (!accounts || accounts.length === 0) {
          toast.error("钱包未连接，请重新连接钱包");
          return;
        }
        
        // 先检查是否支持EIP-7702
        toast.info("正在发送EIP-7702交易，请在钱包中确认...");
        
        // 构建交易参数
        const transactionParams = {
          type: '0x4',
          from: userAddress,
          to: builtTransaction.to,
          value: builtTransaction.value,
          data: builtTransaction.data,
          gasLimit: `0x${parseInt(builtTransaction.gasLimit).toString(16)}`,
          maxFeePerGas: `0x${BigInt(builtTransaction.maxFeePerGas).toString(16)}`,
          maxPriorityFeePerGas: `0x${BigInt(builtTransaction.maxPriorityFeePerGas).toString(16)}`,
          authorizationList: builtTransaction.authorizationList
        };
        
        console.log('发送EIP-7702交易参数:', transactionParams);
        console.log('钱包对象:', (window as any).ethereum);
        
        // 验证参数
        if (!transactionParams.to || !transactionParams.from) {
          throw new Error('缺少必需的交易参数 (to/from)');
        }
        
        // 尝试发送EIP-7702交易，添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时，请检查钱包状态')), 30000); // 30秒超时
        });

        console.log('开始发送交易请求...');
        
        // 首先尝试检查钱包是否响应基本请求
        try {
          const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
          console.log('当前链ID:', chainId);
        } catch (testError) {
          console.error('钱包基本请求失败:', testError);
          throw new Error('钱包无法响应基本请求，请检查钱包状态');
        }
        
        const requestPromise = (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParams]
        }).then((result: any) => {
          console.log('交易请求成功:', result);
          return result;
        }).catch((error: any) => {
          console.log('交易请求失败:', error);
          throw error;
        });

        const result = await Promise.race([requestPromise, timeoutPromise]);

        toast.success(`EIP-7702交易已发送: ${result}`);
      } else {
        toast.error("未检测到支持EIP-7702的钱包");
      }
    } catch (error: any) {
      console.error("发送交易失败:", error);
      
      // 更详细的错误处理，避免钱包连接断开
      if (error.code === 4001) {
        toast.error("用户取消了交易");
      } else if (error.code === -32602 || error.message?.includes('unsupported transaction type') || error.message?.includes('invalid transaction type')) {
        console.log('EIP-7702不被支持，尝试发送测试交易...');
        toast.error("当前钱包不支持EIP-7702交易类型。请使用支持EIP-7702的钱包或等待钱包更新。");
        
        // 尝试发送一个简单的测试交易来验证钱包功能
        try {
          const testTx = {
            from: userAddress,
            to: userAddress, // 发送给自己
            value: '0x0', // 0 ETH
            data: '0x'
          };
          console.log('尝试发送测试交易:', testTx);
          
          const testResult = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [testTx]
          });
          
          console.log('测试交易成功:', testResult);
          toast.info('钱包功能正常，但不支持EIP-7702交易类型');
        } catch (testError: any) {
          console.error('测试交易也失败:', testError);
          toast.error('钱包基本功能异常，请检查钱包状态');
        }
      } else if (error.code === -32603) {
        toast.error("钱包内部错误，请检查网络连接和钱包状态");
      } else if (error.message?.includes('insufficient funds')) {
        toast.error("余额不足，请检查账户余额");
      } else if (error.message?.includes('请求超时')) {
        toast.error("请求超时，请检查钱包是否正常响应并重试");
      } else if (error.message?.includes('Premature close') || error.message?.includes('Connection closed')) {
        toast.error("网络连接中断，请检查钱包连接状态并重试");
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        toast.error("网络错误，请检查网络连接并重试");
      } else {
        toast.error(`发送交易失败: ${error.message || '未知错误'}`);
      }
      
      // 不要重新抛出错误，避免影响钱包连接状态
    }
  };
  
  // 重新连接钱包
  const reconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        toast.success("钱包重新连接成功");
      } else {
        toast.error("未检测到钱包");
      }
    } catch (error: any) {
      console.error("重新连接钱包失败:", error);
      toast.error(`重新连接失败: ${error.message || '未知错误'}`);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* 状态指示器 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {isConnected ? "✓ 钱包已连接" : "○ 钱包未连接"}
        </div>
        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          链ID: {chainId || 'Unknown'}
        </div>
        {!isConnected && (
          <Button 
            onClick={reconnectWallet}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            重新连接钱包
          </Button>
        )}
      </div>
      
      {/* EIP-7702 交易构建器 */}
      <div className="border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-bold">EIP-7702 交易构建器</h2>
        
        {/* 基本配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">执行器合约地址</label>
            <Input
              value={executorAddress}
              onChange={(e) => setExecutorAddress(e.target.value)}
              placeholder="EIP7702BatchExecutor合约地址"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">用户Nonce</label>
            <Input
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              placeholder="0"
              type="number"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">代币合约地址</label>
            <Input
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="代币合约地址"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">银行合约地址</label>
            <Input
              value={bankAddress}
              onChange={(e) => setBankAddress(e.target.value)}
              placeholder="银行合约地址"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">存款金额 (ETH)</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.0"
              type="number"
              step="0.01"
            />
          </div>
        </div>
        
        {/* Gas 配置 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Gas Limit</label>
            <Input
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              placeholder="500000"
              type="number"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Max Fee Per Gas (Gwei)</label>
            <Input
              value={maxFeePerGas}
              onChange={(e) => setMaxFeePerGas(e.target.value)}
              placeholder="20"
              type="number"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Max Priority Fee Per Gas (Gwei)</label>
            <Input
              value={maxPriorityFeePerGas}
              onChange={(e) => setMaxPriorityFeePerGas(e.target.value)}
              placeholder="2"
              type="number"
              step="0.1"
            />
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-4 flex-wrap">
          <Button onClick={buildAuthorizationData} className="flex-1 min-w-[150px]">
            构建授权数据
          </Button>
          <Button onClick={signAuthorizationWithMetaMask} className="flex-1 min-w-[150px]">
            MetaMask签名授权
          </Button>
          <Button onClick={buildEIP7702Transaction} className="flex-1 min-w-[150px]">
            构建EIP-7702交易
          </Button>
          <Button 
            onClick={sendEIP7702Transaction} 
            className="flex-1 min-w-[150px]"
            disabled={!builtTransaction || !isConnected}
            title={!isConnected ? "请先连接钱包" : !builtTransaction ? "请先构建交易" : "发送EIP-7702交易"}
          >
            发送交易
          </Button>
        </div>
        
        {/* EIP-7702 支持说明 */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-sm">⚠️</span>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">EIP-7702 支持说明：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>EIP-7702 是一个新的以太坊提案，目前大多数钱包尚未支持</li>
                <li>如果钱包不支持此交易类型，可能会显示错误或断开连接</li>
                <li>如果连接断开，请使用上方的"重新连接钱包"按钮</li>
                <li>建议在测试网络上进行测试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 授权数据显示 */}
      {authorizationData && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">EIP-712 授权签名数据</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">授权数据（可使用上方"MetaMask签名授权"按钮自动签名）：</p>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto">{authorizationData}</pre>
          </div>
          <div className="text-sm text-blue-600">
            <p>💡 提示：点击"MetaMask签名授权"按钮可自动完成签名并填入 v, r, s 值</p>
          </div>
        </div>
      )}
      
      {/* 构建的交易显示 */}
      {builtTransaction && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">构建的 EIP-7702 交易</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
              {JSON.stringify(builtTransaction, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}
            </pre>
          </div>
          <div className="text-sm text-blue-600">
            <p>📝 交易类型: 0x4 (EIP-7702)</p>
            <p>🎯 目标: 用户地址临时获得执行器合约代码</p>
            <p>⚡ 操作: 在一个交易中完成代币授权和存款</p>
          </div>
        </div>
      )}
      
      {/* 说明文档 */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">EIP-7702 交易说明</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">什么是 EIP-7702？</h4>
            <p className="text-gray-600">
              EIP-7702 允许 EOA（外部拥有账户）临时获得智能合约的能力。通过授权列表，
              用户可以将自己的地址临时"升级"为智能合约，执行复杂的批量操作。
            </p>
          </div>
          
          <div>
            <h4 className="font-medium">交易流程：</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>用户签名授权，允许自己的地址临时获得执行器合约的代码</li>
              <li>构建包含授权列表的 type-4 交易</li>
              <li>发送交易，用户地址临时变成智能合约</li>
              <li>执行批量操作（授权 + 存款）</li>
              <li>交易完成后，用户地址恢复为普通 EOA</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium">注意事项：</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>需要支持 EIP-7702 的钱包和网络</li>
              <li>授权签名必须使用 EIP-712 标准</li>
              <li>交易类型必须为 0x4</li>
              <li>目前大多数钱包和网络还不支持 EIP-7702</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}