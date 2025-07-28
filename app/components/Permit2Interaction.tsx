import {Button} from "@/app/components/ui/button";
import {Input} from "@/app/components/ui/input";
import {Label} from "@/app/components/ui/label";
import {useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId} from "wagmi";
import {parseEther, formatEther, isAddress, encodePacked, keccak256} from "viem";
import {toast} from "sonner";
import {useState, useEffect} from "react";
import {Permit2_ABI} from "@/app/abi/Permit2";
import {MyTokenV4_ABI} from "@/app/abi/MyTokenV4";
import { LOCAL_TOKEN_ADDRESS } from '@/app/config';

export default function Permit2Interaction() {
  const {address, isConnected} = useAccount();
  const {writeContract, data: hash} = useWriteContract();
  const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});
  const chainId = useChainId();
  
  // 默认合约地址配置
  const defaultPermit2Addresses: Record<number, string> = {
    1: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Mainnet
    42161: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Arbitrum
    11155111: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Sepolia
    31337: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Anvil (需要部署)
  };
  
  const defaultTokenAddresses: Record<number, string> = {
    1: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519", // Mainnet
    42161: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519", // Arbitrum
    11155111: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519", // Sepolia
    31337: LOCAL_TOKEN_ADDRESS, // Anvil
  };
  
  // 合约地址状态
  const [permit2Address, setPermit2Address] = useState<string>(defaultPermit2Addresses[chainId] || defaultPermit2Addresses[31337]);
  const [tokenAddress, setTokenAddress] = useState<string>(defaultTokenAddresses[chainId] || defaultTokenAddresses[31337]);
  const [inputPermit2Address, setInputPermit2Address] = useState<string>("");
  const [inputTokenAddress, setInputTokenAddress] = useState<string>("");
  
  // 链切换时更新默认地址
  useEffect(() => {
    const defaultPermit2 = defaultPermit2Addresses[chainId] || defaultPermit2Addresses[31337];
    const defaultToken = defaultTokenAddresses[chainId] || defaultTokenAddresses[31337];
    setPermit2Address(defaultPermit2);
    setTokenAddress(defaultToken);
  }, [chainId]);
  
  // 设置合约地址的处理函数
  const handleSetPermit2Address = () => {
    if (!inputPermit2Address) {
      toast.error("请输入 Permit2 合约地址");
      return;
    }
    if (!isAddress(inputPermit2Address)) {
      toast.error("无效的合约地址");
      return;
    }
    setPermit2Address(inputPermit2Address);
    setInputPermit2Address("");
    toast.success("Permit2 合约地址已更新");
  };
  
  const handleSetTokenAddress = () => {
    if (!inputTokenAddress) {
      toast.error("请输入代币合约地址");
      return;
    }
    if (!isAddress(inputTokenAddress)) {
      toast.error("无效的合约地址");
      return;
    }
    setTokenAddress(inputTokenAddress);
    setInputTokenAddress("");
    toast.success("代币合约地址已更新");
  };
  
  // 直接授权相关状态
  const [spenderAddress, setSpenderAddress] = useState<string>("");
  const [approveAmount, setApproveAmount] = useState<string>("");
  
  // 转账相关状态
  const [transferTo, setTransferTo] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferDeadline, setTransferDeadline] = useState<string>("");
  const [transferNonce, setTransferNonce] = useState<string>("");
  
  // Permit 相关状态
  const [permitOwner, setPermitOwner] = useState<string>("");
  const [permitSpender, setPermitSpender] = useState<string>("");
  const [permitAmount, setPermitAmount] = useState<string>("");
  const [permitExpiration, setPermitExpiration] = useState<string>("");
  const [permitNonce, setPermitNonce] = useState<string>("");
  const [permitSigDeadline, setPermitSigDeadline] = useState<string>("");
  const [permitSignature, setPermitSignature] = useState<string>("");
  
  // PermitBatch 相关状态
  const [batchPermits, setBatchPermits] = useState<Array<{token: string, amount: string, expiration: string, nonce: string}>>([{token: "", amount: "", expiration: "", nonce: ""}]);
  const [batchSpender, setBatchSpender] = useState<string>("");
  const [batchSigDeadline, setBatchSigDeadline] = useState<string>("");
  const [batchSignature, setBatchSignature] = useState<string>("");
  
  // PermitTransferFrom 相关状态
  const [permitTransferToken, setPermitTransferToken] = useState<string>("");
  const [permitTransferFrom, setPermitTransferFrom] = useState<string>("");
  const [permitTransferTo, setPermitTransferTo] = useState<string>("");
  const [permitTransferAmount, setPermitTransferAmount] = useState<string>("");
  const [permitTransferNonce, setPermitTransferNonce] = useState<string>("");
  const [permitTransferDeadline, setPermitTransferDeadline] = useState<string>("");
  const [permitTransferSignature, setPermitTransferSignature] = useState<string>("");
  
  // Nonce 管理状态
  const [invalidateNonce, setInvalidateNonce] = useState<string>("");
  
  // 查询相关状态
  const [queryOwner, setQueryOwner] = useState<string>("");
  const [querySpender, setQuerySpender] = useState<string>("");
  const [queryNonce, setQueryNonce] = useState<string>("");
  
  // 读取合约数据
  const { data: allowanceData } = useReadContract({
    address: permit2Address as `0x${string}`,
    abi: Permit2_ABI,
    functionName: "allowance",
    args: queryOwner && querySpender && tokenAddress ? [
      queryOwner as `0x${string}`,
      tokenAddress as `0x${string}`,
      querySpender as `0x${string}`
    ] : undefined,
    query: { enabled: !!queryOwner && !!querySpender && !!tokenAddress && isAddress(queryOwner) && isAddress(querySpender) && isAddress(tokenAddress) },
  });
  
  const { data: allowanceExpirationData } = useReadContract({
    address: permit2Address as `0x${string}`,
    abi: Permit2_ABI,
    functionName: "allowance",
    args: queryOwner && querySpender && tokenAddress ? [
      queryOwner as `0x${string}`,
      tokenAddress as `0x${string}`,
      querySpender as `0x${string}`
    ] : undefined,
    query: { enabled: !!queryOwner && !!querySpender && !!tokenAddress && isAddress(queryOwner) && isAddress(querySpender) && isAddress(tokenAddress) },
  });
  
  const { data: isNonceUsedData } = useReadContract({
    address: permit2Address as `0x${string}`,
    abi: Permit2_ABI,
    functionName: "nonceBitmap",
    args: queryOwner && queryNonce ? [
      queryOwner as `0x${string}`,
      BigInt(Math.floor(Number(queryNonce) / 256))
    ] : undefined,
    query: { enabled: !!queryOwner && !!queryNonce && isAddress(queryOwner) },
  });
  
  const { data: domainSeparatorData } = useReadContract({
    address: permit2Address as `0x${string}`,
    abi: Permit2_ABI,
    functionName: "DOMAIN_SEPARATOR",
    query: { enabled: !!permit2Address && isAddress(permit2Address) },
  });
  
  // 处理函数
  const handleApprove = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!spenderAddress || !approveAmount) return toast.error("请填写完整信息");
    if (!isAddress(spenderAddress)) return toast.error("无效的被授权地址");
    
    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MyTokenV4_ABI,
        functionName: "approve",
        args: [spenderAddress as `0x${string}`, parseEther(approveAmount)],
        chainId: chainId,
      });
      toast.success("授权交易已发起");
    } catch (error) {
      toast.error("授权失败");
    }
  };
  
  const handleTransferFrom = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!transferTo || !transferAmount || !transferDeadline || !transferNonce) {
      return toast.error("请填写完整信息");
    }
    if (!isAddress(transferTo)) return toast.error("无效的接收地址");
    
    try {
      const deadline = Math.floor(Date.now() / 1000) + Number(transferDeadline) * 60;
      
      writeContract({
        address: permit2Address as `0x${string}`,
        abi: Permit2_ABI,
        functionName: "transferFrom",
        args: [
          address as `0x${string}`,
          transferTo as `0x${string}`,
          parseEther(transferAmount),
          tokenAddress as `0x${string}`
        ],
        chainId: chainId,
      });
      toast.success("转账交易已发起");
    } catch (error) {
      toast.error("转账失败");
    }
  };
  
  const handleInvalidateNonce = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!invalidateNonce) return toast.error("请输入要作废的 Nonce");
    
    try {
      writeContract({
        address: permit2Address as `0x${string}`,
        abi: Permit2_ABI,
        functionName: "invalidateNonces",
        args: [BigInt(Math.floor(Number(invalidateNonce) / 256)), BigInt(1) << BigInt(Number(invalidateNonce) % 256)],
        chainId: chainId,
      });
      toast.success("Nonce 作废交易已发起");
    } catch (error) {
      toast.error("Nonce 作废失败");
    }
  };
  
  // Permit 处理函数
  const handlePermit = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!permitOwner || !permitSpender || !permitAmount || !permitExpiration || !permitNonce || !permitSigDeadline || !permitSignature) {
      return toast.error("请填写完整的 Permit 信息");
    }
    if (!isAddress(permitOwner) || !isAddress(permitSpender)) {
      return toast.error("无效的地址");
    }
    
    try {
      const permitSingle = {
        details: {
          token: tokenAddress as `0x${string}`,
          amount: parseEther(permitAmount),
          expiration: BigInt(Math.floor(Date.now() / 1000) + Number(permitExpiration) * 60),
          nonce: BigInt(permitNonce)
        },
        spender: permitSpender as `0x${string}`,
        sigDeadline: BigInt(Math.floor(Date.now() / 1000) + Number(permitSigDeadline) * 60)
      };
      
      writeContract({
        address: permit2Address as `0x${string}`,
        abi: Permit2_ABI,
        functionName: "permit",
        args: [permitOwner as `0x${string}`, permitSingle, permitSignature as `0x${string}`],
        chainId: chainId,
      });
      toast.success("Permit 交易已发起");
    } catch (error) {
      toast.error("Permit 失败");
    }
  };
  
  // PermitBatch 处理函数
  const handlePermitBatch = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!batchSpender || !batchSigDeadline || !batchSignature || batchPermits.length === 0) {
      return toast.error("请填写完整的 PermitBatch 信息");
    }
    if (!isAddress(batchSpender)) {
      return toast.error("无效的被授权地址");
    }
    
    // 验证所有批量授权项
    for (const permit of batchPermits) {
      if (!permit.token || !permit.amount || !permit.expiration || !permit.nonce) {
        return toast.error("请填写完整的批量授权信息");
      }
      if (!isAddress(permit.token)) {
        return toast.error("无效的代币地址");
      }
    }
    
    try {
      const permitData = {
        details: batchPermits.map(permit => ({
          token: permit.token as `0x${string}`,
          amount: parseEther(permit.amount),
          expiration: BigInt(Math.floor(Date.now() / 1000) + Number(permit.expiration) * 60),
          nonce: BigInt(permit.nonce)
        })),
        spender: batchSpender as `0x${string}`,
        sigDeadline: BigInt(Math.floor(Date.now() / 1000) + Number(batchSigDeadline) * 60)
      };
      
      writeContract({
        address: permit2Address as `0x${string}`,
        abi: Permit2_ABI,
        functionName: "permitBatch",
        args: [address as `0x${string}`, permitData, batchSignature as `0x${string}`],
        chainId: chainId,
      });
      toast.success("PermitBatch 交易已发起");
    } catch (error) {
      toast.error("PermitBatch 失败");
    }
  };
  
  // PermitTransferFrom 处理函数
  const handlePermitTransferFrom = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!permitTransferToken || !permitTransferFrom || !permitTransferTo || !permitTransferAmount || !permitTransferNonce || !permitTransferDeadline || !permitTransferSignature) {
      return toast.error("请填写完整的 PermitTransferFrom 信息");
    }
    if (!isAddress(permitTransferToken) || !isAddress(permitTransferFrom) || !isAddress(permitTransferTo)) {
      return toast.error("无效的地址");
    }
    
    try {
      const signatureTransfer = {
        token: permitTransferToken as `0x${string}`,
        from: permitTransferFrom as `0x${string}`,
        transfer: {
          to: permitTransferTo as `0x${string}`,
          requestedAmount: parseEther(permitTransferAmount)
        },
        nonce: BigInt(permitTransferNonce),
        deadline: BigInt(Math.floor(Date.now() / 1000) + Number(permitTransferDeadline) * 60)
      };
      
      writeContract({
        address: permit2Address as `0x${string}`,
        abi: Permit2_ABI,
        functionName: "permitTransferFrom",
        args: [signatureTransfer, permitTransferSignature as `0x${string}`],
        chainId: chainId,
      });
      toast.success("PermitTransferFrom 交易已发起");
    } catch (error) {
      toast.error("PermitTransferFrom 失败");
    }
  };
  
  const setCurrentUserAddress = () => {
    if (address) {
      setQueryOwner(address);
    }
  };
  
  const generateRandomNonce = () => {
    const randomNonce = Math.floor(Math.random() * 1000000);
    setQueryNonce(randomNonce.toString());
  };
  
  // 批量授权管理函数
  const addBatchPermit = () => {
    setBatchPermits([...batchPermits, {token: "", amount: "", expiration: "", nonce: ""}]);
  };
  
  const removeBatchPermit = (index: number) => {
    if (batchPermits.length > 1) {
      setBatchPermits(batchPermits.filter((_, i) => i !== index));
    }
  };
  
  const updateBatchPermit = (index: number, field: string, value: string) => {
    const updated = [...batchPermits];
    updated[index] = {...updated[index], [field]: value};
    setBatchPermits(updated);
  };
  
  // 设置当前用户地址的辅助函数
  const setCurrentUserAsPermitOwner = () => {
    if (address) {
      setPermitOwner(address);
    }
  };
  
  const setCurrentUserAsTransferFrom = () => {
    if (address) {
      setPermitTransferFrom(address);
    }
  };
  
  const setCurrentTokenAddress = () => {
    setPermitTransferToken(tokenAddress);
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
         {isConfirming && <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">⏳ 交易确认中</div>}
         {isConfirmed && <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✅ 交易已确认</div>}
      </div>

      {/* 合约地址设置 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold">合约地址设置</h3>
        
        {/* 当前地址显示 */}
        <div className="space-y-2">
          <div className="text-sm">当前 Permit2 合约地址: {permit2Address}</div>
          <div className="text-sm">当前代币合约地址: {tokenAddress}</div>
          <div className="text-sm">当前链 ID: {chainId}</div>
        </div>

        {/* Permit2 合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="permit2Address">新 Permit2 合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="permit2Address"
              placeholder="输入 Permit2 合约地址 (0x...)"
              value={inputPermit2Address}
              onChange={(e) => setInputPermit2Address(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetPermit2Address} size="sm">
              设置地址
            </Button>
          </div>
        </div>

        {/* 代币合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="tokenAddress">新代币合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="tokenAddress"
              placeholder="输入代币合约地址 (0x...)"
              value={inputTokenAddress}
              onChange={(e) => setInputTokenAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetTokenAddress} size="sm">
              设置地址
            </Button>
          </div>
        </div>
      </div>

      {/* 直接授权 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">直接授权 (approve)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>被授权地址</Label>
            <Input
              placeholder="0x..."
              value={spenderAddress}
              onChange={(e) => setSpenderAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>授权数量 (ETH)</Label>
            <Input
              type="number"
              placeholder="1.0"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleApprove} className="w-full">
              授权
            </Button>
          </div>
        </div>
      </div>

      {/* Permit 功能 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">Permit 授权</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>所有者地址</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={permitOwner}
                onChange={(e) => setPermitOwner(e.target.value)}
                className="flex-1"
              />
              <Button onClick={setCurrentUserAsPermitOwner} variant="outline" size="sm">
                当前用户
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>被授权地址</Label>
            <Input
              placeholder="0x..."
              value={permitSpender}
              onChange={(e) => setPermitSpender(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>授权数量 (ETH)</Label>
            <Input
              type="number"
              placeholder="1.0"
              value={permitAmount}
              onChange={(e) => setPermitAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>过期时间 (分钟)</Label>
            <Input
              type="number"
              placeholder="60"
              value={permitExpiration}
              onChange={(e) => setPermitExpiration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nonce</Label>
            <Input
              type="number"
              placeholder="随机数"
              value={permitNonce}
              onChange={(e) => setPermitNonce(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>签名截止时间 (分钟)</Label>
            <Input
              type="number"
              placeholder="60"
              value={permitSigDeadline}
              onChange={(e) => setPermitSigDeadline(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>签名数据</Label>
          <Input
            placeholder="0x..."
            value={permitSignature}
            onChange={(e) => setPermitSignature(e.target.value)}
          />
        </div>
        <Button onClick={handlePermit} className="w-full">
          执行 Permit
        </Button>
      </div>

      {/* PermitBatch 功能 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">PermitBatch 批量授权</h4>
        
        {/* 批量授权项 */}
        <div className="space-y-4">
          {batchPermits.map((permit, index) => (
            <div key={index} className="p-3 border rounded bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">授权项 {index + 1}</span>
                {batchPermits.length > 1 && (
                  <Button onClick={() => removeBatchPermit(index)} variant="outline" size="sm">
                    删除
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">代币地址</Label>
                  <Input
                     placeholder="0x..."
                     value={permit.token}
                     onChange={(e) => updateBatchPermit(index, 'token', e.target.value)}
                   />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">数量 (ETH)</Label>
                  <Input
                     type="number"
                     placeholder="1.0"
                     value={permit.amount}
                     onChange={(e) => updateBatchPermit(index, 'amount', e.target.value)}
                   />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">过期时间 (分钟)</Label>
                  <Input
                     type="number"
                     placeholder="60"
                     value={permit.expiration}
                     onChange={(e) => updateBatchPermit(index, 'expiration', e.target.value)}
                   />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nonce</Label>
                  <Input
                     type="number"
                     placeholder="随机数"
                     value={permit.nonce}
                     onChange={(e) => updateBatchPermit(index, 'nonce', e.target.value)}
                   />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button onClick={addBatchPermit} variant="outline" className="w-full">
          添加授权项
        </Button>
        
        {/* 批量授权公共参数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>被授权地址</Label>
            <Input
              placeholder="0x..."
              value={batchSpender}
              onChange={(e) => setBatchSpender(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>签名截止时间 (分钟)</Label>
            <Input
              type="number"
              placeholder="60"
              value={batchSigDeadline}
              onChange={(e) => setBatchSigDeadline(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>批量签名数据</Label>
          <Input
            placeholder="0x..."
            value={batchSignature}
            onChange={(e) => setBatchSignature(e.target.value)}
          />
        </div>
        
        <Button onClick={handlePermitBatch} className="w-full">
          执行 PermitBatch
        </Button>
      </div>

      {/* PermitTransferFrom 功能 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">PermitTransferFrom 签名转账</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>代币地址</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={permitTransferToken}
                onChange={(e) => setPermitTransferToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={setCurrentTokenAddress} variant="outline" size="sm">
                当前代币
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>发送方地址</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={permitTransferFrom}
                onChange={(e) => setPermitTransferFrom(e.target.value)}
                className="flex-1"
              />
              <Button onClick={setCurrentUserAsTransferFrom} variant="outline" size="sm">
                当前用户
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>接收方地址</Label>
            <Input
              placeholder="0x..."
              value={permitTransferTo}
              onChange={(e) => setPermitTransferTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>转账数量 (ETH)</Label>
            <Input
              type="number"
              placeholder="1.0"
              value={permitTransferAmount}
              onChange={(e) => setPermitTransferAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nonce</Label>
            <Input
              type="number"
              placeholder="随机数"
              value={permitTransferNonce}
              onChange={(e) => setPermitTransferNonce(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>截止时间 (分钟)</Label>
            <Input
              type="number"
              placeholder="60"
              value={permitTransferDeadline}
              onChange={(e) => setPermitTransferDeadline(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>签名数据</Label>
          <Input
            placeholder="0x..."
            value={permitTransferSignature}
            onChange={(e) => setPermitTransferSignature(e.target.value)}
          />
        </div>
        <Button onClick={handlePermitTransferFrom} className="w-full">
          执行 PermitTransferFrom
        </Button>
      </div>

      {/* 转账功能 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">转账 (transferFrom)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>接收地址</Label>
            <Input
              placeholder="0x..."
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>转账数量 (ETH)</Label>
            <Input
              type="number"
              placeholder="1.0"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>截止时间 (分钟)</Label>
            <Input
              type="number"
              placeholder="60"
              value={transferDeadline}
              onChange={(e) => setTransferDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nonce</Label>
            <Input
              type="number"
              placeholder="随机数"
              value={transferNonce}
              onChange={(e) => setTransferNonce(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleTransferFrom} className="w-full">
          转账
        </Button>
      </div>

      {/* Nonce 管理 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">Nonce 管理</h4>
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="要作废的 Nonce"
            value={invalidateNonce}
            onChange={(e) => setInvalidateNonce(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleInvalidateNonce}>
            作废 Nonce
          </Button>
        </div>
      </div>

      {/* 查询功能 */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-semibold">查询功能</h4>
        
        {/* 查询输入 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>查询所有者地址</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={queryOwner}
                onChange={(e) => setQueryOwner(e.target.value)}
              />
              <Button onClick={setCurrentUserAddress} variant="outline" size="sm">
                当前用户
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>查询被授权地址</Label>
            <Input
              placeholder="0x..."
              value={querySpender}
              onChange={(e) => setQuerySpender(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>查询Nonce</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="nonce"
                value={queryNonce}
                onChange={(e) => setQueryNonce(e.target.value)}
              />
              <Button onClick={generateRandomNonce} variant="outline" size="sm">
                随机
              </Button>
            </div>
          </div>
        </div>
        
        {/* 查询结果 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p><strong>授权额度:</strong> {allowanceData ? formatEther(allowanceData as bigint) : "--"} ETH</p>
            <p><strong>授权过期时间:</strong> {allowanceExpirationData ? new Date(Number(allowanceExpirationData) * 1000).toLocaleString() : "--"}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Nonce已使用:</strong> {isNonceUsedData !== undefined ? (isNonceUsedData ? "是" : "否") : "--"}</p>
            <p><strong>域分隔符:</strong> {domainSeparatorData ? (domainSeparatorData as string).slice(0, 10) + "..." : "--"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}