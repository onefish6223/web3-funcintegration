'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { toast } from 'sonner';

interface Transfer {
  id: number;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  logIndex: number;
  transactionIndex: number;
  createdAt: string;
}

interface TransferResponse {
  data: Transfer[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const API_BASE_URL = 'http://localhost:3001';

export default function TransferHistory() {
  const { address, isConnected } = useAccount();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 检查API服务状态
  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setApiStatus('online');
        return true;
      }
    } catch (error) {
      console.error('API health check failed:', error);
    }
    setApiStatus('offline');
    return false;
  };

  // 获取转账记录
  const fetchTransfers = async (offset: number = 0) => {
    if (!address || !isConnected) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/transfers/${address}?limit=${pagination.limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TransferResponse = await response.json();
      
      if (offset === 0) {
        setTransfers(data.data);
      } else {
        setTransfers(prev => [...prev, ...data.data]);
      }
      
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        hasMore: data.pagination.hasMore
      });
      
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('获取转账记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载更多记录
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchTransfers(pagination.offset + pagination.limit);
    }
  };

  // 刷新数据
  const refresh = () => {
    fetchTransfers(0);
  };

  // 格式化时间
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  // 格式化金额
  const formatAmount = (value: string) => {
    try {
      return formatUnits(BigInt(value), 18);
    } catch {
      return '0';
    }
  };

  // 截短地址
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 获取转账方向
  const getTransferDirection = (transfer: Transfer) => {
    if (!address) return 'unknown';
    if (transfer.from.toLowerCase() === address.toLowerCase()) return 'out';
    if (transfer.to.toLowerCase() === address.toLowerCase()) return 'in';
    return 'unknown';
  };

  // 初始化时检查API状态
  useEffect(() => {
    checkApiStatus();
  }, []);

  // 当地址变化时获取数据
  useEffect(() => {
    if (isConnected && address && apiStatus === 'online') {
      fetchTransfers(0);
    } else {
      setTransfers([]);
      setPagination({ total: 0, limit: 20, offset: 0, hasMore: false });
    }
  }, [address, isConnected, apiStatus]);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">ERC20 转账历史</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">请先连接钱包以查看转账历史</p>
        </div>
      </div>
    );
  }

  if (apiStatus === 'checking') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">ERC20 转账历史</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">正在检查API服务状态...</p>
        </div>
      </div>
    );
  }

  if (apiStatus === 'offline') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">ERC20 转账历史</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 mb-2">API服务离线</p>
          <p className="text-sm text-red-600 mb-3">
            请确保后端API服务正在运行在 {API_BASE_URL}
          </p>
          <button
            onClick={checkApiStatus}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重新检查
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ERC20 转账历史</h2>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            地址: {shortenAddress(address!)}
          </p>
          <p className="text-sm text-gray-600">
            总记录数: {pagination.total}
          </p>
        </div>

        {transfers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {loading ? '加载中...' : '暂无转账记录'}
          </div>
        ) : (
          <div className="divide-y">
            {transfers.map((transfer) => {
              const direction = getTransferDirection(transfer);
              const isOutgoing = direction === 'out';
              
              return (
                <div key={`${transfer.transactionHash}-${transfer.logIndex}`} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          isOutgoing 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isOutgoing ? '转出' : '转入'}
                        </span>
                        <span className="text-sm text-gray-500">
                          区块 #{transfer.blockNumber}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-500">从: </span>
                          <span className="font-mono">{shortenAddress(transfer.from)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">到: </span>
                          <span className="font-mono">{shortenAddress(transfer.to)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">时间: </span>
                          <span>{formatTimestamp(transfer.blockTimestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        isOutgoing ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isOutgoing ? '-' : '+'}{formatAmount(transfer.value)} LMX
                      </div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${transfer.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        查看交易
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.hasMore && (
          <div className="p-4 border-t bg-gray-50 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>

      {/* API状态指示器 */}
      <div className="text-xs text-gray-500 text-center">
        API状态: 
        <span className={`ml-1 ${
          apiStatus === 'online' ? 'text-green-600' : 'text-red-600'
        }`}>
          {apiStatus === 'online' ? '在线' : '离线'}
        </span>
      </div>
    </div>
  );
}