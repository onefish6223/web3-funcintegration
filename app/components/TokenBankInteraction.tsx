import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'

export default function TokenBankInteraction() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  const tokenBankAddress = '0x34A1D3fff3958843C43aD80F30b94c510645C316' as const
  const tokenAddress = '0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519' as const
  const abi = [{"inputs":[{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"depositor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"withdrawer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[{"internalType":"address","name":"depositor","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const
  const { data: balance } = useReadContract({
    address: tokenBankAddress,
    abi,
    functionName: 'balanceOf',
    args: [address!],
    chainId: 31337,
  })
  const handleDeposit = async (amount: string) => {
    if (!isConnected) {
      toast.error('Please connect wallet first')
      return
    }
    try {
      writeContract({
        address: tokenAddress,
        abi: [ {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"} ],
        functionName: 'approve',
        args: [tokenBankAddress, parseEther(amount)],
        chainId: 31337,
      })
      writeContract({
        address: tokenBankAddress,
        abi,
        functionName: 'deposit',
        args: [parseEther(amount)],
        chainId: 31337,
      })
      toast.success('Deposit initiated')
    } catch (error) {
      toast.error('Deposit failed')
    }
  }
  return (
    <Card className="p-4 mt-4">
      <h2>Token Bank</h2>
      <p>Balance: {balance ? balance.toString() : '0'} tokens</p>
      <Input placeholder="Amount to deposit" id="depositAmount" />
      <Button onClick={() => {
        const amount = (document.getElementById('depositAmount') as HTMLInputElement).value
        handleDeposit(amount)
      }}>Deposit</Button>
    </Card>
  )
}