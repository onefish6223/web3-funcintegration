# ########非常重要##########
由于前面做 7702 测试的时候将 EOA 账户在sepolia 测试链上修改成了智能账户
导致执行部署脚本 DeployUpgradeableContracts.s.sol，执行nft.mint（）方法时失败
（ERC721Utils.checkOnERC721Received判断了to.code.length > 0）
foundry 执行脚本部署是原子性的，所以整个部署都失败。
清空sepolia 测试链上的eoa 的 code 即可。
# sepolia 合约地址
  Deployer: 0x1a51aC777C1bB3D7b8fC6be3ad3Fe6D7f9Ec4742

  NFT V1 Implementation deployed at: 0x98D6b1f11796fD3dB1af64E980e7aC67D2712DfB
  NFT Proxy deployed at: 0x552e25C62519730450BDBC5ee32Da2381b7944CC
  NFT Market V1 Implementation deployed at: 0x0c61F5C3A0fF9BdD698220b87d99e88E745EBaf2
  NFT Market Proxy deployed at: 0xd6090807ED532914c876d0ba25053642038f1C12
  NFT V2 Implementation deployed at: 0xdd4453f35708D24cBcA2E9A076f089600E9Fb7EE
  NFT Market V2 Implementation deployed at: 0x728dAEB4FEBF21248659E5d30c84b4096eae8c3c
  
  NFT name: UpgradeableNFT
  NFT symbol: UNFT
  NFT version: 1.0.0
  Market version: 1.0.0
# 测试用例的日志
mxli@MxdeMacBook-Pro web3-funcintegration % forge test --match-contract UpgradeableContractsTest -v 
[⠊] Compiling...
No files changed, compilation skipped

Ran 9 tests for test/UpgradeableContracts.t.sol:UpgradeableContractsTest
[PASS] testInitialState() (gas: 66047)
[PASS] testMarketListing() (gas: 294155)
[PASS] testMarketPurchase() (gas: 325866)
[PASS] testNFTMinting() (gas: 136888)
[PASS] testSignatureListing() (gas: 623240)
[PASS] testUpgradeToV2() (gas: 398974)
[PASS] testV2NewFeatures() (gas: 165579)
[PASS] test_RevertWhen_DoubleInitialize() (gas: 19145)
[PASS] test_RevertWhen_UpgradeByNonOwner() (gas: 21458)
Suite result: ok. 9 passed; 0 failed; 0 skipped; finished in 7.15ms (6.10ms CPU time)

Ran 1 test suite in 199.38ms (7.15ms CPU time): 9 tests passed, 0 failed, 0 skipped (9 total tests)

# 部署上sepolia 链的日志
mxli@MxdeMacBook-Pro web3-funcintegration % ./deploy-sepolia.sh
=== Sepolia 部署脚本 ===

