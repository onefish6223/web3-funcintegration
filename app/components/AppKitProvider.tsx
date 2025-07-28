'use client'
import { wagmiAdapter, projectId } from '@/app/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { mainnet, arbitrum, anvil ,sepolia} from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Update networks to use custom anvil
export const updatedNetworks = [mainnet, arbitrum, sepolia,anvil] as [AppKitNetwork, ...AppKitNetwork[]]
// Set up queryClient
const queryClient = new QueryClient()
if (!projectId) {
  throw new Error('Project ID is not defined')
}
// Set up metadata
const metadata = {
  name: 'web3-funcintegration',
  description: 'Web3 Function Integration',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: updatedNetworks,
  defaultNetwork: updatedNetworks[0],
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'facebook', 'x', 'discord', 'farcaster'],
    onramp: true,
    swaps: true
  }
})
export default function AppKitProvider({
  children,
  cookies
}: {
  children: ReactNode
  cookies?: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}