// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./IPermit2.sol";

/**
 * @title MyTokenBankV4
 * @dev 支持以太币和ERC20、ERC20Permit、ERC1363代币的银行合约
 */
contract MyTokenBankV4 is ReentrancyGuard, EIP712 {
    // 链表节点结构
    struct ListNode {
        address user;           // 用户地址
        uint256 balance;        // 以太币余额
        address next;           // 下一个节点的用户地址
        address prev;           // 上一个节点的用户地址
    }
    
    // 存储每个用户的以太币余额
    mapping(address => uint256) private _ethBalances;
    
    // 存储每种代币的每个用户余额 (token address => user address => balance)
    mapping(address => mapping(address => uint256)) private _tokenBalances;
    
    // 记录合约的总以太币余额
    uint256 private _totalEthBalance;
    
    // 前10名用户的链表相关变量
    mapping(address => ListNode) private _topUsers;  // 用户地址到节点的映射
    address private _head;                           // 链表头部（余额最高）
    address private _tail;                           // 链表尾部（余额最低）
    uint256 private _listSize;                       // 当前链表大小
    uint256 private constant MAX_TOP_USERS = 10;     // 最大保存用户数量
    
    // 事件：当用户存入以太币时触发
    event EthDeposited(address indexed user, uint256 amount);
    
    // 事件：当用户取出以太币时触发
    event EthWithdrawn(address indexed user, uint256 amount);
    
    // 事件：当用户进行以太币转账时触发
    event EthTransferred(address indexed from, address indexed to, uint256 amount);
    
    // 事件：当用户存入代币时触发
    event TokenDeposited(address indexed token, address indexed user, uint256 amount);
    
    // 事件：当用户取出代币时触发
    event TokenWithdrawn(address indexed token, address indexed user, uint256 amount);
    
    // 事件：当用户进行代币转账时触发
    event TokenTransferred(
        address indexed token, 
        address indexed from, 
        address indexed to, 
        uint256 amount
    );
    
    // EIP-712 相关设置
    bytes32 private constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    
    constructor() EIP712("Bank", "1") {}
    
    /**
     * @dev 更新用户在前10名链表中的位置
     * @param user 用户地址
     * @param newBalance 新的余额
     */
    function _updateTopUsersList(address user, uint256 newBalance) internal {
        bool userInList = _topUsers[user].user != address(0) || user == _head;
        
        if (userInList) {
            // 用户已在链表中，更新位置
            _removeFromList(user);
        }
        
        if (newBalance > 0) {
            _insertIntoList(user, newBalance);
        }
    }
    
    /**
     * @dev 将用户插入到链表的正确位置
     * @param user 用户地址
     * @param balance 用户余额
     */
    function _insertIntoList(address user, uint256 balance) internal {
        // 如果链表为空
        if (_listSize == 0) {
            _head = user;
            _tail = user;
            _topUsers[user] = ListNode(user, balance, address(0), address(0));
            _listSize = 1;
            return;
        }
        
        // 找到正确的插入位置（按余额降序）
        address current = _head;
        address prev = address(0);
        
        while (current != address(0) && _topUsers[current].balance >= balance) {
            prev = current;
            current = _topUsers[current].next;
        }
        
        // 插入新节点
        _topUsers[user] = ListNode(user, balance, current, prev);
        
        if (prev == address(0)) {
            // 插入到头部
            _head = user;
            if (current != address(0)) {
                _topUsers[current].prev = user;
            }
        } else {
            // 插入到中间或尾部
            _topUsers[prev].next = user;
            if (current != address(0)) {
                _topUsers[current].prev = user;
            } else {
                // 插入到尾部
                _tail = user;
            }
        }
        
        _listSize++;
        
        // 如果链表超过10个，移除最后一个
        if (_listSize > MAX_TOP_USERS) {
            _removeFromList(_tail);
        }
    }
    
    /**
     * @dev 从链表中移除用户
     * @param user 用户地址
     */
    function _removeFromList(address user) internal {
        if (_topUsers[user].user == address(0) && user != _head) {
            return; // 用户不在链表中
        }
        
        address prev = _topUsers[user].prev;
        address next = _topUsers[user].next;
        
        if (prev != address(0)) {
            _topUsers[prev].next = next;
        } else {
            // 移除的是头节点
            _head = next;
        }
        
        if (next != address(0)) {
            _topUsers[next].prev = prev;
        } else {
            // 移除的是尾节点
            _tail = prev;
        }
        
        delete _topUsers[user];
        _listSize--;
    }
    
    /**
     * @dev 存款以太币
     */
    function depositEth() external payable nonReentrant {
        depositETHInContract();
    }
    function depositETHInContract() internal {
        require(msg.value > 0, "The deposit amount must be greater than 0");
        
        _ethBalances[msg.sender] += msg.value;
        _totalEthBalance += msg.value;
        
        // 更新前10名用户链表
        _updateTopUsersList(msg.sender, _ethBalances[msg.sender]);
        
        emit EthDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev 取款以太币
     * @param amount 要取出的金额
     */
    function withdrawEth(uint256 amount) external nonReentrant {
        require(amount > 0, "The withdrawal amount must be greater than 0");
        require(_ethBalances[msg.sender] >= amount, "Insufficient balance");
        require(_totalEthBalance >= amount, "Insufficient balance in the contract");
        
        _ethBalances[msg.sender] -= amount;
        _totalEthBalance -= amount;
        
        // 更新前10名用户链表
        _updateTopUsersList(msg.sender, _ethBalances[msg.sender]);
        
        emit EthWithdrawn(msg.sender, amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev 以太币转账
     * @param to 接收方地址
     * @param amount 转账金额
     */
    function transferEth(address to, uint256 amount) external nonReentrant {
        require(to != address(0), "The receiving address cannot be 0");
        require(to != msg.sender, "You cannot transfer money to yourself.");
        require(amount > 0, "The transfer amount must be greater than 0");
        require(_ethBalances[msg.sender] >= amount, "Insufficient balance");
        
        _ethBalances[msg.sender] -= amount;
        _ethBalances[to] += amount;
        
        // 更新发送方和接收方在前10名用户链表中的位置
        _updateTopUsersList(msg.sender, _ethBalances[msg.sender]);
        _updateTopUsersList(to, _ethBalances[to]);
        
        emit EthTransferred(msg.sender, to, amount);
    }
    
    /**
     * @dev 存款ERC20代币
     * @param token 代币合约地址
     * @param amount 存款金额
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "The token address cannot be 0");
        require(amount > 0, "The deposit amount must be greater than 0.");
        
        IERC20 erc20 = IERC20(token);
        require(erc20.allowance(msg.sender, address(this)) >= amount, "Insufficient tokens have not been authorized");
        
        // 转移代币到合约
        // wake-disable
        bool success = erc20.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        // 更新余额
        _tokenBalances[token][msg.sender] += amount;
        
        emit TokenDeposited(token, msg.sender, amount);
    }
    
    /**
     * @dev 通过ERC1363回调接收代币存款
     * @param sender 发送方地址
     * @param amount 存款金额
     * @param data 附加数据
     */
    function onTransferReceived(
        address, 
        address sender, 
        uint256 amount, 
        bytes calldata data
    ) external returns (bytes4) {
        // 验证调用者是ERC1363代币合约
        require(IERC1363(msg.sender).supportsInterface(type(IERC1363).interfaceId), "It is not an ERC1363 token");
        
        // 更新余额
        _tokenBalances[msg.sender][sender] += amount;
        
        emit TokenDeposited(msg.sender, sender, amount);
        
        return this.onTransferReceived.selector;
    }
    
    /**
     * @dev 使用ERC20Permit存款代币
     * @param token 代币合约地址
     * @param amount 存款金额
     * @param deadline 签名有效期
     * @param v 签名参数v
     * @param r 签名参数r
     * @param s 签名参数s
     */
    function depositWithPermit(
        address token,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(token != address(0), "The token address cannot be 0");
        require(amount > 0, "The deposit amount must be greater than 0.");
        
        IERC20Permit erc20Permit = IERC20Permit(token);
        
        // 验证并使用授权
        erc20Permit.permit(
            msg.sender,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );
        IERC20 erc20 = IERC20(token);
        // 转移代币到合约
        bool success = erc20.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        // 更新余额
        _tokenBalances[token][msg.sender] += amount;
        
        emit TokenDeposited(token, msg.sender, amount);
    }
    
    /**
     * @dev 使用Permit2进行代币存款
     * @param permit2Address Permit2合约地址
     * @param token 代币合约地址
     * @param amount 存款金额
     * @param nonce 用户的nonce值
     * @param deadline 签名有效期
     * @param signature 用户的签名
     */
    function depositWithPermit2(
        address permit2Address,
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        require(permit2Address != address(0), "Permit2 address cannot be 0");
        require(token != address(0), "The token address cannot be 0");
        require(amount > 0, "The deposit amount must be greater than 0.");
        
        // 创建Permit2合约实例
        IPermit2 permit2 = IPermit2(permit2Address);
        
        // 构造SignatureTransfer结构
        IPermit2.SignatureTransfer memory signatureTransfer = IPermit2.SignatureTransfer({
            token: token,
            from: msg.sender,
            transfer: IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            nonce: nonce,
            deadline: deadline
        });
        
        // 使用Permit2进行转账
        permit2.permitTransferFrom(
            signatureTransfer,
            signature
        );
        
        // 更新余额
        _tokenBalances[token][msg.sender] += amount;
        
        emit TokenDeposited(token, msg.sender, amount);
    }
    
    /**
     * @dev 取款代币
     * @param token 代币合约地址
     * @param amount 取款金额
     */
    function withdrawToken(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "The token address cannot be 0");
        require(amount > 0, "The withdrawal amount must be greater than 0");
        require(_tokenBalances[token][msg.sender] >= amount, "Insufficient balance");
        
        // 更新余额
        _tokenBalances[token][msg.sender] -= amount;
        
        // 转移代币给用户
        IERC20 erc20 = IERC20(token);
        bool success = erc20.transfer(msg.sender, amount);
        require(success, "Token transfer failed");
        
        emit TokenWithdrawn(token, msg.sender, amount);
    }
    
    /**
     * @dev 代币转账
     * @param token 代币合约地址
     * @param to 接收方地址
     * @param amount 转账金额
     */
    function transferToken(address token, address to, uint256 amount) external nonReentrant {
        require(token != address(0), "The token address cannot be 0");
        require(to != address(0), "The receiving address cannot be 0");
        require(to != msg.sender, "You cannot transfer money to yourself.");
        require(amount > 0, "The transfer amount must be greater than 0");
        require(_tokenBalances[token][msg.sender] >= amount, "Insufficient balance");
        
        // 更新余额
        _tokenBalances[token][msg.sender] -= amount;
        _tokenBalances[token][to] += amount;
        
        emit TokenTransferred(token, msg.sender, to, amount);
    }
    
    /**
     * @dev 查询用户的以太币余额
     * @param account 用户地址
     * @return 以太币余额
     */
    function getEthBalance(address account) external view returns (uint256) {
        return _ethBalances[account];
    }
    
    /**
     * @dev 查询用户的代币余额
     * @param token 代币合约地址
     * @param account 用户地址
     * @return 代币余额
     */
    function getTokenBalance(address token, address account) external view returns (uint256) {
        return _tokenBalances[token][account];
    }
    
    /**
     * @dev 查询合约的总以太币余额
     * @return 总以太币余额
     */
    function getTotalEthBalance() external view returns (uint256) {
        return _totalEthBalance;
    }
    
    /**
     * @dev 获取前10名以太币存款用户列表
     * @return users 用户地址数组
     * @return balances 对应的余额数组
     */
    function getTopEthUsers() external view returns (address[] memory users, uint256[] memory balances) {
        users = new address[](_listSize);
        balances = new uint256[](_listSize);
        
        address current = _head;
        uint256 index = 0;
        
        while (current != address(0) && index < _listSize) {
            users[index] = current;
            balances[index] = _topUsers[current].balance;
            current = _topUsers[current].next;
            index++;
        }
        
        return (users, balances);
    }
    
    /**
     * @dev 获取指定用户在前10名中的排名
     * @param user 用户地址
     * @return rank 排名（1-10，0表示不在前10名）
     */
    function getUserRank(address user) external view returns (uint256 rank) {
        if (_topUsers[user].user == address(0) && user != _head) {
            return 0; // 用户不在前10名
        }
        
        address current = _head;
        uint256 currentRank = 1;
        
        while (current != address(0)) {
            if (current == user) {
                return currentRank;
            }
            current = _topUsers[current].next;
            currentRank++;
        }
        
        return 0;
    }
    
    /**
     * @dev 获取前10名链表的当前大小
     * @return 链表大小
     */
    function getTopUsersCount() external view returns (uint256) {
        return _listSize;
    }
    
    /**
     * @dev 接收以太币的回调函数
     */
    receive() external payable {
        depositETHInContract();
    }
}
