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

export const LOCAL_NFT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
export const LOCAL_NFT_MARKET_ADDRESS = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
export const LOCAL_TOKEN_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
export const LOCAL_TOKEN_BANK_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
