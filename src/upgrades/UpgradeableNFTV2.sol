// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title UpgradeableNFTV2
 * @dev 可升级的 ERC721 合约 - 第二个版本
 * 增加了一次性批准所有 NFT 给市场合约的功能
 */
contract UpgradeableNFTV2 is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    uint256 private _tokenIdCounter;
    
    // 市场合约地址
    address public marketContract;
    
    // 事件：市场合约地址更新
    event MarketContractUpdated(address indexed oldMarket, address indexed newMarket);
    
    // 事件：用户一次性授权所有 NFT 给市场
    event ApprovalForAllToMarket(address indexed owner, bool approved);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev 初始化函数，替代构造函数
     * @param name NFT 名称
     * @param symbol NFT 符号
     * @param owner 合约所有者
     */
    function initialize(
        string memory name,
        string memory symbol,
        address owner
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init(owner);
        __UUPSUpgradeable_init();
        
        _tokenIdCounter = 1;
    }
    
    /**
     * @dev 设置市场合约地址（仅所有者）
     * @param _marketContract 市场合约地址
     */
    function setMarketContract(address _marketContract) external onlyOwner {
        require(_marketContract != address(0), "Invalid market contract address");
        address oldMarket = marketContract;
        marketContract = _marketContract;
        emit MarketContractUpdated(oldMarket, _marketContract);
    }
    
    /**
     * @dev 用户一次性授权所有 NFT 给市场合约
     * 这是 V2 版本的新功能
     */
    function approveAllToMarket() external {
        require(marketContract != address(0), "Market contract not set");
        require(!isApprovedForAll(msg.sender, marketContract), "Already approved");
        
        _setApprovalForAll(msg.sender, marketContract, true);
        emit ApprovalForAllToMarket(msg.sender, true);
    }
    
    /**
     * @dev 用户取消对市场合约的授权
     */
    function revokeApprovalFromMarket() external {
        require(marketContract != address(0), "Market contract not set");
        require(isApprovedForAll(msg.sender, marketContract), "Not approved");
        
        _setApprovalForAll(msg.sender, marketContract, false);
        emit ApprovalForAllToMarket(msg.sender, false);
    }
    
    /**
     * @dev 铸造 NFT
     * @param to 接收者地址
     * @return tokenId 铸造的 token ID
     */
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    /**
     * @dev 批量铸造 NFT
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function batchMint(address to, uint256 amount) external onlyOwner {
        require(amount > 0 && amount <= 100, "Invalid amount");
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter++;
            _safeMint(to, tokenId);
        }
    }
    
    /**
     * @dev 获取下一个 token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev 获取总供应量
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev 检查用户是否已授权给市场合约
     * @param owner NFT 所有者
     */
    function isApprovedForMarket(address owner) external view returns (bool) {
        return marketContract != address(0) && isApprovedForAll(owner, marketContract);
    }
    
    /**
     * @dev 授权升级函数（仅所有者可调用）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev 获取合约版本
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }
}