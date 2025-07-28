import {Button} from "@/app/components/ui/button";
import {Card} from "@/app/components/ui/card";
import {Input} from "@/app/components/ui/input";
import {useAccount, useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import {parseEther} from "viem";
import {toast} from "sonner";
import {MyNFTV4_ABI} from "@/app/abi/MyNFTV4";
import {MyNFTMarketV4_ABI} from "@/app/abi/MyNFTMarketV4";

export default function NFTMarketInteraction() {
  const {address, isConnected} = useAccount();
  const {writeContract, data: hash} = useWriteContract();
  const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});
  const nftAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" as const;
  const marketAddress = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9" as const;
  const handleMint = async () => {
    if (!isConnected) return toast.error("Please connect wallet");
    try {
      writeContract({address: nftAddress, abi: MyNFTV4_ABI, functionName: "mint", chainId: 31337});
      toast.success("Mint initiated");
    } catch (error) {
      toast.error("Mint failed");
    }
  };
  const handleList = async (tokenId: string, price: string) => {
    if (!isConnected) return toast.error("Please connect wallet");
    try {
      writeContract({
        address: nftAddress,
        abi: MyNFTV4_ABI,
        functionName: "approve",
        args: [marketAddress, BigInt(tokenId)],
        chainId: 31337,
      });
      writeContract({
        address: marketAddress,
        abi: MyNFTMarketV4_ABI,
        functionName: "create721Listing",
        args: [nftAddress, BigInt(tokenId), parseEther(price), false],
        chainId: 31337,
      });
      toast.success("Listing initiated");
    } catch (error) {
      toast.error("Listing failed");
    }
  };
  const handleBuy = async (listingId: string) => {
    if (!isConnected) return toast.error("Please connect wallet");
    try {
      writeContract({
        address: marketAddress,
        abi: MyNFTMarketV4_ABI,
        functionName: "buyNFT",
        args: [BigInt(listingId), BigInt(1)],
        value: parseEther("0.1"),
        chainId: 31337,
      });
      toast.success("Buy initiated");
    } catch (error) {
      toast.error("Buy failed");
    }
  };
  return (
    <Card className="p-4 mt-4">
      <h2>NFT Market</h2>
      <Button onClick={handleMint}>Mint NFT</Button>
      <Input placeholder="Token ID to list" id="tokenId" />
      <Input placeholder="Price" id="price" />
      <Button
        onClick={() => {
          const tokenId = (document.getElementById("tokenId") as HTMLInputElement).value;
          const price = (document.getElementById("price") as HTMLInputElement).value;
          handleList(tokenId, price);
        }}
      >
        List NFT
      </Button>
      <Input placeholder="Listing ID to buy" id="listingId" />
      <Button
        onClick={() => {
          const listingId = (document.getElementById("listingId") as HTMLInputElement).value;
          handleBuy(listingId);
        }}
      >
        Buy NFT
      </Button>
    </Card>
  );
}
