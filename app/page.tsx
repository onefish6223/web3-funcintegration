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
import EIP7702Transaction from './components/EIP7702Transaction'

export default function Home() {
  const [activeTab, setActiveTab] = useState('eip7702')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs = [
      { id: 'token', name: 'Token', component: <TokenInteraction /> },
      { id: 'nft', name: 'NFT', component: <NFTInteraction /> },
      { id: 'bank', name: 'Token Bank', component: <TokenBankInteraction /> },
      { id: 'market', name: 'NFT Market', component: <NFTMarketInteraction /> },
      { id: 'permit2', name: 'Permit2', component: <Permit2Interaction /> },
      { id: 'eip7702', name: 'EIP-7702', component: <EIP7702Transaction /> },
      { id: 'signature', name: '签名构建器', component: <SignatureBuilder /> },
      { id: 'history', name: '转账历史', component: <TransferHistory /> },
    ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        {/* 移动端顶部栏 */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 h-16">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Web3 DApp
            </h1>
            <appkit-button />
          </div>
        </div>

        {/* 移动端遮罩层 */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 左侧导航栏 */}
        <nav className={`w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 fixed left-0 top-0 h-full z-50 overflow-y-auto transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          {/* 头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between lg:justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Web3 DApp
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  onefish6223
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 hidden lg:block">
              <appkit-button />
            </div>
          </div>
          
          {/* 导航菜单 */}
          <div className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
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
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
          {/* 页面标题和描述 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'token' && '与 ERC20 代币合约交互，包括铸造、转账、授权等功能'}
              {activeTab === 'bank' && '代币银行系统，支持以太币和 ERC20 代币的存取款、转账功能'}
              {activeTab === 'nft' && '与 NFT 合约交互，包括铸造、转账、授权等功能'}
              {activeTab === 'market' && 'NFT 市场交易平台，支持上架、购买、取消等操作'}
              {activeTab === 'permit2' && '与Permit2 交互，统一的接口来管理 ERC20 代币的授权，支持签名授权、批量操作和安全的代币转账'}
              {activeTab === 'eip7702' && 'EIP-7702 交易构建器，支持构建和发送类型0x4的交易，实现EOA临时获得智能合约能力'}
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
          <div className="mt-12 flex justify-center">
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

