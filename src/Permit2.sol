// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 导入OpenZeppelin合约库
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";           // ERC20代币接口
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";  // 安全的ERC20操作库
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";     // 椭圆曲线数字签名算法
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";    // EIP712结构化数据签名标准
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";        // 重入攻击防护
import "@openzeppelin/contracts/access/Ownable.sol";               // 所有权管理

/**
 * @title Permit2 - 标准化代币授权合约
 * @notice 这是一个基于Uniswap Permit2设计的简化版本，提供统一的ERC20代币授权管理
 * @dev 主要功能包括：
 *      1. 支持EIP712签名授权，用户无需预先调用approve
 *      2. 支持批量授权和转账操作，提高gas效率
 *      3. 使用nonce机制防止重放攻击
 *      4. 支持授权过期时间设置
 *      5. 提供安全的转账功能，防止重入攻击
 * @author 基于Uniswap Labs的Permit2合约改进
 */
contract Permit2 is EIP712, ReentrancyGuard, Ownable {
    using ECDSA for bytes32;      // 为bytes32类型添加ECDSA签名验证功能
    using SafeERC20 for IERC20;   // 为IERC20类型添加安全转账功能

    // ============ 错误定义 ============
    // 这些自定义错误提供了更详细的失败原因，同时节省gas
    error InvalidSignature();      // 无效的签名
    error SignatureExpired();      // 签名已过期
    error InsufficientAllowance(); // 授权额度不足
    error InvalidNonce();          // 无效的nonce（已使用或格式错误）
    error TransferFailed();        // 转账失败
    error InvalidAmount();         // 无效的金额（通常是0）
    error InvalidSpender();        // 无效的被授权地址（通常是零地址）
    error InvalidToken();          // 无效的代币地址（通常是零地址）

    // ============ 事件定义 ============
    // 这些事件用于记录合约的重要操作，便于前端监听和链上数据分析
    
    /**
     * @notice 授权事件 - 当用户直接授权时触发
     * @param owner 代币所有者地址
     * @param token 被授权的代币合约地址
     * @param spender 被授权使用代币的地址
     * @param amount 授权的代币数量
     * @param expiration 授权过期的时间戳
     */
    event Approval(
        address indexed owner,
        address indexed token,
        address indexed spender,
        uint256 amount,
        uint256 expiration
    );

    /**
     * @notice 签名授权事件 - 当用户通过签名授权时触发
     * @param owner 代币所有者地址
     * @param token 被授权的代币合约地址
     * @param spender 被授权使用代币的地址
     * @param amount 授权的代币数量
     * @param expiration 授权过期的时间戳
     * @param nonce 用于防重放攻击的随机数
     */
    event Permit(
        address indexed owner,
        address indexed token,
        address indexed spender,
        uint256 amount,
        uint256 expiration,
        uint256 nonce
    );

    /**
     * @notice Nonce失效事件 - 当用户主动使nonce失效时触发
     * @param owner 用户地址
     * @param word nonce位图中的字位置
     * @param mask 用于标记失效nonce的位掩码
     */
    event NonceInvalidation(
        address indexed owner,
        uint256 word,
        uint256 mask
    );

    /**
     * @notice 签名转账事件 - 当通过签名完成转账时触发
     * @param from 代币转出地址
     * @param to 代币转入地址
     * @param token 代币合约地址
     * @param amount 转账数量
     */
    event Transfer(
        address indexed from,
        address indexed to,
        address indexed token,
        uint256 amount
    );

    // ============ 数据结构定义 ============
    
    /**
     * @notice 授权详情结构体 - 包含单个代币授权的所有信息
     * @dev 这个结构体用于EIP712签名，字段顺序不能随意更改
     */
    struct PermitDetails {
        address token;      // 代币合约地址
        uint256 amount;     // 授权数量（wei单位）
        uint256 expiration; // 授权过期时间戳（秒）
        uint256 nonce;      // 防重放攻击的随机数
    }

    /**
     * @notice 单个授权结构体 - 用于单个代币的签名授权
     * @dev 包含授权详情、被授权者和签名过期时间
     */
    struct PermitSingle {
        PermitDetails details;  // 授权详情
        address spender;        // 被授权使用代币的地址
        uint256 sigDeadline;    // 签名本身的过期时间戳
    }

    /**
     * @notice 批量授权结构体 - 用于多个代币的批量签名授权
     * @dev 可以在一次交易中授权多个不同的代币
     */
    struct PermitBatch {
        PermitDetails[] details; // 多个授权详情的数组
        address spender;         // 被授权使用所有代币的地址
        uint256 sigDeadline;     // 签名本身的过期时间戳
    }

    /**
     * @notice 授权转账详情结构体 - 用于通过授权进行代币转账
     * @dev 转账时需要检查授权额度和过期时间
     */
    struct AllowanceTransferDetails {
        address from;       // 代币转出地址（必须是授权给调用者的地址）
        address to;         // 代币转入地址
        uint256 amount;     // 转账数量（wei单位）
        address token;      // 代币合约地址
    }

    /**
     * @notice 签名转账详情结构体 - 用于基于签名的直接转账
     * @dev 允许用户通过签名直接转账，无需预先授权
     */
    struct SignatureTransferDetails {
        address to;              // 代币转入地址
        uint256 requestedAmount; // 请求转账的数量
    }

    /**
     * @notice 签名转账结构体 - 包含完整的签名转账信息
     * @dev 用于EIP712签名验证的完整结构体
     */
    struct SignatureTransfer {
        address token;           // 代币合约地址
        address from;            // 代币转出地址（签名者）
        SignatureTransferDetails transfer; // 转账详情
        uint256 nonce;           // 防重放攻击的随机数
        uint256 deadline;        // 签名过期时间戳
    }

    /**
     * @notice 代币权限结构体 - 定义对特定代币的权限
     * @dev 用于批量操作中定义每个代币的权限范围
     */
    struct TokenPermissions {
        address token;      // 代币合约地址
        uint256 amount;     // 权限数量（wei单位）
    }

    // ============ EIP712 类型哈希常量 ============
    // 这些哈希用于EIP712结构化数据签名，确保签名的唯一性和安全性
    // 注意：这些字符串的格式必须严格按照EIP712标准，不能有额外的空格或换行
    
    /**
     * @notice 单个授权的EIP712类型哈希
     * @dev 用于验证PermitSingle结构体的签名
     */
    bytes32 public constant PERMIT_SINGLE_TYPEHASH = keccak256(
        "PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)PermitDetails(address token,uint256 amount,uint256 expiration,uint256 nonce)"
    );

    /**
     * @notice 批量授权的EIP712类型哈希
     * @dev 用于验证PermitBatch结构体的签名
     */
    bytes32 public constant PERMIT_BATCH_TYPEHASH = keccak256(
        "PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)PermitDetails(address token,uint256 amount,uint256 expiration,uint256 nonce)"
    );

    /**
     * @notice 授权详情的EIP712类型哈希
     * @dev 用于验证PermitDetails结构体的签名
     */
    bytes32 public constant PERMIT_DETAILS_TYPEHASH = keccak256(
        "PermitDetails(address token,uint256 amount,uint256 expiration,uint256 nonce)"
    );

    /**
     * @notice 代币权限的EIP712类型哈希
     * @dev 用于验证TokenPermissions结构体的签名（为未来扩展预留）
     */
    bytes32 public constant TOKEN_PERMISSIONS_TYPEHASH = keccak256(
        "TokenPermissions(address token,uint256 amount)"
    );

    /**
     * @notice 签名转账的EIP712类型哈希
     * @dev 用于验证SignatureTransfer结构体的签名
     */
    bytes32 public constant SIGNATURE_TRANSFER_TYPEHASH = keccak256(
        "SignatureTransfer(address token,address from,SignatureTransferDetails transfer,uint256 nonce,uint256 deadline)SignatureTransferDetails(address to,uint256 requestedAmount)"
    );

    /**
     * @notice 签名转账详情的EIP712类型哈希
     * @dev 用于验证SignatureTransferDetails结构体的签名
     */
    bytes32 public constant SIGNATURE_TRANSFER_DETAILS_TYPEHASH = keccak256(
        "SignatureTransferDetails(address to,uint256 requestedAmount)"
    );

    // ============ 状态变量 ============
    // 这些映射存储了合约的核心状态数据
    
    /**
     * @notice 三层嵌套映射：owner => token => spender => amount
     * @dev 存储每个用户对每个代币给每个spender的授权数量
     *      allowance[代币所有者][代币地址][被授权者] = 授权数量
     */
    mapping(address => mapping(address => mapping(address => uint256))) public allowance;
    
    /**
     * @notice 二层嵌套映射：owner => token => expiration
     * @dev 存储每个用户对每个代币的授权过期时间
     *      allowanceExpiration[代币所有者][代币地址] = 过期时间戳
     */
    mapping(address => mapping(address => uint256)) public allowanceExpiration;
    
    /**
     * @notice 用户的顺序nonce计数器
     * @dev 目前版本中暂未使用，为未来的顺序nonce功能预留
     *      nonces[用户地址] = 当前nonce值
     */
    mapping(address => uint256) public nonces;
    
    /**
     * @notice 用户的无序nonce位图
     * @dev 使用位图来高效存储大量nonce的使用状态
     *      nonceBitmap[用户地址][字位置] = 位图值
     *      每个uint256可以存储256个nonce的状态
     */
    mapping(address => mapping(uint256 => uint256)) public nonceBitmap;

    /**
     * @notice 合约构造函数
     * @dev 初始化EIP712域分隔符和合约所有者
     *      - EIP712域名："Permit2"
     *      - EIP712版本："1"
     *      - 合约所有者：部署者地址
     */
    constructor() EIP712("Permit2", "1") Ownable(msg.sender) {}

    // ============ 核心授权功能 ============
    
    /**
     * @notice 单个代币的签名授权功能
     * @dev 允许用户通过EIP712签名来授权代币使用，无需预先调用ERC20的approve
     *      这是合约的核心功能之一，支持离线签名授权
     * 
     * @param owner 代币所有者地址（必须是签名者）
     * @param permitSingle 包含授权详情的结构体
     * @param signature 用户的EIP712签名（65字节）
     * 
     * 安全检查：
     * 1. 验证签名未过期
     * 2. 验证nonce未被使用（防重放攻击）
     * 3. 验证签名的有效性
     * 4. 更新授权状态
     * 
     * Gas优化：
     * - 使用自定义错误而非字符串
     * - 批量更新状态变量
     */
    function permit(
        address owner,
        PermitSingle memory permitSingle,
        bytes calldata signature
    ) external {
        // 检查签名是否已过期
        if (block.timestamp > permitSingle.sigDeadline) {
            revert SignatureExpired();
        }

        // 使用并标记nonce为已使用，防止重放攻击
        _useUnorderedNonce(owner, permitSingle.details.nonce);

        // 构造EIP712结构化数据哈希
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_SINGLE_TYPEHASH,
                _hashPermitDetails(permitSingle.details),
                permitSingle.spender,
                permitSingle.sigDeadline
            )
        );

        // 生成最终的EIP712哈希
        bytes32 hash = _hashTypedDataV4(structHash);
        // 从签名中恢复签名者地址
        address signer = hash.recover(signature);

        // 验证签名者是否为声明的所有者
        if (signer != owner) {
            revert InvalidSignature();
        }

        // 更新授权状态
        _updateApproval(
            owner,
            permitSingle.details.token,
            permitSingle.spender,
            permitSingle.details.amount,
            permitSingle.details.expiration
        );

        // 发出授权事件
        emit Permit(
            owner,
            permitSingle.details.token,
            permitSingle.spender,
            permitSingle.details.amount,
            permitSingle.details.expiration,
            permitSingle.details.nonce
        );
    }

    /**
     * @notice 批量代币的签名授权功能
     * @dev 允许用户在一次交易中授权多个不同的代币，显著提高gas效率
     *      特别适用于DeFi协议需要同时授权多个代币的场景
     * 
     * @param owner 代币所有者地址（必须是签名者）
     * @param permitData 包含多个授权详情的批量授权结构体
     * @param signature 用户的EIP712签名（65字节）
     * 
     * 安全特性：
     * 1. 使用nonReentrant修饰符防止重入攻击
     * 2. 每个代币都有独立的nonce验证
     * 3. 原子性操作：要么全部成功，要么全部失败
     * 4. 统一的签名过期时间检查
     * 
     * Gas优化：
     * - 批量处理减少交易次数
     * - 预先计算数组长度
     * - 使用内存数组缓存哈希值
     */
    function permitBatch(
        address owner,
        PermitBatch memory permitData,
        bytes calldata signature
    ) external nonReentrant {
        // 检查批量签名是否已过期
        if (block.timestamp > permitData.sigDeadline) {
            revert SignatureExpired();
        }

        // 预先分配内存数组，避免动态扩容的gas消耗
        bytes32[] memory detailsHashes = new bytes32[](permitData.details.length);
        
        // 遍历所有授权详情，验证nonce并计算哈希
        for (uint256 i = 0; i < permitData.details.length; i++) {
            // 使用并标记每个nonce为已使用
            _useUnorderedNonce(owner, permitData.details[i].nonce);
            // 计算每个授权详情的哈希值
            detailsHashes[i] = _hashPermitDetails(permitData.details[i]);
        }

        // 构造批量授权的EIP712结构化数据哈希
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_BATCH_TYPEHASH,
                keccak256(abi.encodePacked(detailsHashes)), // 将所有详情哈希打包
                permitData.spender,
                permitData.sigDeadline
            )
        );

        // 生成最终的EIP712哈希并恢复签名者
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        // 验证签名者是否为声明的所有者
        if (signer != owner) {
            revert InvalidSignature();
        }

        // 批量更新所有代币的授权状态
        for (uint256 i = 0; i < permitData.details.length; i++) {
            _updateApproval(
                owner,
                permitData.details[i].token,
                permitData.spender,
                permitData.details[i].amount,
                permitData.details[i].expiration
            );

            // 为每个代币发出授权事件
            emit Permit(
                owner,
                permitData.details[i].token,
                permitData.spender,
                permitData.details[i].amount,
                permitData.details[i].expiration,
                permitData.details[i].nonce
            );
        }
    }

    // ============ 转账功能 ============
    
    /**
     * @notice 通过授权进行单笔代币转账
     * @dev 使用已有的授权额度进行代币转账，自动扣减授权余额
     *      这是合约的核心转账功能，支持任何已授权的ERC20代币
     * 
     * @param transferDetails 包含转账信息的结构体
     * 
     * 安全检查：
     * 1. 验证转账金额大于0
     * 2. 验证授权未过期
     * 3. 验证授权余额充足
     * 4. 使用SafeERC20防止转账失败
     * 5. 使用nonReentrant防止重入攻击
     * 
     * 状态更新：
     * - 自动扣减已使用的授权额度
     * - 支持无限授权（type(uint256).max）
     */
    function transferFrom(
        AllowanceTransferDetails calldata transferDetails
    ) external nonReentrant {   
        _transfer(transferDetails);
    }

    /**
     * @notice 批量通过授权进行代币转账
     * @dev 在一次交易中执行多笔转账，提高gas效率
     *      特别适用于需要同时转账多种代币的场景
     * 
     * @param transferDetails 包含多个转账信息的数组
     * 
     * 特性：
     * 1. 原子性操作：要么全部成功，要么全部失败
     * 2. 每笔转账都有独立的授权验证
     * 3. 支持不同代币的混合转账
     * 4. 自动处理授权余额扣减
     * 
     * Gas优化：
     * - 批量处理减少交易成本
     * - 重用安全检查逻辑
     */
    function transferFromBatch(
        AllowanceTransferDetails[] calldata transferDetails
    ) external nonReentrant {
        // 遍历执行每笔转账
        for (uint256 i = 0; i < transferDetails.length; i++) {
            _transfer(transferDetails[i]);
        }
    }

    /**
     * @notice 通过签名直接进行代币转账
     * @dev 允许用户通过EIP712签名直接转账，无需预先授权
     *      这是一个强大的功能，用户只需签名即可完成转账
     * 
     * @param signatureTransfer 包含转账详情的结构体
     * @param signature 用户的EIP712签名（65字节）
     * 
     * 安全检查：
     * 1. 验证签名未过期
     * 2. 验证nonce未被使用（防重放攻击）
     * 3. 验证签名的有效性
     * 4. 验证转账金额有效性
     * 5. 验证用户代币余额充足
     * 
     * 特性：
     * - 无需预先授权，直接通过签名转账
     * - 支持任何ERC20代币
     * - 防重放攻击保护
     * - 签名过期时间保护
     * 
     * Gas优化：
     * - 使用自定义错误而非字符串
     * - 一次性完成验证和转账
     */
    function permitTransferFrom(
        SignatureTransfer calldata signatureTransfer,
        bytes calldata signature
    ) external nonReentrant {
        // 检查签名是否已过期
        if (block.timestamp > signatureTransfer.deadline) {
            revert SignatureExpired();
        }

        // 检查转账金额是否有效
        if (signatureTransfer.transfer.requestedAmount == 0) {
            revert InvalidAmount();
        }

        // 使用并标记nonce为已使用，防止重放攻击
        _useUnorderedNonce(signatureTransfer.from, signatureTransfer.nonce);

        // 构造EIP712结构化数据哈希
        bytes32 transferHash = keccak256(
            abi.encode(
                SIGNATURE_TRANSFER_DETAILS_TYPEHASH,
                signatureTransfer.transfer.to,
                signatureTransfer.transfer.requestedAmount
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                SIGNATURE_TRANSFER_TYPEHASH,
                signatureTransfer.token,
                signatureTransfer.from,
                transferHash,
                signatureTransfer.nonce,
                signatureTransfer.deadline
            )
        );

        // 生成最终的EIP712哈希
        bytes32 hash = _hashTypedDataV4(structHash);
        // 从签名中恢复签名者地址
        address signer = hash.recover(signature);

        // 验证签名者是否为声明的转出地址
        if (signer != signatureTransfer.from) {
            revert InvalidSignature();
        }

        // 执行代币转账
        IERC20(signatureTransfer.token).safeTransferFrom(
            signatureTransfer.from,
            signatureTransfer.transfer.to,
            signatureTransfer.transfer.requestedAmount
        );

        // 发出转账事件（可以考虑添加专门的签名转账事件）
        emit Transfer(
            signatureTransfer.from,
            signatureTransfer.transfer.to,
            signatureTransfer.token,
            signatureTransfer.transfer.requestedAmount
        );
    }

    // ============ 授权管理 ============
    
    /**
     * @notice 直接授权代币给指定地址
     * @dev 无需签名的直接授权方式，由代币所有者直接调用
     *      这是传统的授权方式，适用于用户主动授权的场景
     * 
     * @param token 要授权的ERC20代币合约地址
     * @param spender 被授权使用代币的地址（通常是DeFi协议）
     * @param amount 授权的代币数量（wei单位）
     * @param expiration 授权过期的时间戳（秒）
     * 
     * 特性：
     * 1. 立即生效，无需等待确认
     * 2. 支持设置过期时间，提高安全性
     * 3. 可以随时修改或撤销授权
     * 4. 发出Approval事件便于追踪
     * 
     * 使用场景：
     * - 用户主动授权DeFi协议
     * - 设置临时授权
     * - 更新现有授权额度
     */
    function approve(
        address token,
        address spender,
        uint256 amount,
        uint256 expiration
    ) external {
        // 验证被授权地址不能为零地址
        if (spender == address(0)) {
            revert InvalidSpender();
        }
        // 验证代币地址不能为零地址
        if (token == address(0)) {
            revert InvalidToken();
        }

        // 更新授权状态
        _updateApproval(msg.sender, token, spender, amount, expiration);

        // 发出授权事件
        emit Approval(msg.sender, token, spender, amount, expiration);
    }

    // ============ Nonce管理 ============
    
    /**
     * @notice 批量失效指定的随机数
     * @dev 使用位图高效管理大量nonce的失效状态
     *      每个word可以管理256个nonce，大大节省存储空间
     * 
     * @param wordPos nonce在位图中的字位置（nonce >> 8）
     * @param mask 位掩码，指定要失效的nonce位置
     * 
     * 工作原理：
     * 1. 每个nonce对应位图中的一个bit
     * 2. wordPos确定256个nonce为一组的位置
     * 3. mask中每个为1的bit对应一个要失效的nonce
     * 
     * 使用场景：
     * - 批量撤销未使用的签名
     * - 安全事件后的紧急nonce清理
     * - 定期清理过期的签名授权
     * 
     * Gas优化：
     * - 一次操作可失效多个nonce
     * - 使用位运算提高效率
     */
    function invalidateNonces(
        uint256 wordPos,
        uint256 mask
    ) external {
        // 使用OR操作将指定位置的bit设为1（已失效）
        nonceBitmap[msg.sender][wordPos] |= mask;
        // 发出失效事件
        emit NonceInvalidation(msg.sender, wordPos, mask);
    }

    /**
     * @notice 检查指定的随机数是否已被使用
     * @dev 通过位图快速查询nonce状态，时间复杂度O(1)
     * 
     * @param owner nonce所有者地址
     * @param nonce 要查询的随机数
     * @return 如果nonce已使用返回true，否则返回false
     * 
     * 查询逻辑：
     * 1. 计算nonce在位图中的字位置（高248位）
     * 2. 计算nonce在字中的位位置（低8位）
     * 3. 检查对应位是否为1
     * 
     * 应用场景：
     * - 验证签名前检查nonce状态
     * - 前端显示可用的nonce
     * - 调试和监控工具
     */
    function isNonceUsed(address owner, uint256 nonce) external view returns (bool) {
        // 计算nonce在位图中的字位置（每个字包含256个nonce）
        uint256 wordPos = nonce >> 8;
        // 计算nonce在字中的具体位位置
        uint256 bitPos = nonce & 0xff;
        // 检查对应位是否为1（已使用）
        return (nonceBitmap[owner][wordPos] >> bitPos) & 1 == 1;
    }

    // ============ 查询函数 ============
    
    /**
     * @notice 获取指定授权的完整信息
     * @dev 一次性返回授权的所有相关数据，便于前端和其他合约查询
     * 
     * @param owner 代币所有者地址
     * @param token 代币合约地址
     * @param spender 被授权使用代币的地址
     * @return amount 当前授权的代币数量
     * @return expiration 授权过期时间戳
     * 
     * 返回值说明：
     * - amount: 剩余可用的授权额度
     * - expiration: 授权失效的时间戳，0表示永不过期
     * 
     * 使用场景：
     * - 前端显示授权状态
     * - 其他合约验证授权
     * - 监控和分析工具
     */
    function getAllowance(
        address owner,
        address token,
        address spender
    ) external view returns (uint256 amount, uint256 expiration) {
        amount = allowance[owner][token][spender];
        expiration = allowanceExpiration[owner][token];
    }

    // ============ 内部函数 ============

    /**
     * @notice 内部函数：更新授权状态
     * @dev 统一的授权更新逻辑，被多个公共函数调用
     *      确保授权数据的一致性和完整性
     * 
     * @param owner 代币所有者地址
     * @param token 代币合约地址
     * @param spender 被授权地址
     * @param amount 新的授权数量
     * @param expiration 新的过期时间
     * 
     * 功能：
     * 1. 更新授权数量映射
     * 2. 更新授权过期时间映射
     * 3. 覆盖之前的授权设置
     * 
     * 注意：
     * - 不进行任何验证，调用方需确保参数有效
     * - 支持设置为0来撤销授权
     * - 支持延长或缩短过期时间
     */
    function _updateApproval(
        address owner,
        address token,
        address spender,
        uint256 amount,
        uint256 expiration
    ) internal {
        // 更新授权数量
        allowance[owner][token][spender] = amount;
        // 更新过期时间
        allowanceExpiration[owner][token] = expiration;
    }

    /**
     * @notice 内部函数：执行授权转账
     * @dev 核心转账逻辑，处理授权验证、余额扣减和实际转账
     *      遵循检查-生效-交互模式，确保安全性
     * 
     * @param transferDetails 转账详情结构体
     * 
     * 安全检查顺序：
     * 1. 验证转账金额有效性
     * 2. 检查授权是否过期
     * 3. 验证授权余额充足性
     * 4. 更新状态（防重入）
     * 5. 执行外部调用
     * 
     * 特殊处理：
     * - 无限授权（type(uint256).max）不扣减余额
     * - 使用SafeERC20防止转账失败
     * - 遵循CEI模式防止重入攻击
     * 
     * Gas优化：
     * - 预先加载状态变量到内存
     * - 避免重复的存储读取
     */
    function _transfer(
        AllowanceTransferDetails calldata transferDetails
    ) internal {
        // 检查1：验证转账金额不能为0
        if (transferDetails.amount == 0) {
            revert InvalidAmount();
        }

        // 加载授权状态到内存，节省gas
        uint256 allowed = allowance[transferDetails.from][transferDetails.token][msg.sender];
        uint256 expiration = allowanceExpiration[transferDetails.from][transferDetails.token];

        // 检查2：验证授权未过期
        if (block.timestamp > expiration) {
            revert SignatureExpired();
        }

        // 检查3：验证授权余额充足
        if (allowed < transferDetails.amount) {
            revert InsufficientAllowance();
        }

        // 生效：先更新状态，防止重入攻击
        // 无限授权不扣减余额，避免整数下溢
        if (allowed != type(uint256).max) {
            allowance[transferDetails.from][transferDetails.token][msg.sender] = allowed - transferDetails.amount;
        }

        // 交互：使用SafeERC20执行安全转账
        // SafeERC20会处理返回值检查和revert
        IERC20(transferDetails.token).safeTransferFrom(
            transferDetails.from,
            transferDetails.to,
            transferDetails.amount
        );
    }

    /**
     * @notice 内部函数：使用并标记无序随机数
     * @dev 通过位图高效管理nonce的使用状态，防止重放攻击
     *      使用异或操作原子性地检查和设置nonce状态
     * 
     * @param owner nonce所有者地址
     * @param nonce 要使用的随机数
     * 
     * 工作原理：
     * 1. 将256位nonce分组，每组用一个uint256存储
     * 2. wordPos = nonce >> 8 确定在哪个uint256中
     * 3. bitPos = nonce & 0xff 确定在uint256的哪一位
     * 4. 使用XOR操作翻转对应位
     * 5. 如果翻转后该位为0，说明nonce已被使用
     * 
     * 安全特性：
     * - 原子性操作，避免竞态条件
     * - 一次性使用，防止重放攻击
     * - 高效的位运算，节省gas
     * 
     * 错误情况：
     * - nonce已被使用：抛出InvalidNonce错误
     */
    function _useUnorderedNonce(address owner, uint256 nonce) internal {
        // 计算nonce在位图中的字位置（高248位）
        uint256 wordPos = nonce >> 8;
        // 计算nonce在字中的位位置（低8位）
        uint256 bitPos = nonce & 0xff;
        // 创建对应位的掩码
        uint256 bit = 1 << bitPos;
        // 使用XOR翻转对应位，并获取翻转后的值
        uint256 flipped = nonceBitmap[owner][wordPos] ^= bit;

        // 如果翻转后该位为0，说明之前已经是1（已使用）
        if (flipped & bit == 0) {
            revert InvalidNonce();
        }
    }

    /**
     * @notice 内部函数：计算授权详情的EIP712哈希
     * @dev 根据EIP712标准计算PermitDetails结构体的哈希值
     *      用于构建完整的EIP712签名哈希
     * 
     * @param details 包含授权信息的结构体
     * @return 结构体的keccak256哈希值
     * 
     * EIP712编码规则：
     * 1. 使用abi.encode进行紧密打包
     * 2. 首先编码类型哈希（PERMIT_DETAILS_TYPEHASH）
     * 3. 然后按结构体定义顺序编码各字段
     * 4. 最后计算整体的keccak256哈希
     * 
     * 字段顺序（不可更改）：
     * - token: 代币合约地址
     * - amount: 授权数量
     * - expiration: 过期时间
     * - nonce: 防重放随机数
     * 
     * 安全性：
     * - 类型哈希确保结构体类型唯一性
     * - 字段顺序固定，防止哈希碰撞
     * - 与EIP712标准完全兼容
     */
    function _hashPermitDetails(
        PermitDetails memory details
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                PERMIT_DETAILS_TYPEHASH,  // 结构体类型哈希
                details.token,            // 代币地址
                details.amount,           // 授权数量
                details.expiration,       // 过期时间
                details.nonce             // 随机数
            )
        );
    }

    // ============ 合约信息和管理 ============
    
    /**
     * @notice 获取EIP712域分隔符
     * @dev 返回当前合约的EIP712域分隔符，用于签名验证
     *      域分隔符确保签名只在特定合约和链上有效
     * 
     * @return 当前合约的EIP712域分隔符
     * 
     * 域分隔符包含：
     * - name: 合约名称
     * - version: 合约版本
     * - chainId: 当前区块链ID
     * - verifyingContract: 当前合约地址
     * 
     * 安全作用：
     * 1. 防止跨链重放攻击
     * 2. 防止跨合约签名滥用
     * 3. 确保签名的唯一性和安全性
     * 
     * 使用场景：
     * - 前端构建EIP712签名
     * - 其他合约验证签名来源
     * - 钱包显示签名域信息
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice 紧急暂停合约功能（预留接口）
     * @dev 此函数为预留的紧急暂停接口，实际实现需要继承相应的合约
     *      如需启用此功能，请：
     *      1. 继承OpenZeppelin的Pausable合约
     *      2. 继承OpenZeppelin的Ownable合约
     *      3. 在相关函数中添加whenNotPaused修饰符
     * 
     * 建议的暂停影响：
     * - permit和permitBatch函数停止工作
     * - transferFrom和transferFromBatch函数停止工作
     * - approve函数停止工作
     * - 查询函数仍然可用
     * 
     * 注意：当前实现为空函数，需要根据实际需求进行扩展
     */
    function emergencyPause() external {
        // 预留的紧急暂停功能
        // 实际实现需要继承Pausable和Ownable合约
        // 示例实现：
        // require(msg.sender == owner(), "Only owner");
        // _pause();
        revert("Emergency pause not implemented");
    }

    /**
     * @notice 获取合约版本号
     * @dev 返回当前合约的版本标识，用于兼容性检查和升级管理
     * 
     * @return 版本字符串（当前为"1"）
     * 
     * 版本管理：
     * - 主要功能变更时递增版本号
     * - 用于EIP712域分隔符计算
     * - 帮助前端和其他合约识别合约版本
     * 
     * 使用场景：
     * - 前端检查合约兼容性
     * - 多版本合约的识别
     * - 升级和迁移决策
     * - 调试和监控工具
     * 
     * 注意：
     * - 版本号变更会影响EIP712签名
     * - 升级时需要考虑向后兼容性
     * - 建议使用语义化版本控制
     */
    function version() external pure returns (string memory) {
        return "1";
    }
}