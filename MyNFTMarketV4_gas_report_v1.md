# MyNFTMarketV4 Gas Report V1 (优化前)

## 测试结果概览
- 总测试数: 12 个
- 通过: 12 个
- 失败: 0 个
- 跳过: 0 个

## 各测试用例 Gas 消耗

| 测试用例 | Gas 消耗 |
|---------|----------|
| testBuy1155NFT() | 400,404 |
| testBuy721NFT() | 423,161 |
| testCancelListing() | 292,215 |
| testCreate1155Listing() | 263,058 |
| testCreate721Listing() | 265,890 |
| testPermitBuyWithWhitelist() | 428,323 |
| testPlatformFee() | 456,449 |
| testRevertIfBuyOwnNFT() | 272,325 |
| testRevertIfDuplicateListing() | 265,039 |
| testRevertIfInsufficientPayment() | 279,437 |
| testRevertIfInvalidSignature() | 313,957 |
| testRevertIfNonOwnerCancel() | 267,497 |

## MyNFTMarketV4 合约详细 Gas 报告

### 部署成本
- **部署成本**: 2,430,250 gas
- **部署大小**: 11,707 bytes

### 函数调用 Gas 消耗

| 函数名 | 最小值 | 平均值 | 中位数 | 最大值 | 调用次数 |
|--------|--------|--------|--------|--------|---------|
| PERMIT_TYPEHASH | 238 | 238 | 238 | 238 | 2 |
| buyNFT | 31,186 | 84,198 | 113,001 | 124,524 | 5 |
| cancelListing | 30,942 | 34,850 | 34,850 | 38,759 | 2 |
| create1155Listing | 222,673 | 222,673 | 222,673 | 222,673 | 2 |
| create721Listing | 30,007 | 205,328 | 222,858 | 222,870 | 11 |
| feeReceiver | 2,629 | 2,629 | 2,629 | 2,629 | 2 |
| getNFTListing | 20,572 | 20,572 | 20,572 | 20,572 | 5 |
| getUserListings | 25,037 | 25,037 | 25,037 | 25,037 | 1 |
| hashTypedDataV4 | 522 | 522 | 522 | 522 | 2 |
| nonces | 2,605 | 2,605 | 2,605 | 2,605 | 1 |
| permitBuy | 60,972 | 116,647 | 116,647 | 172,323 | 2 |
| setFeeReceiver | 30,690 | 30,690 | 30,690 | 30,690 | 1 |
| setPlatformFeePercentage | 47,159 | 47,159 | 47,159 | 47,159 | 1 |

## 关键观察

### 高 Gas 消耗函数
1. **create1155Listing**: 222,673 gas
2. **create721Listing**: 平均 205,328 gas (最大 222,870)
3. **buyNFT**: 平均 84,198 gas (最大 124,524)
4. **permitBuy**: 平均 116,647 gas (最大 172,323)

### 部署成本
- 合约部署成本较高: 2,430,250 gas
- 合约大小: 11,707 bytes

### 优化目标
基于以上数据，主要优化目标应该是:
1. 减少 create721Listing 和 create1155Listing 的 gas 消耗
2. 优化 buyNFT 函数的效率
3. 减少合约部署成本
4. 优化 permitBuy 函数的 gas 使用