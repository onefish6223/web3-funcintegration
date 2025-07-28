'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { toast } from 'sonner';
import { MyNFTV4_ABI } from '../abi/MyNFTV4';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { isAddress } from 'viem';
import { LOCAL_NFT_ADDRESS } from '@/app/config';

// 不同链的默认合约地址配置
const defaultContractAddresses: Record<number, string> = {
  1: '0x1234567890123456789012345678901234567890', // Mainnet
  42161: '0x2345678901234567890123456789012345678901', // Arbitrum
  11155111: '0x3456789012345678901234567890123456789012', // Sepolia
  31337: LOCAL_NFT_ADDRESS, // Anvil
};

export default function NFTInteraction() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();

  // 合约地址状态管理
  const [contractAddress, setContractAddress] = useState<string>(
    defaultContractAddresses[chainId] || defaultContractAddresses[31337]
  );
  const [inputContractAddress, setInputContractAddress] = useState('');

  // 其他状态管理
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [operatorAddress, setOperatorAddress] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [approvalStatus, setApprovalStatus] = useState(false);
  const [transferData, setTransferData] = useState('');
  const [interfaceId, setInterfaceId] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');

  // 链切换时更新默认合约地址
  useEffect(() => {
    const defaultAddress = defaultContractAddresses[chainId];
    if (defaultAddress) {
      setContractAddress(defaultAddress);
    }
  }, [chainId]);

  // 设置合约地址的函数
  const handleSetContractAddress = () => {
    if (!inputContractAddress) {
      toast.error('请输入合约地址');
      return;
    }
    if (!isAddress(inputContractAddress)) {
      toast.error('请输入有效的合约地址');
      return;
    }
    setContractAddress(inputContractAddress);
    toast.success('合约地址已更新');
  };

  // 重置为默认地址的函数
  const handleResetToDefault = () => {
    const defaultAddress = defaultContractAddresses[chainId];
    if (defaultAddress) {
      setContractAddress(defaultAddress);
      setInputContractAddress('');
      toast.success('已重置为默认合约地址');
    } else {
      toast.error('当前链没有配置默认合约地址');
    }
  };

  // 读取合约数据
  const { data: contractName } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'name',
    query: { enabled: !!contractAddress && isAddress(contractAddress) },
  });

  const { data: contractSymbol } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'symbol',
    query: { enabled: !!contractAddress && isAddress(contractAddress) },
  });

  const { data: contractOwner } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'owner',
    query: { enabled: !!contractAddress && isAddress(contractAddress) },
  });

  const { data: userBalance } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!address },
  });

  const { data: tokenOwner } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!tokenId && !isNaN(Number(tokenId)) },
  });

  const { data: tokenURI } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!tokenId && !isNaN(Number(tokenId)) },
  });

  const { data: approvedAddress } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'getApproved',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!tokenId && !isNaN(Number(tokenId)) },
  });

  const { data: isApprovedForAll } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'isApprovedForAll',
    args: ownerAddress && operatorAddress && isAddress(ownerAddress) && isAddress(operatorAddress) 
      ? [ownerAddress as `0x${string}`, operatorAddress as `0x${string}`] 
      : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!ownerAddress && !!operatorAddress && isAddress(ownerAddress) && isAddress(operatorAddress) },
  });

  const { data: balanceOfOwner } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'balanceOf',
    args: ownerAddress && isAddress(ownerAddress) ? [ownerAddress as `0x${string}`] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!ownerAddress && isAddress(ownerAddress) },
  });

  const { data: supportsInterface } = useReadContract({
    address: contractAddress && isAddress(contractAddress) ? contractAddress as `0x${string}` : undefined,
    abi: MyNFTV4_ABI,
    functionName: 'supportsInterface',
    args: interfaceId ? [interfaceId as `0x${string}`] : undefined,
    query: { enabled: !!contractAddress && isAddress(contractAddress) && !!interfaceId && interfaceId.startsWith('0x') && interfaceId.length === 10 },
  });

  useEffect(() => {
    if (isConfirmed) {
      toast.success('交易确认成功!');
    }
  }, [isConfirmed]);

  // 写入函数
  const handleMint = () => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'mint',
    });
    toast.info('正在铸造 NFT...');
  };

  const handleApprove = () => {
    if (!isConnected || !toAddress || !tokenId) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(toAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'approve',
      args: [toAddress as `0x${string}`, BigInt(tokenId)],
    });
    toast.info('正在授权...');
  };

  const handleSetApprovalForAll = () => {
    if (!isConnected || !operatorAddress) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(operatorAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'setApprovalForAll',
      args: [operatorAddress as `0x${string}`, approvalStatus],
    });
    toast.info('正在设置全局授权...');
  };

  const handleTransferFrom = () => {
    if (!isConnected || !fromAddress || !toAddress || !tokenId) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(fromAddress) || !isAddress(toAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'transferFrom',
      args: [fromAddress as `0x${string}`, toAddress as `0x${string}`, BigInt(tokenId)],
    });
    toast.info('正在转移 NFT...');
  };

  const handleSafeTransferFrom = () => {
    if (!isConnected || !fromAddress || !toAddress || !tokenId) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(fromAddress) || !isAddress(toAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'safeTransferFrom',
      args: [fromAddress as `0x${string}`, toAddress as `0x${string}`, BigInt(tokenId)],
    });
    toast.info('正在安全转移 NFT...');
  };

  const handleSafeTransferFromWithData = () => {
    if (!isConnected || !fromAddress || !toAddress || !tokenId) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(fromAddress) || !isAddress(toAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    const data = transferData ? transferData as `0x${string}` : '0x';
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'safeTransferFrom',
      args: [fromAddress as `0x${string}`, toAddress as `0x${string}`, BigInt(tokenId), data],
    });
    toast.info('正在安全转移 NFT（带数据）...');
  };

  const handleTransferOwnership = () => {
    if (!isConnected || !newOwnerAddress) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(newOwnerAddress)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'transferOwnership',
      args: [newOwnerAddress as `0x${string}`],
    });
    toast.info('正在转移合约所有权...');
  };

  const handleRenounceOwnership = () => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: MyNFTV4_ABI,
      functionName: 'renounceOwnership',
    });
    toast.info('正在放弃合约所有权...');
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
         {isPending && <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">⏳ 交易处理中</div>}
         {isConfirming && <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">⏳ 交易确认中</div>}
         {isConfirmed && <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✅ 交易已确认</div>}
      </div>

      {/* 合约地址设置 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold">合约地址设置</h3>
        
        {/* 当前地址显示 */}
        <div className="space-y-2">
          <div className="text-sm">当前合约地址: {contractAddress}</div>
          <div className="text-sm">当前链 ID: {chainId}</div>
          <div className="text-sm">默认地址: {defaultContractAddresses[chainId] || '未配置'}</div>
        </div>

        {/* 合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="contractAddress">新合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="contractAddress"
              placeholder="输入合约地址 (0x...)"
              value={inputContractAddress}
              onChange={(e) => setInputContractAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetContractAddress} size="sm">
              设置地址
            </Button>
          </div>
        </div>

        {/* 重置按钮 */}
        <Button onClick={handleResetToDefault} variant="outline" className="w-full">
          重置为默认地址
        </Button>
      </div>

      <div className="space-y-8">
        {/* 合约基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">合约名称</Label>
            <p className="text-lg font-semibold">{contractName || '加载中...'}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">合约符号</Label>
            <p className="text-lg font-semibold">{contractSymbol || '加载中...'}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">合约所有者</Label>
            <p className="text-sm font-mono break-all">{contractOwner || '加载中...'}</p>
          </div>
        </div>

        {/* 用户信息 */}
        {isConnected && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium">您的 NFT 余额</Label>
            <p className="text-2xl font-bold text-blue-600">{userBalance?.toString() || '0'}</p>
          </div>
        )}

        <Separator />

        {/* 铸造功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🎯 铸造功能</h3>
          <div className="flex gap-2">
            <Button 
              onClick={handleMint} 
              disabled={!isConnected || isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? '处理中...' : '铸造 NFT'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            注意：只有合约所有者可以铸造 NFT
          </p>
        </div>

        <Separator />

        {/* 查询功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🔍 查询功能</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                placeholder="输入 Token ID"
                value={tokenId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenId(e.target.value)}
              />
              {tokenOwner && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>所有者:</strong> {tokenOwner}
                </div>
              )}
              {tokenURI && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>Token URI:</strong> {tokenURI}
                </div>
              )}
              {approvedAddress && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>已授权地址:</strong> {approvedAddress}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerAddress">查询地址余额</Label>
              <Input
                id="ownerAddress"
                placeholder="输入地址"
                value={ownerAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwnerAddress(e.target.value)}
              />
              {balanceOfOwner !== undefined && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>余额:</strong> {balanceOfOwner.toString()}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatorAddress">操作员地址</Label>
              <Input
                id="operatorAddress"
                placeholder="输入操作员地址"
                value={operatorAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOperatorAddress(e.target.value)}
              />
              {isApprovedForAll !== undefined && ownerAddress && operatorAddress && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>全局授权状态:</strong> {isApprovedForAll ? '已授权' : '未授权'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interfaceId">接口 ID (0x开头)</Label>
              <Input
                id="interfaceId"
                placeholder="输入接口 ID"
                value={interfaceId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterfaceId(e.target.value)}
              />
              {supportsInterface !== undefined && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <strong>支持接口:</strong> {supportsInterface ? '是' : '否'}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* 授权功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">✅ 授权功能</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="approveAddress">授权地址</Label>
              <Input
                id="approveAddress"
                placeholder="输入要授权的地址"
                value={toAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToAddress(e.target.value)}
              />
              <Button 
                onClick={handleApprove} 
                disabled={!isConnected || isPending || isConfirming}
                className="w-full"
              >
                授权 Token
              </Button>
            </div>

            <div className="space-y-2">
              <Label>全局授权设置</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="approvalStatus"
                  checked={approvalStatus}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApprovalStatus(e.target.checked)}
                />
                <Label htmlFor="approvalStatus">授权所有 Token</Label>
              </div>
              <Button 
                onClick={handleSetApprovalForAll} 
                disabled={!isConnected || isPending || isConfirming}
                className="w-full"
              >
                设置全局授权
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* 转移功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🔄 转移功能</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromAddress">发送方地址</Label>
              <Input
                id="fromAddress"
                placeholder="输入发送方地址"
                value={fromAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toAddressTransfer">接收方地址</Label>
              <Input
                id="toAddressTransfer"
                placeholder="输入接收方地址"
                value={toAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={handleTransferFrom} 
              disabled={!isConnected || isPending || isConfirming}
            >
              普通转移
            </Button>
            <Button 
              onClick={handleSafeTransferFrom} 
              disabled={!isConnected || isPending || isConfirming}
            >
              安全转移
            </Button>
            <Button 
              onClick={handleSafeTransferFromWithData} 
              disabled={!isConnected || isPending || isConfirming}
            >
              安全转移(带数据)
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferData">转移数据 (可选)</Label>
            <Textarea
              id="transferData"
              placeholder="输入转移数据 (hex格式)"
              value={transferData}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransferData(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* 所有权管理 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">👑 所有权管理</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newOwnerAddress">新所有者地址</Label>
              <Input
                id="newOwnerAddress"
                placeholder="输入新所有者地址"
                value={newOwnerAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOwnerAddress(e.target.value)}
              />
              <Button 
                onClick={handleTransferOwnership} 
                disabled={!isConnected || isPending || isConfirming}
                className="w-full"
              >
                转移所有权
              </Button>
            </div>

            <div className="space-y-2">
              <Label>危险操作</Label>
              <Button 
                onClick={handleRenounceOwnership} 
                disabled={!isConnected || isPending || isConfirming}
                variant="destructive"
                className="w-full"
              >
                放弃所有权
              </Button>
              <p className="text-xs text-red-500">
                警告：此操作不可逆转！
              </p>
            </div>
          </div>
        </div>

        {/* 交易状态 */}
        {hash && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <Label className="text-sm font-medium">交易哈希</Label>
            <p className="text-sm font-mono break-all">{hash}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isConfirming ? '等待确认...' : isConfirmed ? '交易已确认' : '交易已提交'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}