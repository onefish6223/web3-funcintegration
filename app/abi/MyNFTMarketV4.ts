export const MyNFTMarketV4_ABI = [
  {
      "type": "constructor",
      "inputs": [{"name": "_signer", "type": "address", "internalType": "address"}],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "PERMIT_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "buyNFT",
      "inputs": [
        {"name": "listingId", "type": "uint256", "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "cancelListing",
      "inputs": [{"name": "listingId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "create1155Listing",
      "inputs": [
        {"name": "nftContract", "type": "address", "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
        {"name": "price", "type": "uint256", "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "create721Listing",
      "inputs": [
        {"name": "nftContract", "type": "address", "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
        {"name": "price", "type": "uint256", "internalType": "uint256"},
        {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "eip712Domain",
      "inputs": [],
      "outputs": [
        {"name": "fields", "type": "bytes1", "internalType": "bytes1"},
        {"name": "name", "type": "string", "internalType": "string"},
        {"name": "version", "type": "string", "internalType": "string"},
        {"name": "chainId", "type": "uint256", "internalType": "uint256"},
        {"name": "verifyingContract", "type": "address", "internalType": "address"},
        {"name": "salt", "type": "bytes32", "internalType": "bytes32"},
        {"name": "extensions", "type": "uint256[]", "internalType": "uint256[]"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feeReceiver",
      "inputs": [],
      "outputs": [{"name": "", "type": "address", "internalType": "address"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getLatestListings",
      "inputs": [{"name": "count", "type": "uint256", "internalType": "uint256"}],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "internalType": "struct MyNFTMarketV4.Listing[]",
          "components": [
            {"name": "id", "type": "uint256", "internalType": "uint256"},
            {"name": "nftContract", "type": "address", "internalType": "address"},
            {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
            {"name": "tokenType", "type": "uint8", "internalType": "enum MyNFTMarketV4.TokenType"},
            {"name": "seller", "type": "address", "internalType": "address"},
            {"name": "buyer", "type": "address", "internalType": "address"},
            {"name": "price", "type": "uint256", "internalType": "uint256"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "active", "type": "bool", "internalType": "bool"},
            {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getNFTListing",
      "inputs": [
        {"name": "nftContract", "type": "address", "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct MyNFTMarketV4.Listing",
          "components": [
            {"name": "id", "type": "uint256", "internalType": "uint256"},
            {"name": "nftContract", "type": "address", "internalType": "address"},
            {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
            {"name": "tokenType", "type": "uint8", "internalType": "enum MyNFTMarketV4.TokenType"},
            {"name": "seller", "type": "address", "internalType": "address"},
            {"name": "buyer", "type": "address", "internalType": "address"},
            {"name": "price", "type": "uint256", "internalType": "uint256"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "active", "type": "bool", "internalType": "bool"},
            {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUserListings",
      "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "internalType": "struct MyNFTMarketV4.Listing[]",
          "components": [
            {"name": "id", "type": "uint256", "internalType": "uint256"},
            {"name": "nftContract", "type": "address", "internalType": "address"},
            {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
            {"name": "tokenType", "type": "uint8", "internalType": "enum MyNFTMarketV4.TokenType"},
            {"name": "seller", "type": "address", "internalType": "address"},
            {"name": "buyer", "type": "address", "internalType": "address"},
            {"name": "price", "type": "uint256", "internalType": "uint256"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "active", "type": "bool", "internalType": "bool"},
            {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hashTypedDataV4",
      "inputs": [{"name": "structHash", "type": "bytes32", "internalType": "bytes32"}],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listings",
      "inputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "outputs": [
        {"name": "id", "type": "uint256", "internalType": "uint256"},
        {"name": "nftContract", "type": "address", "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
        {"name": "tokenType", "type": "uint8", "internalType": "enum MyNFTMarketV4.TokenType"},
        {"name": "seller", "type": "address", "internalType": "address"},
        {"name": "buyer", "type": "address", "internalType": "address"},
        {"name": "price", "type": "uint256", "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "active", "type": "bool", "internalType": "bool"},
        {"name": "requiresWhitelist", "type": "bool", "internalType": "bool"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "nftToListingId",
      "inputs": [
        {"name": "", "type": "address", "internalType": "address"},
        {"name": "", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "nonces",
      "inputs": [{"name": "", "type": "address", "internalType": "address"}],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [{"name": "", "type": "address", "internalType": "address"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "permitBuy",
      "inputs": [
        {"name": "listingId", "type": "uint256", "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "deadline", "type": "uint256", "internalType": "uint256"},
        {"name": "v", "type": "uint8", "internalType": "uint8"},
        {"name": "r", "type": "bytes32", "internalType": "bytes32"},
        {"name": "s", "type": "bytes32", "internalType": "bytes32"}
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "platformFeePercentage",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {"type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable"},
    {
      "type": "function",
      "name": "setFeeReceiver",
      "inputs": [{"name": "newFeeReceiver", "type": "address", "internalType": "address"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPlatformFeePercentage",
      "inputs": [{"name": "newFeePercentage", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setSigner",
      "inputs": [{"name": "_signer", "type": "address", "internalType": "address"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "signer",
      "inputs": [],
      "outputs": [{"name": "", "type": "address", "internalType": "address"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [{"name": "newOwner", "type": "address", "internalType": "address"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "usedSignatures",
      "inputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {"type": "event", "name": "EIP712DomainChanged", "inputs": [], "anonymous": false},
    {
      "type": "event",
      "name": "FeeReceiverUpdated",
      "inputs": [
        {"name": "newFeeReceiver", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ListingCancelled",
      "inputs": [
        {"name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "nftContract", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "tokenType", "type": "uint8", "indexed": false, "internalType": "enum MyNFTMarketV4.TokenType"},
        {"name": "seller", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ListingCreated",
      "inputs": [
        {"name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "nftContract", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "tokenType", "type": "uint8", "indexed": false, "internalType": "enum MyNFTMarketV4.TokenType"},
        {"name": "seller", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "price", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "requiresWhitelist", "type": "bool", "indexed": false, "internalType": "bool"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NFTPurchased",
      "inputs": [
        {"name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "nftContract", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "tokenType", "type": "uint8", "indexed": false, "internalType": "enum MyNFTMarketV4.TokenType"},
        {"name": "seller", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "buyer", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "price", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "platformFee", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "isPermitBuy", "type": "bool", "indexed": false, "internalType": "bool"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {"name": "previousOwner", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "newOwner", "type": "address", "indexed": true, "internalType": "address"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PlatformFeeUpdated",
      "inputs": [
        {"name": "newFeePercentage", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SignerUpdated",
      "inputs": [
        {"name": "newSigner", "type": "address", "indexed": false, "internalType": "address"},
        {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {"type": "error", "name": "ECDSAInvalidSignature", "inputs": []},
    {
      "type": "error",
      "name": "ECDSAInvalidSignatureLength",
      "inputs": [{"name": "length", "type": "uint256", "internalType": "uint256"}]
    },
    {
      "type": "error",
      "name": "ECDSAInvalidSignatureS",
      "inputs": [{"name": "s", "type": "bytes32", "internalType": "bytes32"}]
    },
    {"type": "error", "name": "InvalidShortString", "inputs": []},
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [{"name": "owner", "type": "address", "internalType": "address"}]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [{"name": "account", "type": "address", "internalType": "address"}]
    },
    {"type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": []},
    {"type": "error", "name": "StringTooLong", "inputs": [{"name": "str", "type": "string", "internalType": "string"}]}
] as const;
