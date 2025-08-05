// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title UpgradeableNFTV1
 * @dev 可升级的 ERC721 合约 - 第一个版本
 * 简单的 NFT 实现，支持铸造功能
 */
contract UpgradeableNFTV1 is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    uint256 private _tokenIdCounter;
    
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
     * @dev 授权升级函数（仅所有者可调用）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev 获取合约版本
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}