import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  getContract,
  formatEther,
  zeroAddress,
} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {foundry, sepolia} from "viem/chains";
import type {TransactionReceipt} from "viem";

import {EIP7702BatchExecutor_ABI} from "../abi/EIP7702BatchExecutor";
import {MyTokenV4_ABI} from "../abi/MyTokenV4";
import {MyTokenBankV4_ABI} from "../abi/MyTokenBankV4";

// ====== 配置 ======
// const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// const SIMPLE_DELEGATE_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3' as `0x${string}`;
// const ERC20_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as `0x${string}`;
// const TOKENBANK_ADDRESS = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0' as `0x${string}`;

const PRIVATE_KEY = "0x999999999";//修改私钥
const SIMPLE_DELEGATE_ADDRESS = "0x1Cb51F196b30015aB4126427157E6a15BBb7cBBC" as `0x${string}`;
const ERC20_ADDRESS = "0xD67ee2ff8F2B5FFC0B7B8689b9e1626B70452C44" as `0x${string}`;
const TOKENBANK_ADDRESS = "0xD0b5Ae39222f9F09876fEDD0eba7B56a5895808B" as `0x${string}`;

// deposit 参数
const DEPOSIT_AMOUNT = 1000000000000000000n; // 1 token

// 查询指定地址的链上代码
async function getCodeAtAddress(address: string, publicClient: any) {
  const code = await publicClient.getBytecode({address: address as `0x${string}`});
  console.log(`地址 ${address} 的链上代码:`, code);
  return code;
}

async function getTokenBalance(userAddress: string, publicClient: any, walletClient: any) {
  const eoaTokenBalance = await publicClient.readContract({
    address: ERC20_ADDRESS,
    abi: MyTokenV4_ABI,
    functionName: "balanceOf",
    args: [userAddress],
  });
  console.log(userAddress, " ERC20余额:", formatEther(eoaTokenBalance));
  return eoaTokenBalance;
}

async function main() {
  const eoa = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  // const publicClient = createPublicClient({
  //     chain: foundry,
  //     transport: http('http://127.0.0.1:8545'),
  // });
  // const walletClient = createWalletClient({
  //     account: eoa,
  //     chain: foundry,
  //     transport: http('http://127.0.0.1:8545'),
  // } )
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL),
  });

  const walletClient = createWalletClient({
    account: eoa,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL),
  });

  // 1. 构造 calldata
  const approveCalldata = encodeFunctionData({
    abi: MyTokenV4_ABI,
    functionName: "approve",
    args: [TOKENBANK_ADDRESS, DEPOSIT_AMOUNT],
  });
  const depositCalldata = encodeFunctionData({
    abi: MyTokenBankV4_ABI,
    functionName: "depositToken",
    args: [ERC20_ADDRESS, DEPOSIT_AMOUNT],
  });

  // 2. 构造批量 calls
  const calls = [
    {
      to: ERC20_ADDRESS as `0x${string}`,
      data: approveCalldata,
      value: 0n,
    },
    {
      to: TOKENBANK_ADDRESS as `0x${string}`,
      data: depositCalldata,
      value: 0n,
    },
  ];

  // 3. 构造 execute calldata
  const executeCalldata = encodeFunctionData({
    abi: EIP7702BatchExecutor_ABI,
    functionName: "executeBatch",
    args: [calls],
  });

  await getTokenBalance(eoa.address, publicClient, walletClient);

  // 0. 查询eoa的链上代码
  const code = await getCodeAtAddress(eoa.address, publicClient);
  console.log("eoa的链上代码:", code);

  if (code && code.length > 0) {
    console.log("eoa的链上代码不为空");

    const hash = await walletClient.sendTransaction({
      to: eoa.address,
      data: executeCalldata,
    });
    console.log("直接向eoa发送交易, tx hash:", hash);
    const receipt: TransactionReceipt = await publicClient.waitForTransactionReceipt({hash: hash});
    console.log("交易状态:", receipt.status === "success" ? "成功" : "失败");
  } else {
    // 自己执行授权时，nonce +1
    const authorization = await walletClient.signAuthorization({
      contractAddress: SIMPLE_DELEGATE_ADDRESS,
      executor: "self",
    });

    // 发送 EIP-7702 交易
    try {
      const hash = await walletClient.writeContract({
        abi: EIP7702BatchExecutor_ABI,
        address: eoa.address,
        functionName: "executeBatch",
        args: [calls],
        authorizationList: [authorization],
      });
      console.log("EIP-7702 批量交易已发送，tx hash:", hash);

      const receipt: TransactionReceipt = await publicClient.waitForTransactionReceipt({hash: hash});
      console.log("交易状态:", receipt.status === "success" ? "成功" : "失败");
    } catch (err) {
      console.error("发送 EIP-7702 交易失败:", err);
    }
  }

  // 检查bank下用户的存款数量
  await getTokenBalance(TOKENBANK_ADDRESS, publicClient, walletClient);
  await getTokenBalance(eoa.address, publicClient, walletClient);

  // const cancelAuthorization = await walletClient.signAuthorization({
  //   contractAddress: zeroAddress,
  //   executor: 'self',
  // });
  // const cancelHash = await walletClient.sendTransaction({
  //   authorizationList: [cancelAuthorization],
  //   to: zeroAddress,
  // })
  // const cancelReceipt: TransactionReceipt = await publicClient.waitForTransactionReceipt({ hash: cancelHash })
  // console.log('取消 delegate 交易状态:', cancelReceipt.status === 'success' ? '成功' : '失败')

  await getCodeAtAddress(eoa.address, publicClient);
}

main();
