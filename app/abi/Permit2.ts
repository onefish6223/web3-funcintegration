export const Permit2_ABI = [
  {"type": "constructor", "inputs": [], "stateMutability": "nonpayable"},
    {
      "type": "function",
      "name": "DOMAIN_SEPARATOR",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "PERMIT_BATCH_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "PERMIT_DETAILS_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "PERMIT_SINGLE_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "SIGNATURE_TRANSFER_DETAILS_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "SIGNATURE_TRANSFER_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "TOKEN_PERMISSIONS_TYPEHASH",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "allowance",
      "inputs": [
        {"name": "", "type": "address", "internalType": "address"},
        {"name": "", "type": "address", "internalType": "address"},
        {"name": "", "type": "address", "internalType": "address"}
      ],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "allowanceExpiration",
      "inputs": [
        {"name": "", "type": "address", "internalType": "address"},
        {"name": "", "type": "address", "internalType": "address"}
      ],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "approve",
      "inputs": [
        {"name": "token", "type": "address", "internalType": "address"},
        {"name": "spender", "type": "address", "internalType": "address"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "expiration", "type": "uint256", "internalType": "uint256"}
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
    {"type": "function", "name": "emergencyPause", "inputs": [], "outputs": [], "stateMutability": "pure"},
    {
      "type": "function",
      "name": "getAllowance",
      "inputs": [
        {"name": "owner", "type": "address", "internalType": "address"},
        {"name": "token", "type": "address", "internalType": "address"},
        {"name": "spender", "type": "address", "internalType": "address"}
      ],
      "outputs": [
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "expiration", "type": "uint256", "internalType": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "invalidateNonces",
      "inputs": [
        {"name": "wordPos", "type": "uint256", "internalType": "uint256"},
        {"name": "mask", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "isNonceUsed",
      "inputs": [
        {"name": "owner", "type": "address", "internalType": "address"},
        {"name": "nonce", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "nonceBitmap",
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
      "name": "permit",
      "inputs": [
        {"name": "owner", "type": "address", "internalType": "address"},
        {
          "name": "permitSingle",
          "type": "tuple",
          "internalType": "struct Permit2.PermitSingle",
          "components": [
            {
              "name": "details",
              "type": "tuple",
              "internalType": "struct Permit2.PermitDetails",
              "components": [
                {"name": "token", "type": "address", "internalType": "address"},
                {"name": "amount", "type": "uint256", "internalType": "uint256"},
                {"name": "expiration", "type": "uint256", "internalType": "uint256"},
                {"name": "nonce", "type": "uint256", "internalType": "uint256"}
              ]
            },
            {"name": "spender", "type": "address", "internalType": "address"},
            {"name": "sigDeadline", "type": "uint256", "internalType": "uint256"}
          ]
        },
        {"name": "signature", "type": "bytes", "internalType": "bytes"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "permitBatch",
      "inputs": [
        {"name": "owner", "type": "address", "internalType": "address"},
        {
          "name": "permitData",
          "type": "tuple",
          "internalType": "struct Permit2.PermitBatch",
          "components": [
            {
              "name": "details",
              "type": "tuple[]",
              "internalType": "struct Permit2.PermitDetails[]",
              "components": [
                {"name": "token", "type": "address", "internalType": "address"},
                {"name": "amount", "type": "uint256", "internalType": "uint256"},
                {"name": "expiration", "type": "uint256", "internalType": "uint256"},
                {"name": "nonce", "type": "uint256", "internalType": "uint256"}
              ]
            },
            {"name": "spender", "type": "address", "internalType": "address"},
            {"name": "sigDeadline", "type": "uint256", "internalType": "uint256"}
          ]
        },
        {"name": "signature", "type": "bytes", "internalType": "bytes"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "permitTransferFrom",
      "inputs": [
        {
          "name": "signatureTransfer",
          "type": "tuple",
          "internalType": "struct Permit2.SignatureTransfer",
          "components": [
            {"name": "token", "type": "address", "internalType": "address"},
            {"name": "from", "type": "address", "internalType": "address"},
            {
              "name": "transfer",
              "type": "tuple",
              "internalType": "struct Permit2.SignatureTransferDetails",
              "components": [
                {"name": "to", "type": "address", "internalType": "address"},
                {"name": "requestedAmount", "type": "uint256", "internalType": "uint256"}
              ]
            },
            {"name": "nonce", "type": "uint256", "internalType": "uint256"},
            {"name": "deadline", "type": "uint256", "internalType": "uint256"}
          ]
        },
        {"name": "signature", "type": "bytes", "internalType": "bytes"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {"type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable"},
    {
      "type": "function",
      "name": "transferFrom",
      "inputs": [
        {
          "name": "transferDetails",
          "type": "tuple",
          "internalType": "struct Permit2.AllowanceTransferDetails",
          "components": [
            {"name": "from", "type": "address", "internalType": "address"},
            {"name": "to", "type": "address", "internalType": "address"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "token", "type": "address", "internalType": "address"}
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferFromBatch",
      "inputs": [
        {
          "name": "transferDetails",
          "type": "tuple[]",
          "internalType": "struct Permit2.AllowanceTransferDetails[]",
          "components": [
            {"name": "from", "type": "address", "internalType": "address"},
            {"name": "to", "type": "address", "internalType": "address"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "token", "type": "address", "internalType": "address"}
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
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
      "name": "version",
      "inputs": [],
      "outputs": [{"name": "", "type": "string", "internalType": "string"}],
      "stateMutability": "pure"
    },
    {
      "type": "event",
      "name": "Approval",
      "inputs": [
        {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "token", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "spender", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "expiration", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {"type": "event", "name": "EIP712DomainChanged", "inputs": [], "anonymous": false},
    {
      "type": "event",
      "name": "NonceInvalidation",
      "inputs": [
        {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "word", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "mask", "type": "uint256", "indexed": false, "internalType": "uint256"}
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
      "name": "Permit",
      "inputs": [
        {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "token", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "spender", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "expiration", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "nonce", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Transfer",
      "inputs": [
        {"name": "from", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "to", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "token", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"}
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
    {"type": "error", "name": "InsufficientAllowance", "inputs": []},
    {"type": "error", "name": "InvalidAmount", "inputs": []},
    {"type": "error", "name": "InvalidNonce", "inputs": []},
    {"type": "error", "name": "InvalidShortString", "inputs": []},
    {"type": "error", "name": "InvalidSignature", "inputs": []},
    {"type": "error", "name": "InvalidSpender", "inputs": []},
    {"type": "error", "name": "InvalidToken", "inputs": []},
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
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [{"name": "token", "type": "address", "internalType": "address"}]
    },
    {"type": "error", "name": "SignatureExpired", "inputs": []},
    {"type": "error", "name": "StringTooLong", "inputs": [{"name": "str", "type": "string", "internalType": "string"}]},
    {"type": "error", "name": "TransferFailed", "inputs": []}
] as const;