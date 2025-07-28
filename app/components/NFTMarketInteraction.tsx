import {Button} from "@/app/components/ui/button";
import {Input} from "@/app/components/ui/input";
import {Label} from "@/app/components/ui/label";
import {useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId} from "wagmi";
import {parseEther, formatEther, isAddress} from "viem";
import {toast} from "sonner";
import {useState, useEffect} from "react";
import {MyNFTV4_ABI} from "@/app/abi/MyNFTV4";
import {MyNFTMarketV4_ABI} from "@/app/abi/MyNFTMarketV4";
import { LOCAL_NFT_ADDRESS, LOCAL_NFT_MARKET_ADDRESS } from '@/app/config';

export default function NFTMarketInteraction() {
  const {address, isConnected} = useAccount();
  const {writeContract, data: hash} = useWriteContract();
  const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});
  const chainId = useChainId();
  
  // 默认合约地址配置
  const defaultNftAddresses: Record<number, string> = {
    11155111: "0x1234567890123456789012345678901234567890", // Sepolia
    80001: "0x2345678901234567890123456789012345678901",    // Polygon Mumbai
    31337: LOCAL_NFT_ADDRESS,    // Local
  };
  
  const defaultMarketAddresses: Record<number, string> = {
    11155111: "0x3456789012345678901234567890123456789012", // Sepolia
    80001: "0x4567890123456789012345678901234567890123",    // Polygon Mumbai
    31337: LOCAL_NFT_MARKET_ADDRESS,    // Local
  };
  
  // 合约地址状态管理
  const [nftAddress, setNftAddress] = useState<string>(defaultNftAddresses[chainId] || defaultNftAddresses[31337]);
  const [marketAddress, setMarketAddress] = useState<string>(defaultMarketAddresses[chainId] || defaultMarketAddresses[31337]);
  const [inputNftAddress, setInputNftAddress] = useState<string>("");
  const [inputMarketAddress, setInputMarketAddress] = useState<string>("");
  
  // 链切换时更新默认地址
  useEffect(() => {
    const defaultNft = defaultNftAddresses[chainId] || defaultNftAddresses[31337];
    const defaultMarket = defaultMarketAddresses[chainId] || defaultMarketAddresses[31337];
    setNftAddress(defaultNft);
    setMarketAddress(defaultMarket);
  }, [chainId]);
  
  // 设置合约地址的处理函数
  const handleSetNftAddress = () => {
    if (!inputNftAddress) {
      toast.error("请输入 NFT 合约地址");
      return;
    }
    if (!isAddress(inputNftAddress)) {
      toast.error("无效的 NFT 合约地址");
      return;
    }
    setNftAddress(inputNftAddress);
    toast.success("NFT 合约地址已更新");
  };
  
  const handleSetMarketAddress = () => {
    if (!inputMarketAddress) {
      toast.error("请输入市场合约地址");
      return;
    }
    if (!isAddress(inputMarketAddress)) {
      toast.error("无效的市场合约地址");
      return;
    }
    setMarketAddress(inputMarketAddress);
    toast.success("市场合约地址已更新");
  };
  
  const handleResetToDefault = () => {
    const defaultNft = defaultNftAddresses[chainId] || defaultNftAddresses[31337];
    const defaultMarket = defaultMarketAddresses[chainId] || defaultMarketAddresses[31337];
    setNftAddress(defaultNft);
    setMarketAddress(defaultMarket);
    setInputNftAddress("");
    setInputMarketAddress("");
    toast.success("已重置为默认地址");
  };
  
  // 状态管理
  const [queryAddress, setQueryAddress] = useState("");
  const [queryTokenId, setQueryTokenId] = useState("");
  const [queryListingId, setQueryListingId] = useState("");
  const [queryNftContract, setQueryNftContract] = useState("");
  const [querySignatureHash, setQuerySignatureHash] = useState("");
  
  // 读取合约状态
  const {data: platformFeePercentage} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "platformFeePercentage",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });

  const {data: feeReceiver} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "feeReceiver",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });

  const {data: signer} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "signer",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });
  
  const {data: owner} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "owner",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });
  
  const {data: userNonces} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "nonces",
    args: queryAddress && isAddress(queryAddress) ? [queryAddress as `0x${string}`] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!queryAddress && isAddress(queryAddress) },
  });
  
  const {data: listingInfo} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "listings",
    args: queryListingId ? [BigInt(queryListingId)] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!queryListingId },
  });
  
  const {data: nftListingId} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "nftToListingId",
    args: queryNftContract && queryTokenId && isAddress(queryNftContract) ? [queryNftContract as `0x${string}`, BigInt(queryTokenId)] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!queryNftContract && isAddress(queryNftContract) && !!queryTokenId },
  });
  
  const {data: usedSignature} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "usedSignatures",
    args: querySignatureHash ? [querySignatureHash as `0x${string}`] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!querySignatureHash },
  });
  
  const {data: latestListings} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "getLatestListings",
    args: [BigInt(10)], // 获取最新10个listing
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });
  
  const {data: userListings} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "getUserListings",
    args: queryAddress && isAddress(queryAddress) ? [queryAddress as `0x${string}`] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!queryAddress && isAddress(queryAddress) },
  });
  
  const {data: nftListing} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "getNFTListing",
    args: queryNftContract && queryTokenId && isAddress(queryNftContract) ? [queryNftContract as `0x${string}`, BigInt(queryTokenId)] : undefined,
    query: { enabled: !!marketAddress && isAddress(marketAddress) && !!queryNftContract && isAddress(queryNftContract) && !!queryTokenId },
  });
  
  const {data: eip712Domain} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "eip712Domain",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });
  
  const {data: permitTypehash} = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MyNFTMarketV4_ABI,
    functionName: "PERMIT_TYPEHASH",
    query: { enabled: !!marketAddress && isAddress(marketAddress) },
  });
  
  // NFT 铸造
  const handleMint = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    try {
      writeContract({address: nftAddress as `0x${string}`, abi: MyNFTV4_ABI, functionName: "mint", chainId: 31337});
      toast.success("NFT 铸造已发起");
    } catch (error) {
      toast.error("NFT 铸造失败");
    }
  };
  
  // ERC721 上架
  const handleCreate721Listing = async (tokenId: string, price: string, requiresWhitelist: boolean) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!tokenId || !price) return toast.error("请填写完整信息");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "create721Listing",
        args: [nftAddress as `0x${string}`, BigInt(tokenId), parseEther(price), requiresWhitelist],
        chainId: 31337,
      });
      toast.success("ERC721 上架已发起");
    } catch (error) {
      toast.error("ERC721 上架失败");
    }
  };
  
  // ERC1155 上架
  const handleCreate1155Listing = async (nftContract: string, tokenId: string, amount: string, price: string, requiresWhitelist: boolean) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!nftContract || !tokenId || !amount || !price) return toast.error("请填写完整信息");
    if (!isAddress(nftContract)) return toast.error("无效的合约地址");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "create1155Listing",
        args: [nftContract as `0x${string}`, BigInt(tokenId), BigInt(amount), parseEther(price), requiresWhitelist],
        chainId: 31337,
      });
      toast.success("ERC1155 上架已发起");
    } catch (error) {
      toast.error("ERC1155 上架失败");
    }
  };
  
  // 取消上架
  const handleCancelListing = async (listingId: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!listingId) return toast.error("请输入 Listing ID");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "cancelListing",
        args: [BigInt(listingId)],
        chainId: 31337,
      });
      toast.success("取消上架已发起");
    } catch (error) {
      toast.error("取消上架失败");
    }
  };
  
  // 购买 NFT
  const handleBuyNFT = async (listingId: string, amount: string, value: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!listingId || !amount || !value) return toast.error("请填写完整信息");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "buyNFT",
        args: [BigInt(listingId), BigInt(amount)],
        value: parseEther(value),
        chainId: 31337,
      });
      toast.success("购买 NFT 已发起");
    } catch (error) {
      toast.error("购买 NFT 失败");
    }
  };
  
  // 白名单购买
  const handlePermitBuy = async (listingId: string, amount: string, deadline: string, v: string, r: string, s: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!listingId || !amount || !deadline || !v || !r || !s) return toast.error("请填写完整信息");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "permitBuy",
        args: [BigInt(listingId), BigInt(amount), BigInt(deadline), parseInt(v), r as `0x${string}`, s as `0x${string}`],
        chainId: 31337,
      });
      toast.success("白名单购买已发起");
    } catch (error) {
      toast.error("白名单购买失败");
    }
  };
  
  // 设置签名者
  const handleSetSigner = async (signerAddress: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!signerAddress) return toast.error("请输入签名者地址");
    if (!isAddress(signerAddress)) return toast.error("无效的地址");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "setSigner",
        args: [signerAddress as `0x${string}`],
        chainId: 31337,
      });
      toast.success("设置签名者已发起");
    } catch (error) {
      toast.error("设置签名者失败");
    }
  };
  
  // 设置平台手续费
  const handleSetPlatformFeePercentage = async (feePercentage: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!feePercentage) return toast.error("请输入手续费比例");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "setPlatformFeePercentage",
        args: [BigInt(feePercentage)],
        chainId: 31337,
      });
      toast.success("设置平台手续费已发起");
    } catch (error) {
      toast.error("设置平台手续费失败");
    }
  };
  
  // 设置手续费接收地址
  const handleSetFeeReceiver = async (receiverAddress: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!receiverAddress) return toast.error("请输入接收地址");
    if (!isAddress(receiverAddress)) return toast.error("无效的地址");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "setFeeReceiver",
        args: [receiverAddress as `0x${string}`],
        chainId: 31337,
      });
      toast.success("设置手续费接收地址已发起");
    } catch (error) {
      toast.error("设置手续费接收地址失败");
    }
  };
  
  // 转移所有权
  const handleTransferOwnership = async (newOwner: string) => {
    if (!isConnected) return toast.error("请连接钱包");
    if (!newOwner) return toast.error("请输入新所有者地址");
    if (!isAddress(newOwner)) return toast.error("无效的地址");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "transferOwnership",
        args: [newOwner as `0x${string}`],
        chainId: 31337,
      });
      toast.success("转移所有权已发起");
    } catch (error) {
      toast.error("转移所有权失败");
    }
  };
  
  // 放弃所有权
  const handleRenounceOwnership = async () => {
    if (!isConnected) return toast.error("请连接钱包");
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: MyNFTMarketV4_ABI,
        functionName: "renounceOwnership",
        chainId: 31337,
      });
      toast.success("放弃所有权已发起");
    } catch (error) {
      toast.error("放弃所有权失败");
    }
  };
  
  // 测试哈希函数 (只读函数，不需要交易)
  const handleHashTypedDataV4 = async (structHash: string) => {
    if (!structHash) return toast.error("请输入结构哈希");
    toast.info("hashTypedDataV4 是只读函数，请使用查询功能");
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
          <div className="text-sm">当前市场合约地址: {marketAddress}</div>
          <div className="text-sm">当前 NFT 合约地址: {nftAddress}</div>
          <div className="text-sm">当前链 ID: {chainId}</div>
          <div className="text-sm">默认市场地址: {defaultMarketAddresses[chainId] || '未配置'}</div>
          <div className="text-sm">默认 NFT 地址: {defaultNftAddresses[chainId] || '未配置'}</div>
        </div>

        {/* 市场合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="marketAddress">新市场合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="marketAddress"
              placeholder="输入市场合约地址 (0x...)"
              value={inputMarketAddress}
              onChange={(e) => setInputMarketAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetMarketAddress} size="sm">
              设置地址
            </Button>
          </div>
        </div>

        {/* NFT 合约地址输入 */}
        <div className="space-y-2">
          <Label htmlFor="nftAddress">新 NFT 合约地址</Label>
          <div className="flex space-x-2">
            <Input
              id="nftAddress"
              placeholder="输入 NFT 合约地址 (0x...)"
              value={inputNftAddress}
              onChange={(e) => setInputNftAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetNftAddress} size="sm">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">合约信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-sm font-medium">市场合约地址</label>
            <div className="font-mono text-xs break-all">{marketAddress}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">NFT 合约地址</label>
            <div className="font-mono text-xs break-all">{nftAddress}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">平台手续费比例(/10000)</label>
            <div>{platformFeePercentage ? platformFeePercentage.toString() : "0"}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">手续费接收地址</label>
            <div className="font-mono text-xs break-all">{feeReceiver || "加载中..."}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">签名者地址</label>
            <div className="font-mono text-xs break-all">{signer || "加载中..."}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">合约所有者</label>
            <div className="font-mono text-xs break-all">{owner || "加载中..."}</div>
          </div>
        </div>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* NFT 铸造 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">NFT 铸造</h3>
        <Button onClick={handleMint} className="w-full">
          铸造 NFT
        </Button>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* ERC721 上架 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">ERC721 上架</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="erc721TokenId" className="block text-sm font-medium">Token ID</label>
            <Input id="erc721TokenId" placeholder="输入 Token ID" />
          </div>
          <div>
            <label htmlFor="erc721Price" className="block text-sm font-medium">价格 (ETH)</label>
            <Input id="erc721Price" placeholder="输入价格" />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                const tokenId = (document.getElementById("erc721TokenId") as HTMLInputElement).value;
                const price = (document.getElementById("erc721Price") as HTMLInputElement).value;
                const requiresWhitelist = (document.getElementById("erc721Whitelist") as HTMLInputElement).checked;
                handleCreate721Listing(tokenId, price, requiresWhitelist);
              }}
              className="w-full"
            >
              上架 ERC721
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="erc721Whitelist" />
          <label htmlFor="erc721Whitelist" className="text-sm font-medium">需要白名单</label>
        </div>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* ERC1155 上架 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">ERC1155 上架</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="erc1155Contract" className="block text-sm font-medium">NFT 合约地址</label>
            <Input id="erc1155Contract" placeholder="输入合约地址" />
          </div>
          <div>
            <label htmlFor="erc1155TokenId" className="block text-sm font-medium">Token ID</label>
            <Input id="erc1155TokenId" placeholder="输入 Token ID" />
          </div>
          <div>
            <label htmlFor="erc1155Amount" className="block text-sm font-medium">数量</label>
            <Input id="erc1155Amount" placeholder="输入数量" />
          </div>
          <div>
            <label htmlFor="erc1155Price" className="block text-sm font-medium">价格 (ETH)</label>
            <Input id="erc1155Price" placeholder="输入价格" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="erc1155Whitelist" />
          <label htmlFor="erc1155Whitelist" className="text-sm font-medium">需要白名单</label>
        </div>
        <Button
          onClick={() => {
            const nftContract = (document.getElementById("erc1155Contract") as HTMLInputElement).value;
            const tokenId = (document.getElementById("erc1155TokenId") as HTMLInputElement).value;
            const amount = (document.getElementById("erc1155Amount") as HTMLInputElement).value;
            const price = (document.getElementById("erc1155Price") as HTMLInputElement).value;
            const requiresWhitelist = (document.getElementById("erc1155Whitelist") as HTMLInputElement).checked;
            handleCreate1155Listing(nftContract, tokenId, amount, price, requiresWhitelist);
          }}
          className="w-full"
        >
          上架 ERC1155
        </Button>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 取消上架 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">取消上架</h3>
        <div className="flex gap-4">
          <Input id="cancelListingId" placeholder="输入 Listing ID" className="flex-1" />
          <Button
            onClick={() => {
              const listingId = (document.getElementById("cancelListingId") as HTMLInputElement).value;
              handleCancelListing(listingId);
            }}
          >
            取消上架
          </Button>
        </div>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 购买 NFT */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">购买 NFT</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="buyListingId" className="block text-sm font-medium">Listing ID</label>
            <Input id="buyListingId" placeholder="输入 Listing ID" />
          </div>
          <div>
            <label htmlFor="buyAmount" className="block text-sm font-medium">购买数量</label>
            <Input id="buyAmount" placeholder="输入数量" />
          </div>
          <div>
            <label htmlFor="buyValue" className="block text-sm font-medium">支付金额 (ETH)</label>
            <Input id="buyValue" placeholder="输入支付金额" />
          </div>
        </div>
        <Button
          onClick={() => {
            const listingId = (document.getElementById("buyListingId") as HTMLInputElement).value;
            const amount = (document.getElementById("buyAmount") as HTMLInputElement).value;
            const value = (document.getElementById("buyValue") as HTMLInputElement).value;
            handleBuyNFT(listingId, amount, value);
          }}
          className="w-full"
        >
          购买 NFT
        </Button>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 白名单购买 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">白名单购买</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="permitListingId" className="block text-sm font-medium">Listing ID</label>
            <Input id="permitListingId" placeholder="输入 Listing ID" />
          </div>
          <div>
            <label htmlFor="permitAmount" className="block text-sm font-medium">购买数量</label>
            <Input id="permitAmount" placeholder="输入数量" />
          </div>
          <div>
            <label htmlFor="permitDeadline" className="block text-sm font-medium">截止时间</label>
            <Input id="permitDeadline" placeholder="输入时间戳" />
          </div>
          <div>
            <label htmlFor="permitV" className="block text-sm font-medium">签名 V</label>
            <Input id="permitV" placeholder="输入 V 值" />
          </div>
          <div>
            <label htmlFor="permitR" className="block text-sm font-medium">签名 R</label>
            <Input id="permitR" placeholder="输入 R 值" />
          </div>
          <div>
            <label htmlFor="permitS" className="block text-sm font-medium">签名 S</label>
            <Input id="permitS" placeholder="输入 S 值" />
          </div>
        </div>
        <Button
          onClick={() => {
            const listingId = (document.getElementById("permitListingId") as HTMLInputElement).value;
            const amount = (document.getElementById("permitAmount") as HTMLInputElement).value;
            const deadline = (document.getElementById("permitDeadline") as HTMLInputElement).value;
            const v = (document.getElementById("permitV") as HTMLInputElement).value;
            const r = (document.getElementById("permitR") as HTMLInputElement).value;
            const s = (document.getElementById("permitS") as HTMLInputElement).value;
            handlePermitBuy(listingId, amount, deadline, v, r, s);
          }}
          className="w-full"
        >
          白名单购买
        </Button>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 管理功能 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">管理功能</h3>
        
        {/* 设置签名者 */}
        <div className="space-y-2">
          <label htmlFor="newSigner" className="block text-sm font-medium">设置签名者</label>
          <div className="flex gap-4">
            <Input id="newSigner" placeholder="输入签名者地址" className="flex-1" />
            <Button
              onClick={() => {
                const signerAddress = (document.getElementById("newSigner") as HTMLInputElement).value;
                handleSetSigner(signerAddress);
              }}
            >
              设置签名者
            </Button>
          </div>
        </div>
        
        {/* 设置平台手续费 */}
        <div className="space-y-2">
          <label htmlFor="newFeePercentage" className="block text-sm font-medium">设置平台手续费比例</label>
          <div className="flex gap-4">
            <Input id="newFeePercentage" placeholder="输入手续费比例" className="flex-1" />
            <Button
              onClick={() => {
                const feePercentage = (document.getElementById("newFeePercentage") as HTMLInputElement).value;
                handleSetPlatformFeePercentage(feePercentage);
              }}
            >
              设置手续费
            </Button>
          </div>
        </div>
        
        {/* 设置手续费接收地址 */}
        <div className="space-y-2">
          <label htmlFor="newFeeReceiver" className="block text-sm font-medium">设置手续费接收地址</label>
          <div className="flex gap-4">
            <Input id="newFeeReceiver" placeholder="输入接收地址" className="flex-1" />
            <Button
              onClick={() => {
                const receiverAddress = (document.getElementById("newFeeReceiver") as HTMLInputElement).value;
                handleSetFeeReceiver(receiverAddress);
              }}
            >
              设置接收地址
            </Button>
          </div>
        </div>
        
        {/* 转移所有权 */}
        <div className="space-y-2">
          <label htmlFor="newOwner" className="block text-sm font-medium">转移所有权</label>
          <div className="flex gap-4">
            <Input id="newOwner" placeholder="输入新所有者地址" className="flex-1" />
            <Button
              onClick={() => {
                const newOwner = (document.getElementById("newOwner") as HTMLInputElement).value;
                handleTransferOwnership(newOwner);
              }}
            >
              转移所有权
            </Button>
          </div>
        </div>
        
        {/* 放弃所有权 */}
        <Button onClick={handleRenounceOwnership} className="w-full bg-red-600 hover:bg-red-700">
          放弃所有权
        </Button>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 查询功能 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">查询功能</h3>
        
        {/* 查询地址输入 */}
        <div className="space-y-2">
          <label htmlFor="queryAddressInput" className="block text-sm font-medium">查询地址</label>
          <Input
            id="queryAddressInput"
            placeholder="输入要查询的地址"
            value={queryAddress}
            onChange={(e) => setQueryAddress(e.target.value)}
          />
        </div>
        
        {/* 用户 Nonces */}
        {queryAddress && isAddress(queryAddress) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">用户 Nonces</label>
            <div className="p-2 bg-gray-100 rounded">
              {userNonces ? userNonces.toString() : "加载中..."}
            </div>
          </div>
        )}
        
        {/* 用户 Listings */}
        {queryAddress && isAddress(queryAddress) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">用户 Listings</label>
            <div className="p-2 bg-gray-100 rounded max-h-40 overflow-y-auto">
              {userListings ? (
                <pre className="text-xs">{JSON.stringify(userListings, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
              ) : (
                "加载中..."
              )}
            </div>
          </div>
        )}
        
        {/* Listing 查询 */}
        <div className="space-y-2">
          <label htmlFor="queryListingIdInput" className="block text-sm font-medium">查询 Listing ID</label>
          <Input
            id="queryListingIdInput"
            placeholder="输入 Listing ID"
            value={queryListingId}
            onChange={(e) => setQueryListingId(e.target.value)}
          />
        </div>
        
        {queryListingId && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Listing 信息</label>
            <div className="p-2 bg-gray-100 rounded max-h-40 overflow-y-auto">
              {listingInfo ? (
                <pre className="text-xs">{JSON.stringify(listingInfo, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
              ) : (
                "加载中..."
              )}
            </div>
          </div>
        )}
        
        {/* NFT Listing 查询 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="queryNftContractInput" className="block text-sm font-medium">NFT 合约地址</label>
            <Input
              id="queryNftContractInput"
              placeholder="输入 NFT 合约地址"
              value={queryNftContract}
              onChange={(e) => setQueryNftContract(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="queryTokenIdInput" className="block text-sm font-medium">Token ID</label>
            <Input
              id="queryTokenIdInput"
              placeholder="输入 Token ID"
              value={queryTokenId}
              onChange={(e) => setQueryTokenId(e.target.value)}
            />
          </div>
        </div>
        
        {queryNftContract && queryTokenId && isAddress(queryNftContract) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">NFT Listing ID</label>
            <div className="p-2 bg-gray-100 rounded">
              {nftListingId ? nftListingId.toString() : "加载中..."}
            </div>
            <label className="block text-sm font-medium">NFT Listing 信息</label>
            <div className="p-2 bg-gray-100 rounded max-h-40 overflow-y-auto">
              {nftListing ? (
                <pre className="text-xs">{JSON.stringify(nftListing, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
              ) : (
                "加载中..."
              )}
            </div>
          </div>
        )}
        
        {/* 签名查询 */}
        <div className="space-y-2">
          <label htmlFor="querySignatureHashInput" className="block text-sm font-medium">查询签名哈希</label>
          <Input
            id="querySignatureHashInput"
            placeholder="输入签名哈希"
            value={querySignatureHash}
            onChange={(e) => setQuerySignatureHash(e.target.value)}
          />
        </div>
        
        {querySignatureHash && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">签名是否已使用</label>
            <div className="p-2 bg-gray-100 rounded">
              {usedSignature !== undefined ? (usedSignature ? "已使用" : "未使用") : "加载中..."}
            </div>
          </div>
        )}
        
        {/* 最新 Listings */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">最新 Listings (前10个)</label>
          <div className="p-2 bg-gray-100 rounded max-h-60 overflow-y-auto">
            {latestListings ? (
              <pre className="text-xs">{JSON.stringify(latestListings, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
            ) : (
              "加载中..."
            )}
          </div>
        </div>
      </div>
      
      <hr className="border-gray-200" />
      
      {/* 高级信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">高级信息</h3>
        
        {/* EIP712 Domain */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">EIP712 Domain</label>
          <div className="p-2 bg-gray-100 rounded max-h-40 overflow-y-auto">
            {eip712Domain ? (
              <pre className="text-xs">{JSON.stringify(eip712Domain, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>
            ) : (
              "加载中..."
            )}
          </div>
        </div>
        
        {/* Permit Typehash */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Permit Typehash</label>
          <div className="p-2 bg-gray-100 rounded font-mono text-xs break-all">
            {permitTypehash || "加载中..."}
          </div>
        </div>
        
        {/* 测试哈希函数 */}
        <div className="space-y-2">
          <label htmlFor="testStructHash" className="block text-sm font-medium">测试哈希函数</label>
          <div className="flex gap-4">
            <Input id="testStructHash" placeholder="输入结构哈希" className="flex-1" />
            <Button
              onClick={() => {
                const structHash = (document.getElementById("testStructHash") as HTMLInputElement).value;
                handleHashTypedDataV4(structHash);
              }}
            >
              计算哈希
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