检查环境变量...
发现 .env 文件，正在加载...
✓ PRIVATE_KEY 已设置
✓ INFURA_PROJECT_ID 已设置
✓ ETHERSCAN_API_KEY 已设置
环境变量检查完成
编译合约...
[⠊] Compiling...
[⠰] Compiling 1 files with Solc 0.8.29
[⠔] Solc 0.8.29 finished in 2.40s
Compiler run successful!
合约编译成功
部署合约到 Sepolia...
[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  Upgrader: 0x1a51aC777C1bB3D7b8fC6be3ad3Fe6D7f9Ec4742
  NFT Proxy Address: 0x552e25C62519730450BDBC5ee32Da2381b7944CC
  Market Proxy Address: 0xd6090807ED532914c876d0ba25053642038f1C12
  
=== Pre-upgrade State ===
  NFT Version: 1.0.0
  NFT Total Supply: 0
  NFT Next Token ID: 1
  Market Version: 1.0.0
  Market Next Listing ID: 1
  Market Platform Fee: 250
  
=== New Implementations ===
  NFT V2 Implementation: 0xdd4453f35708D24cBcA2E9A076f089600E9Fb7EE
  Market V2 Implementation: 0x728dAEB4FEBF21248659E5d30c84b4096eae8c3c
  NFT contract upgraded to V2
  Market contract upgraded to V2
  
=== Post-upgrade State ===
  NFT Version: 2.0.0
  NFT Total Supply: 0
  NFT Next Token ID: 1
  Market Version: 2.0.0
  Market Next Listing ID: 1
  Market Platform Fee: 250
  
=== State Comparison Verification ===
  [PASS] NFT Total Supply preserved: 0
  [PASS] NFT Next Token ID preserved: 1
  [PASS] Market Next Listing ID preserved: 1
  [PASS] Market Platform Fee preserved: 250
  [PASS] NFT version correctly upgraded to: 2.0.0
  [PASS] Market version correctly upgraded to: 2.0.0
  
[SUCCESS] State verification PASSED - All data preserved correctly!
  
=== Testing New Features ===
  Market contract set in NFT V2
  Minted new NFT with token ID: 1
  Approved all NFTs to market
  Is approved for market: true
  User nonce: 0
  
=== Upgrade Complete ===
  Both contracts successfully upgraded to V2
  State preservation verified
  New features are functional

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 2.066562315 gwei

Estimated total gas used for script: 363954

Estimated amount required: 0.00075213362079351 ETH

==========================

##### sepolia
✅  [Success] Hash: 0x5dd21836bef64cd81cff73c53c96e2e3b6dcb5050bc1bc1d229f4f9ef4c8a1c1
Block: 8918660
Paid: 0.000037483131196643 ETH (37301 gas * 1.004882743 gwei)


##### sepolia
✅  [Success] Hash: 0xa84adf87153208a973fcf470213162aedb7e9927c1426e8b3c1853cc21e8d329
Block: 8918660
Paid: 0.000054945983504497 ETH (54679 gas * 1.004882743 gwei)


##### sepolia
✅  [Success] Hash: 0xeb245c1720f8f7bf97c6c2d6e2e8d03970f218ab7959f2823f49dc864b0ce9ff
Block: 8918660
Paid: 0.000053224619365738 ETH (52966 gas * 1.004882743 gwei)


##### sepolia
✅  [Success] Hash: 0x2ad68af2d65b2063aba26705b00e795417e998d116b18fa462d00db82ba1cec5
Block: 8918660
Paid: 0.000037700185869131 ETH (37517 gas * 1.004882743 gwei)


##### sepolia
✅  [Success] Hash: 0x3cfc362bdeec7aebbe774d1a83eb74c9975ab8ebc0eedfcb3988ef7181d29b0c
Block: 8918660
Paid: 0.000081433687727234 ETH (81038 gas * 1.004882743 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.000264787607663243 ETH (263501 gas * avg 1.004882743 gwei)
                                                                                                       

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
##
Start verification for (0) contracts
All (0) contracts were verified!

Transactions saved to: /Users/mxli/workspace/web3-funcintegration/broadcast/UpgradeContracts.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/mxli/workspace/web3-funcintegration/cache/UpgradeContracts.s.sol/11155111/run-latest.json

合约部署成功
如果自动验证失败，请手动运行以下命令:
注意: 请将 <CONTRACT_ADDRESS> 替换为实际的合约地址

forge verify-contract <MyTokenV4_ADDRESS> src/MyTokenV4.sol:MyTokenV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
forge verify-contract <MyNFTV4_ADDRESS> src/MyNFTV4.sol:MyNFTV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
forge verify-contract <Permit2_ADDRESS> src/Permit2.sol:Permit2 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
forge verify-contract <MyTokenBankV4_ADDRESS> src/MyTokenBankV4.sol:MyTokenBankV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY
forge verify-contract <MyNFTMarketV4_ADDRESS> src/MyNFTMarketV4.sol:MyNFTMarketV4 --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY --constructor-args <ENCODED_DEPLOYER_ADDRESS>
forge verify-contract <EIP7702BatchExecutor_ADDRESS> src/EIP7702BatchExecutor.sol:EIP7702BatchExecutor --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY

=== 部署完成 ===
请查看上面的输出获取合约地址
部署详情保存在 broadcast/ 目录中

# 可升级合约系统

本目录包含了可升级的 ERC721 NFT 合约和 NFT 市场合约的实现。

## 合约架构

### NFT 合约
- **UpgradeableNFTV1.sol**: 基础版本，支持 NFT 铸造功能
- **UpgradeableNFTV2.sol**: 增强版本，添加了市场授权管理功能

### NFT 市场合约
- **UpgradeableNFTMarketV1.sol**: 基础版本，支持基本的上架、下架、购买功能
- **UpgradeableNFTMarketV2.sol**: 增强版本，添加了离线签名上架功能

## 主要特性

### V1 版本特性
- ✅ 基于 OpenZeppelin 的 UUPS 可升级模式
- ✅ NFT 铸造和批量铸造
- ✅ NFT 市场基本功能（上架、下架、购买）
- ✅ 重入攻击保护
- ✅ 所有权管理

### V2 版本新增特性
- ✅ NFT 市场授权管理（一键授权/撤销）
- ✅ 离线签名上架功能
- ✅ EIP-712 签名验证
- ✅ Nonce 防重放攻击

## 部署和升级

### 部署脚本
```bash
# 部署可升级合约
forge script script/DeployUpgradeableContracts.s.sol --rpc-url <RPC_URL> --broadcast --private-key <PRIVATE_KEY>

# 升级合约到 V2
forge script script/UpgradeContracts.s.sol --rpc-url <RPC_URL> --broadcast --private-key <PRIVATE_KEY>
```

### 测试
```bash
# 运行所有可升级合约测试
forge test --match-path test/UpgradeableContracts.t.sol -vv
```

## 使用示例

### 部署和初始化
```solidity
// 1. 部署实现合约
UpgradeableNFTV1 nftImpl = new UpgradeableNFTV1();
UpgradeableNFTMarketV1 marketImpl = new UpgradeableNFTMarketV1();

// 2. 部署代理合约
ERC1967Proxy nftProxy = new ERC1967Proxy(
    address(nftImpl),
    abi.encodeCall(UpgradeableNFTV1.initialize, ("MyNFT", "MNFT", owner))
);

ERC1967Proxy marketProxy = new ERC1967Proxy(
    address(marketImpl),
    abi.encodeCall(UpgradeableNFTMarketV1.initialize, (owner, 250)) // 2.5% 手续费
);
```

### 升级到 V2
```solidity
// 1. 部署新的实现合约
UpgradeableNFTV2 nftV2Impl = new UpgradeableNFTV2();
UpgradeableNFTMarketV2 marketV2Impl = new UpgradeableNFTMarketV2();

// 2. 升级合约
UpgradeableNFTV1(nftProxy).upgradeToAndCall(
    address(nftV2Impl),
    abi.encodeCall(UpgradeableNFTV2.initializeV2, ())
);

UpgradeableNFTMarketV1(marketProxy).upgradeToAndCall(
    address(marketV2Impl),
    abi.encodeCall(UpgradeableNFTMarketV2.initializeV2, ("MyNFTMarket", "1"))
);
```

### V2 新功能使用
```solidity
// NFT 市场授权管理
UpgradeableNFTV2 nftV2 = UpgradeableNFTV2(nftProxy);
nftV2.setMarketContract(marketProxy);
nftV2.approveAllToMarket(); // 一键授权所有 NFT 给市场

// 离线签名上架
UpgradeableNFTMarketV2 marketV2 = UpgradeableNFTMarketV2(marketProxy);
bytes memory signature = _createListingSignature(nftContract, tokenId, price, seller);
marketV2.createListingWithSignature(nftContract, tokenId, price, seller, signature);
```

## 安全考虑

1. **升级权限**: 只有合约所有者可以执行升级操作
2. **初始化保护**: 防止重复初始化攻击
3. **重入保护**: 所有状态变更函数都有重入保护
4. **签名验证**: V2 版本使用 EIP-712 标准进行签名验证
5. **Nonce 机制**: 防止签名重放攻击

## 测试覆盖

- ✅ 合约部署和初始化
- ✅ NFT 铸造功能
- ✅ 市场上架和购买功能
- ✅ 合约升级流程
- ✅ V2 新功能测试
- ✅ 权限控制测试
- ✅ 错误情况处理

## Gas 优化

- 使用 `uint256` 而非 `uint8` 等小类型以避免额外的类型转换
- 合理使用 `storage` 和 `memory` 关键字
- 批量操作减少交易次数
- 事件日志记录关键状态变更