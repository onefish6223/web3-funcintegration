'use client'
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAccount, useChainId } from "wagmi";
import { useState } from "react";
import { toast } from "sonner";
import { isAddress, keccak256, encodePacked, toHex } from "viem";

export default function SignatureBuilder() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // ERC20 Permit 签名状态
  const [permitData, setPermitData] = useState({
    owner: "",
    spender: "",
    value: "",
    nonce: "",
    deadline: "",
    tokenAddress: "",
    tokenName: "",
    tokenVersion: "1"
  });

  // Permit2 签名状态
  const [permit2Data, setPermit2Data] = useState({
    owner: "",
    token: "",
    amount: "",
    expiration: "",
    nonce: "",
    spender: "",
    sigDeadline: ""
  });

  // 生成的签名结果
  const [permitSignature, setPermitSignature] = useState("");
  const [permit2Signature, setPermit2Signature] = useState("");

  // EIP-712 域分隔符和类型哈希
  const ERC20_PERMIT_TYPEHASH = keccak256(
    encodePacked(["string"], ["Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"])
  );

  const PERMIT2_PERMIT_TYPEHASH = keccak256(
    encodePacked(["string"], ["PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)"])
  );

  const PERMIT2_PERMIT_TRANSFER_FROM_TYPEHASH = keccak256(
    encodePacked(["string"], ["PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"])
  );

  // 设置当前用户地址
  const setCurrentUserAsOwner = () => {
    if (address) {
      setPermitData(prev => ({ ...prev, owner: address }));
      setPermit2Data(prev => ({ ...prev, owner: address }));
      toast.success("已设置当前用户为所有者");
    } else {
      toast.error("请先连接钱包");
    }
  };

  // 设置当前时间戳 + 1小时作为截止时间
  const setDefaultDeadline = () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后
    setPermitData(prev => ({ ...prev, deadline: deadline.toString() }));
    setPermit2Data(prev => ({ ...prev, sigDeadline: deadline.toString() }));
    toast.success("已设置默认截止时间（1小时后）");
  };

  // 构建 ERC20 Permit 签名数据
  const buildPermitSignature = () => {
    try {
      if (!permitData.owner || !permitData.spender || !permitData.value || 
          !permitData.nonce || !permitData.deadline || !permitData.tokenAddress) {
        toast.error("请填写所有必需的 Permit 字段");
        return;
      }

      if (!isAddress(permitData.owner) || !isAddress(permitData.spender) || !isAddress(permitData.tokenAddress)) {
        toast.error("请输入有效的地址");
        return;
      }

      // 构建域分隔符
      const domain = {
        name: permitData.tokenName,
        version: permitData.tokenVersion,
        chainId: chainId,
        verifyingContract: permitData.tokenAddress as `0x${string}`
      };

      // 构建消息
      const message = {
        owner: permitData.owner as `0x${string}`,
        spender: permitData.spender as `0x${string}`,
        value: BigInt(permitData.value),
        nonce: BigInt(permitData.nonce),
        deadline: BigInt(permitData.deadline)
      };

      const signatureData = {
        domain,
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
          ]
        },
        message
      };

      setPermitSignature(JSON.stringify(signatureData, null, 2));
      toast.success("ERC20 Permit 签名数据已生成");
    } catch (error) {
      console.error("构建 Permit 签名失败:", error);
      toast.error("构建 Permit 签名失败");
    }
  };

  // 构建 Permit2 签名数据
  const buildPermit2Signature = () => {
    try {
      if (!permit2Data.owner || !permit2Data.token || !permit2Data.amount || 
          !permit2Data.expiration || !permit2Data.nonce || !permit2Data.spender || !permit2Data.sigDeadline) {
        toast.error("请填写所有必需的 Permit2 字段");
        return;
      }

      if (!isAddress(permit2Data.owner) || !isAddress(permit2Data.token) || !isAddress(permit2Data.spender)) {
        toast.error("请输入有效的地址");
        return;
      }

      // Permit2 合约的域分隔符（这里使用通用的 Permit2 合约地址）
      const domain = {
        name: "Permit2",
        chainId: chainId,
        verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}` // Uniswap Permit2 合约地址
      };

      // 构建消息
      const message = {
        permitted: {
          token: permit2Data.token as `0x${string}`,
          amount: permit2Data.amount
        },
        spender: permit2Data.spender as `0x${string}`,
        nonce: permit2Data.nonce,
        deadline: permit2Data.sigDeadline
      };

      const signatureData = {
        domain,
        types: {
          PermitTransferFrom: [
            { name: "permitted", type: "TokenPermissions" },
            { name: "spender", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
          ],
          TokenPermissions: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" }
          ]
        },
        message
      };

      setPermit2Signature(JSON.stringify(signatureData, null, 2));
      toast.success("Permit2 签名数据已生成");
    } catch (error) {
      console.error("构建 Permit2 签名失败:", error);
      toast.error("构建 Permit2 签名失败");
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} 签名数据已复制到剪贴板`);
    }).catch(() => {
      toast.error("复制失败");
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* 连接状态 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">连接状态</h3>
            <p className="text-sm text-gray-500">
              {isConnected ? `已连接: ${address}` : "未连接钱包"}
            </p>
            <p className="text-sm text-gray-500">链 ID: {chainId}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={setCurrentUserAsOwner} disabled={!isConnected}>
              设为所有者
            </Button>
            <Button onClick={setDefaultDeadline} variant="outline">
              设置默认截止时间
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ERC20 Permit 签名构建 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ERC20 Permit 签名</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">代币合约地址</label>
              <Input
                placeholder="0x..."
                value={permitData.tokenAddress}
                onChange={(e) => setPermitData(prev => ({ ...prev, tokenAddress: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代币名称</label>
                <Input
                  placeholder="Token Name"
                  value={permitData.tokenName}
                  onChange={(e) => setPermitData(prev => ({ ...prev, tokenName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
                <Input
                  placeholder="1"
                  value={permitData.tokenVersion}
                  onChange={(e) => setPermitData(prev => ({ ...prev, tokenVersion: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所有者地址</label>
              <Input
                placeholder="0x..."
                value={permitData.owner}
                onChange={(e) => setPermitData(prev => ({ ...prev, owner: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">被授权地址</label>
              <Input
                placeholder="0x..."
                value={permitData.spender}
                onChange={(e) => setPermitData(prev => ({ ...prev, spender: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">授权金额</label>
              <Input
                placeholder="1000000000000000000"
                value={permitData.value}
                onChange={(e) => setPermitData(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nonce</label>
                <Input
                  placeholder="0"
                  value={permitData.nonce}
                  onChange={(e) => setPermitData(prev => ({ ...prev, nonce: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止时间</label>
                <Input
                  placeholder="1234567890"
                  value={permitData.deadline}
                  onChange={(e) => setPermitData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={buildPermitSignature} className="w-full">
              构建 ERC20 Permit 签名
            </Button>

            {permitSignature && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">签名数据</label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(permitSignature, "ERC20 Permit")}
                  >
                    复制
                  </Button>
                </div>
                <textarea
                  className="w-full h-40 p-3 border border-gray-300 rounded-md text-xs font-mono"
                  value={permitSignature}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        {/* Permit2 签名构建 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Permit2 签名</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所有者地址</label>
              <Input
                placeholder="0x..."
                value={permit2Data.owner}
                onChange={(e) => setPermit2Data(prev => ({ ...prev, owner: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">代币合约地址</label>
              <Input
                placeholder="0x..."
                value={permit2Data.token}
                onChange={(e) => setPermit2Data(prev => ({ ...prev, token: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">授权金额</label>
              <Input
                placeholder="1000000000000000000"
                value={permit2Data.amount}
                onChange={(e) => setPermit2Data(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">过期时间</label>
              <Input
                placeholder="1234567890"
                value={permit2Data.expiration}
                onChange={(e) => setPermit2Data(prev => ({ ...prev, expiration: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">被授权地址</label>
              <Input
                placeholder="0x..."
                value={permit2Data.spender}
                onChange={(e) => setPermit2Data(prev => ({ ...prev, spender: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nonce</label>
                <Input
                  placeholder="0"
                  value={permit2Data.nonce}
                  onChange={(e) => setPermit2Data(prev => ({ ...prev, nonce: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签名截止时间</label>
                <Input
                  placeholder="1234567890"
                  value={permit2Data.sigDeadline}
                  onChange={(e) => setPermit2Data(prev => ({ ...prev, sigDeadline: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={buildPermit2Signature} className="w-full">
              构建 Permit2 签名
            </Button>

            {permit2Signature && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">签名数据</label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(permit2Signature, "Permit2")}
                  >
                    复制
                  </Button>
                </div>
                <textarea
                  className="w-full h-40 p-3 border border-gray-300 rounded-md text-xs font-mono"
                  value={permit2Signature}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">使用说明</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>ERC20 Permit:</strong> 用于构建标准 ERC20 代币的 permit 签名，允许用户授权第三方代表其花费代币。</p>
          <p><strong>Permit2:</strong> 用于构建 Uniswap Permit2 协议的签名，提供更灵活的代币授权机制。</p>
          <p><strong>注意:</strong> 生成的是签名数据结构，需要使用钱包进行实际签名后才能使用。</p>
          <p><strong>提示:</strong> 可以点击"设为所有者"按钮快速填入当前连接的钱包地址。</p>
        </div>
      </div>
    </div>
  );
}