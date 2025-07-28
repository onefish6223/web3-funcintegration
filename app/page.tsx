'use client'
import { Toaster, toast } from 'sonner'
import TokenBankInteraction from './components/TokenBankInteraction'
import NFTMarketInteraction from './components/NFTMarketInteraction'
import TokenInteraction from './components/TokenInteraction'
import NFTInteraction from './components/NFTInteraction'
export default function Home() {
  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <appkit-button />
        <TokenInteraction />
        <TokenBankInteraction />
        <NFTMarketInteraction />
        <NFTInteraction />
        
      </div>
      <Toaster />
    </>
  )
}

