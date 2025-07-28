'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { toast } from 'sonner';
import { MyTokenV4_ABI } from '../abi/MyTokenV4';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { LOCAL_TOKEN_ADDRESS } from '@/app/config';

export default function TokenInteraction() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();
  
  // 不同链的默认合约地址
  const defaultTokenAddresses: Record<number, string> = {
    1: "0x1b73C5498c1E3b4dbA84de0F1833c4a029d90519", // Mainnet
    42161: "0x4273C5498c1E3b4dbA84de0F1833c4a029d90519", // Arbitrum
    11155111: "0x1173C5498c1E3b4dbA84de0F1833c4a029d90519", // Sepolia
    31337: LOCAL_TOKEN_ADDRESS, // Anvil
  };
  
  const [tokenAddress, setTokenAddress] = useState<string>(defaultTokenAddresses[chainId] || "");
  const [inputTokenAddress, setInputTokenAddress] = useState<string>("");
  
  // 当链切换时更新默认地址
  useEffect(() => {
    const defaultAddress = defaultTokenAddresses[chainId];
    if (defaultAddress != tokenAddress) {
      setTokenAddress(defaultAddress);
    }
  }, [chainId]);

  // 状态管理
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [transferFromFrom, setTransferFromFrom] = useState('');
  const [transferFromTo, setTransferFromTo] = useState('');
  const [transferFromAmount, setTransferFromAmount] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [spenderAddress, setSpenderAddress] = useState('');
  const [transferData, setTransferData] = useState('');
  const [interfaceId, setInterfaceId] = useState('');
  const [nonceAddress, setNonceAddress] = useState('');
  
  // Permit 相关状态
  const [permitOwner, setPermitOwner] = useState('');
  const [permitSpender, setPermitSpender] = useState('');
  const [permitValue, setPermitValue] = useState('');
  const [permitDeadline, setPermitDeadline] = useState('');
  const [permitV, setPermitV] = useState('');
  const [permitR, setPermitR] = useState('');
  const [permitS, setPermitS] = useState('');



  // 设置合约地址的函数
  const handleSetTokenAddress = () => {
    if (!inputTokenAddress) {
      toast.error('请输入合约地址');
      return;
    }
    if (!isAddress(inputTokenAddress)) {
      toast.error('请输入有效的合约地址');
      return;
    }
    setTokenAddress(inputTokenAddress);
    toast.success('合约地址已更新');
  };

  // 重置为默认地址的函数
  const handleResetToDefault = () => {
    const defaultAddress = defaultTokenAddresses[chainId];
    if (defaultAddress) {
      setTokenAddress(defaultAddress);
      setInputTokenAddress('');
      toast.success('已重置为默认合约地址');
    } else {
      toast.error('当前链没有配置默认合约地址');
    }
  };

  // 读取合约数据
  const { data: tokenName } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'name',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) && !!address },
  });

  const { data: queryBalance } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'balanceOf',
    args: queryAddress && isAddress(queryAddress) ? [queryAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) && !!queryAddress && isAddress(queryAddress) },
  });

  const { data: allowanceAmount } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress && isAddress(ownerAddress) && isAddress(spenderAddress) 
      ? [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`] 
      : undefined,
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) && !!ownerAddress && !!spenderAddress && isAddress(ownerAddress) && isAddress(spenderAddress) },
  });

  const { data: domainSeparator } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'DOMAIN_SEPARATOR',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  const { data: nonces } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'nonces',
    args: nonceAddress && isAddress(nonceAddress) ? [nonceAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) && !!nonceAddress && isAddress(nonceAddress) },
  });

  const { data: supportsInterface } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'supportsInterface',
    args: interfaceId ? [interfaceId as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) && !!interfaceId && interfaceId.startsWith('0x') && interfaceId.length === 10 },
  });

  const { data: eip712Domain } = useReadContract({
    address: tokenAddress && isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined,
    abi: MyTokenV4_ABI,
    functionName: 'eip712Domain',
    query: { enabled: !!tokenAddress && isAddress(tokenAddress) },
  });

  useEffect(() => {
    if (isConfirmed) {
      toast.success('交易确认成功!');
    }
  }, [isConfirmed]);

  // 写入函数
  const handleTransfer = () => {
    if (!isConnected || !transferTo || !transferAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(transferTo)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MyTokenV4_ABI,
      functionName: 'transfer',
      args: [transferTo as `0x${string}`, parseEther(transferAmount)],
    });
    toast.info('正在转账...');
  };

  const handleApprove = () => {
    if (!isConnected || !approveSpender || !approveAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(approveSpender)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MyTokenV4_ABI,
      functionName: 'approve',
      args: [approveSpender as `0x${string}`, parseEther(approveAmount)],
    });
    toast.info('正在授权...');
  };

  const handleTransferFrom = () => {
    if (!isConnected || !transferFromFrom || !transferFromTo || !transferFromAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(transferFromFrom) || !isAddress(transferFromTo)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MyTokenV4_ABI,
      functionName: 'transferFrom',
      args: [transferFromFrom as `0x${string}`, transferFromTo as `0x${string}`, parseEther(transferFromAmount)],
    });
    toast.info('正在代理转账...');
  };

  const handleTransferAndCall = () => {
    if (!isConnected || !transferTo || !transferAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(transferTo)) {
      toast.error('请输入有效的地址');
      return;
    }
    if (transferData) {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'transferAndCall',
        args: [transferTo as `0x${string}`, parseEther(transferAmount), transferData as `0x${string}`],
      });
    } else {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'transferAndCall',
        args: [transferTo as `0x${string}`, parseEther(transferAmount)],
      });
    }
    toast.info('正在转账并调用...');
  };

  const handleApproveAndCall = () => {
    if (!isConnected || !approveSpender || !approveAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(approveSpender)) {
      toast.error('请输入有效的地址');
      return;
    }
    if (transferData) {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'approveAndCall',
        args: [approveSpender as `0x${string}`, parseEther(approveAmount), transferData as `0x${string}`],
      });
    } else {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'approveAndCall',
        args: [approveSpender as `0x${string}`, parseEther(approveAmount)],
      });
    }
    toast.info('正在授权并调用...');
  };

  const handleTransferFromAndCall = () => {
    if (!isConnected || !transferFromFrom || !transferFromTo || !transferFromAmount) {
      toast.error('请填写完整信息并连接钱包');
      return;
    }
    if (!isAddress(transferFromFrom) || !isAddress(transferFromTo)) {
      toast.error('请输入有效的地址');
      return;
    }
    if (transferData) {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'transferFromAndCall',
        args: [transferFromFrom as `0x${string}`, transferFromTo as `0x${string}`, parseEther(transferFromAmount), transferData as `0x${string}`],
      });
    } else {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: 'transferFromAndCall',
        args: [transferFromFrom as `0x${string}`, transferFromTo as `0x${string}`, parseEther(transferFromAmount)],
      });
    }
    toast.info('正在代理转账并调用...');
  };

  const handlePermit = () => {
    if (!isConnected || !permitOwner || !permitSpender || !permitValue || !permitDeadline || !permitV || !permitR || !permitS) {
      toast.error('请填写完整的 Permit 信息并连接钱包');
      return;
    }
    if (!isAddress(permitOwner) || !isAddress(permitSpender)) {
      toast.error('请输入有效的地址');
      return;
    }
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MyTokenV4_ABI,
      functionName: 'permit',
      args: [
        permitOwner as `0x${string}`,
        permitSpender as `0x${string}`,
        parseEther(permitValue),
        BigInt(permitDeadline),
        parseInt(permitV),
        permitR as `0x${string}`,
        permitS as `0x${string}`
      ],
    });
    toast.info('正在执行 Permit...');
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
          <div className="text-sm">当前合约地址: {tokenAddress}</div>
          <div className="text-sm">当前链 ID: {chainId}</div>
          <div className="text-sm">默认地址: {defaultTokenAddresses[chainId] || '未配置'}</div>
        </div>

        {/* 合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="tokenAddress">新合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="tokenAddress"
              placeholder="输入合约地址 (0x...)"
              value={inputTokenAddress}
              onChange={(e) => setInputTokenAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetTokenAddress} size="sm">
              设置地址
            </Button>
          </div>
        </div>

        {/* 重置按钮 */}
        <Button onClick={handleResetToDefault} variant="outline" className="w-full">
          重置为默认地址
        </Button>
      </div>

      <div className="space-y-6">
          {/* 代币基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">代币名称</Label>
              <p className="text-lg font-semibold">{tokenName || '加载中...'}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">代币符号</Label>
              <p className="text-lg font-semibold">{tokenSymbol || '加载中...'}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">小数位数</Label>
              <p className="text-lg font-semibold">{tokenDecimals?.toString() || '加载中...'}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">总供应量</Label>
              <p className="text-lg font-semibold">{totalSupply ? formatEther(totalSupply) : '加载中...'}</p>
            </div>
          </div>

          {/* 用户余额 */}
          {isConnected && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium">您的余额</Label>
              <p className="text-2xl font-bold text-blue-600">{userBalance ? formatEther(userBalance) : '0'} {tokenSymbol}</p>
            </div>
          )}

          <Separator />

          {/* 基础转账功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">💸 基础转账</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferTo">接收地址</Label>
                <Input
                  id="transferTo"
                  placeholder="输入接收地址"
                  value={transferTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferAmount">转账金额</Label>
                <Input
                  id="transferAmount"
                  placeholder="输入转账金额"
                  value={transferAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferAmount(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleTransfer} 
              disabled={!isConnected || isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? '处理中...' : '转账'}
            </Button>
          </div>

          <Separator />

          {/* 授权功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">✅ 授权功能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approveSpender">授权地址</Label>
                <Input
                  id="approveSpender"
                  placeholder="输入要授权的地址"
                  value={approveSpender}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApproveSpender(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approveAmount">授权金额</Label>
                <Input
                  id="approveAmount"
                  placeholder="输入授权金额"
                  value={approveAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApproveAmount(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleApprove} 
              disabled={!isConnected || isPending || isConfirming}
              className="w-full"
            >
              授权
            </Button>
          </div>

          <Separator />

          {/* 代理转账功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔄 代理转账</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferFromFrom">发送方地址</Label>
                <Input
                  id="transferFromFrom"
                  placeholder="输入发送方地址"
                  value={transferFromFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferFromFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferFromTo">接收方地址</Label>
                <Input
                  id="transferFromTo"
                  placeholder="输入接收方地址"
                  value={transferFromTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferFromTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferFromAmount">转账金额</Label>
                <Input
                  id="transferFromAmount"
                  placeholder="输入转账金额"
                  value={transferFromAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferFromAmount(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleTransferFrom} 
              disabled={!isConnected || isPending || isConfirming}
              className="w-full"
            >
              代理转账
            </Button>
          </div>

          <Separator />

          {/* ERC1363 扩展功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🚀 ERC1363 扩展功能</h3>
            <div className="space-y-2">
              <Label htmlFor="transferData">调用数据 (可选)</Label>
              <Textarea
                id="transferData"
                placeholder="输入调用数据 (hex格式)"
                value={transferData}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransferData(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button 
                onClick={handleTransferAndCall} 
                disabled={!isConnected || isPending || isConfirming}
              >
                转账并调用
              </Button>
              <Button 
                onClick={handleApproveAndCall} 
                disabled={!isConnected || isPending || isConfirming}
              >
                授权并调用
              </Button>
              <Button 
                onClick={handleTransferFromAndCall} 
                disabled={!isConnected || isPending || isConfirming}
              >
                代理转账并调用
              </Button>
            </div>
          </div>

          <Separator />

          {/* 查询功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔍 查询功能</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="queryAddress">查询地址余额</Label>
                <Input
                  id="queryAddress"
                  placeholder="输入地址"
                  value={queryAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryAddress(e.target.value)}
                />
                {queryBalance !== undefined && (
                  <div className="p-2 bg-green-50 rounded text-sm">
                    <strong>余额:</strong> {formatEther(queryBalance)} {tokenSymbol}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nonceAddress">查询 Nonce</Label>
                <Input
                  id="nonceAddress"
                  placeholder="输入地址"
                  value={nonceAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNonceAddress(e.target.value)}
                />
                {nonces !== undefined && (
                  <div className="p-2 bg-green-50 rounded text-sm">
                    <strong>Nonce:</strong> {nonces.toString()}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerAddress">所有者地址</Label>
                <Input
                  id="ownerAddress"
                  placeholder="输入所有者地址"
                  value={ownerAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwnerAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spenderAddress">授权地址</Label>
                <Input
                  id="spenderAddress"
                  placeholder="输入授权地址"
                  value={spenderAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpenderAddress(e.target.value)}
                />
              </div>
            </div>
            {allowanceAmount !== undefined && ownerAddress && spenderAddress && (
              <div className="p-2 bg-green-50 rounded text-sm">
                <strong>授权额度:</strong> {formatEther(allowanceAmount)} {tokenSymbol}
              </div>
            )}

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

          <Separator />

          {/* ERC20Permit 功能 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📝 ERC20Permit 功能</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitOwner">所有者地址</Label>
                <Input
                  id="permitOwner"
                  placeholder="输入所有者地址"
                  value={permitOwner}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitSpender">授权地址</Label>
                <Input
                  id="permitSpender"
                  placeholder="输入授权地址"
                  value={permitSpender}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitSpender(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitValue">授权金额</Label>
                <Input
                  id="permitValue"
                  placeholder="输入授权金额"
                  value={permitValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitDeadline">截止时间 (时间戳)</Label>
                <Input
                  id="permitDeadline"
                  placeholder="输入截止时间"
                  value={permitDeadline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitV">V 值</Label>
                <Input
                  id="permitV"
                  placeholder="输入 V 值"
                  value={permitV}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitV(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitR">R 值</Label>
                <Input
                  id="permitR"
                  placeholder="输入 R 值"
                  value={permitR}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitR(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitS">S 值</Label>
                <Input
                  id="permitS"
                  placeholder="输入 S 值"
                  value={permitS}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermitS(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handlePermit} 
              disabled={!isConnected || isPending || isConfirming}
              className="w-full"
            >
              执行 Permit
            </Button>
          </div>

          <Separator />

          {/* 高级信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔧 高级信息</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Domain Separator</Label>
                <p className="text-sm font-mono break-all">{domainSeparator || '加载中...'}</p>
              </div>
              
              {eip712Domain && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">EIP712 Domain</Label>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {eip712Domain[1]}</p>
                    <p><strong>Version:</strong> {eip712Domain[2]}</p>
                    <p><strong>Chain ID:</strong> {eip712Domain[3].toString()}</p>
                    <p><strong>Verifying Contract:</strong> {eip712Domain[4]}</p>
                  </div>
                </div>
              )}
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
