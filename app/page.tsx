'use client'
import { Toaster } from 'sonner'
import TokenBankInteraction from './components/TokenBankInteraction'
import NFTMarketInteraction from './components/NFTMarketInteraction'
import TokenInteraction from './components/TokenInteraction'
import NFTInteraction from './components/NFTInteraction'
import { useState } from 'react'
import Permit2Interaction from './components/Permit2Interaction'
import SignatureBuilder from './components/SignatureBuilder'
import TransferHistory from './components/TransferHistory'

export default function Home() {
  const [activeTab, setActiveTab] = useState('history')

  const tabs = [
      { id: 'token', name: 'Token', component: <TokenInteraction /> },
      { id: 'nft', name: 'NFT', component: <NFTInteraction /> },
      { id: 'bank', name: 'Token Bank', component: <TokenBankInteraction /> },
      { id: 'market', name: 'NFT Market', component: <NFTMarketInteraction /> },
      { id: 'permit2', name: 'Permit2', component: <Permit2Interaction /> },
      { id: 'signature', name: '签名构建器', component: <SignatureBuilder /> },
      { id: 'history', name: '转账历史', component: <TransferHistory /> },
    ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 导航栏 */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Web3 DApp
                    </h1>
                    <p className="text-sm text-gray-500">
                      onefish6223
                    </p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <appkit-button />
              </div>
            </div>
          </div>
          
          {/* 移动端导航 */}
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 页面标题和描述 */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {activeTab === 'token' && '与 ERC20 代币合约交互，包括铸造、转账、授权等功能'}
              {activeTab === 'bank' && '代币银行系统，支持以太币和 ERC20 代币的存取款、转账功能'}
              {activeTab === 'nft' && '与 NFT 合约交互，包括铸造、转账、授权等功能'}
              {activeTab === 'market' && 'NFT 市场交易平台，支持上架、购买、取消等操作'}
              {activeTab === 'permit2' && '与Permit2 交互，统一的接口来管理 ERC20 代币的授权，支持签名授权、批量操作和安全的代币转账'}
              {activeTab === 'signature' && '签名构建器工具，支持构建和验证各种类型的数字签名'}
              {activeTab === 'history' && '查看和管理转账历史记录，包括代币和NFT的转账详情'}
            </p>
          </div>

          {/* 内容区域 */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl"></div>
            <div className="relative z-10 p-8">
              {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
          </div>

          {/* 底部信息 */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">xxx环境 (Chain ID: xxxxx)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      />
    </>
  )
}

