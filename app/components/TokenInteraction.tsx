import {Button} from "@/app/components/ui/button";
import {Card} from "@/app/components/ui/card";
import {Input} from "@/app/components/ui/input";
import {useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useBalance} from "wagmi";
import {parseEther} from "viem";
import {toast} from "sonner";
import {MyTokenV4_ABI} from "@/app/abi/MyTokenV4";

export default function TokenInteraction() {
  const {address, isConnected} = useAccount();
  const tokenAddress = "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519" as const;
  const {data: balance} = useReadContract({
    address: tokenAddress,
    abi: MyTokenV4_ABI,
    functionName: "balanceOf",
    args: [address!],
  });
  const {writeContract} = useWriteContract();
  const handleTransfer = async (to: string, amount: string) => {
    if (!isConnected) return toast.error("Please connect wallet");
    try {
      writeContract({
        address: tokenAddress,
        abi: MyTokenV4_ABI,
        functionName: "transfer",
        args: [to as `0x${string}`, parseEther(amount)],
        chainId: 31337,
      });
      toast.success("Transfer initiated");
    } catch (error) {
      toast.error("Transfer failed");
    }
  };
  return (
    <Card className="p-4 mt-4">
      <h2>My Token</h2>
      <p>Balance: {balance ? balance.toString() : "0"} tokens</p>
      <Input placeholder="Recipient address" id="recipient" />
      <Input placeholder="Amount to transfer" id="transferAmount" />
      <Button
        onClick={() => {
          const to = (document.getElementById("recipient") as HTMLInputElement).value;
          const amount = (document.getElementById("transferAmount") as HTMLInputElement).value;
          handleTransfer(to, amount);
        }}
      >
        Transfer
      </Button>
    </Card>
  );
}
