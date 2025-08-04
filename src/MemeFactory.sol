// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MemeToken.sol";

/**
 * @title MemeFactory
 * @dev Meme代币发射平台工厂合约，使用最小代理模式创建代币
 */
contract MemeFactory is Ownable, ReentrancyGuard {
    using Clones for address;
    
    address public immutable memeTokenImplementation;  // 代币模板合约地址
    uint256 public constant PLATFORM_FEE_RATE = 100;  // 平台费率 1% (1/100)
    
    // 存储每个代币的信息
    struct MemeInfo {
        string symbol;
        uint256 totalSupply;
        uint256 perMint;
        uint256 price;
        address creator;
        bool exists;
    }
    
    mapping(address => MemeInfo) public memeTokens;  // 代币地址 => 代币信息
    address[] public allMemeTokens;                   // 所有创建的代币地址
    
    event MemeDeployed(
        address indexed tokenAddress,
        address indexed creator,
        string symbol,
        uint256 totalSupply,
        uint256 perMint,
        uint256 price
    );
    
    event MemeMinted(
        address indexed tokenAddress,
        address indexed minter,
        uint256 amount,
        uint256 payment,
        uint256 platformFee,
        uint256 creatorFee
    );
    
    constructor() Ownable(msg.sender) {
        // 部署代币模板合约
        memeTokenImplementation = address(new MemeToken());
    }
    
    /**
     * @dev 部署新的Meme代币
     * @param symbol 代币符号
     * @param totalSupply 总发行量
     * @param perMint 每次铸造数量
     * @param price 每个代币价格（wei）
     * @return tokenAddress 部署的代币合约地址
     */
    function deployMeme(
        string memory symbol,
        uint256 totalSupply,
        uint256 perMint,
        uint256 price
    ) external nonReentrant returns (address tokenAddress) {
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(totalSupply > 0, "Total supply must be greater than 0");
        require(perMint > 0, "Per mint must be greater than 0");
        require(perMint <= totalSupply, "Per mint cannot exceed total supply");
        
        // 使用最小代理模式克隆代币合约
        tokenAddress = memeTokenImplementation.clone();
        
        // 存储代币信息（在外部调用之前更新状态）
        memeTokens[tokenAddress] = MemeInfo({
            symbol: symbol,
            totalSupply: totalSupply,
            perMint: perMint,
            price: price,
            creator: msg.sender,
            exists: true
        });
        
        allMemeTokens.push(tokenAddress);
        
        // 初始化代币合约
        // wake-disable-next-line
        MemeToken(tokenAddress).initialize(
            symbol,  // name
            symbol,  // symbol
            totalSupply,
            perMint,
            price,
            msg.sender,
            address(this)
        );
        
        emit MemeDeployed(
            tokenAddress,
            msg.sender,
            symbol,
            totalSupply,
            perMint,
            price
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev 铸造Meme代币
     * @param tokenAddr 代币合约地址
     */
    function mintMeme(address tokenAddr) external payable nonReentrant {
        require(memeTokens[tokenAddr].exists, "Token does not exist");
        
        MemeToken memeToken = MemeToken(tokenAddr);
        MemeInfo memory info = memeTokens[tokenAddr];
        
        require(memeToken.canMint(), "Cannot mint more tokens");
        
        // 计算总支付金额：price是每个代币的价格，perMint是代币数量（包含18位小数）
        uint256 totalPayment = (info.price * info.perMint) / 1e18;
        require(msg.value >= totalPayment, "Insufficient payment");
        uint256 platformFee = totalPayment / PLATFORM_FEE_RATE;  // 1%给平台
        uint256 creatorFee = totalPayment - platformFee;         // 99%给创建者
        
        // 先分配费用（避免在mint后进行外部调用）
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        if (creatorFee > 0) {
            payable(info.creator).transfer(creatorFee);
        }
        
        // 退还多余的ETH
        if (msg.value > totalPayment) {
            payable(msg.sender).transfer(msg.value - totalPayment);
        }
        
        // 最后铸造代币（外部调用放在最后）
        // wake-disable-next-line
        require(memeToken.mint(msg.sender), "Mint failed");
        
        emit MemeMinted(
            tokenAddr,
            msg.sender,
            info.perMint,
            totalPayment,
            platformFee,
            creatorFee
        );
    }
    
    /**
     * @dev 获取所有创建的代币数量
     */
    function getAllMemeTokensCount() external view returns (uint256) {
        return allMemeTokens.length;
    }
    
    /**
     * @dev 获取指定范围的代币地址
     * @param start 起始索引
     * @param end 结束索引
     */
    function getMemeTokens(uint256 start, uint256 end) 
        external 
        view 
        returns (address[] memory) 
    {
        require(start <= end, "Invalid range");
        require(end < allMemeTokens.length, "End index out of bounds");
        
        address[] memory tokens = new address[](end - start + 1);
        for (uint256 i = start; i <= end; i++) {
            tokens[i - start] = allMemeTokens[i];
        }
        return tokens;
    }
    
    /**
     * @dev 获取代币信息
     * @param tokenAddr 代币地址
     */
    function getMemeInfo(address tokenAddr) 
        external 
        view 
        returns (MemeInfo memory) 
    {
        require(memeTokens[tokenAddr].exists, "Token does not exist");
        return memeTokens[tokenAddr];
    }
    
    /**
     * @dev 检查代币是否存在
     * @param tokenAddr 代币地址
     */
    function isMemeToken(address tokenAddr) external view returns (bool) {
        return memeTokens[tokenAddr].exists;
    }
    
    /**
     * @dev 紧急提取合约中的ETH（仅所有者）
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}