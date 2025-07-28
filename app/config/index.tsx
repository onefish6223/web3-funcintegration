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

export const NFT_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
export const NFT_MARKET_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
export const TOKEN_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
export const TOKEN_BANK_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
