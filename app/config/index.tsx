import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, sepolia, anvil} from '@reown/appkit/networks'

// Update networks
export const networks = [mainnet, arbitrum, sepolia ,anvil]
// Get projectId from Reown Dashboard
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
if (!projectId) {throw new Error('Project ID is not defined')}
// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const LOCAL_NFT_ADDRESS = "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707";
export const LOCAL_NFT_MARKET_ADDRESS = "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853";
export const LOCAL_TOKEN_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9";
export const LOCAL_TOKEN_BANK_ADDRESS = "0x0165878a594ca255338adfa4d48449f69242eb8f";
