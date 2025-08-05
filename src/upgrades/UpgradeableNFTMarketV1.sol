// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title UpgradeableNFTMarketV1
 * @dev 可升级的 NFT 市场合约 - 第一个版本
 * 支持基本的上架、下架、购买功能
 */
contract UpgradeableNFTMarketV1 is 
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // 计数器：用于跟踪 listing ID
    uint256 private _listingIdCounter;
    
    // 平台手续费比例（万分比，100 = 1%）
    uint256 public platformFeePercentage;
    
    // 平台手续费接收地址
    address public feeReceiver;
    
    // NFT Listing 结构体
    struct Listing {
        uint256 id;             // listing ID
        address nftContract;    // NFT 合约地址
        address seller;         // 卖家地址
        address buyer;          // 买家地址（未售出为 address(0)）
        uint256 tokenId;        // NFT token ID
        uint256 price;          // 售价（以 wei 为单位）
        bool active;            // 是否有效（未售出且未取消）
    }
    
    // 存储所有 listings：listing ID => Listing
    mapping(uint256 => Listing) public listings;
    
    // 记录 NFT 是否已被上架：nft合约地址 => tokenId => listing ID
    mapping(address => mapping(uint256 => uint256)) public nftToListingId;
    
    // 事件：当 NFT 被上架时触发
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 timestamp
    );
    
    // 事件：当 NFT listing 被取消时触发
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 timestamp
    );
    
    // 事件：当 NFT 被购买时触发
    event NFTPurchased(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        uint256 platformFee,
        uint256 timestamp
    );
    
    // 事件：当平台手续费比例更新时触发
    event PlatformFeeUpdated(uint256 newFeePercentage, uint256 timestamp);
    
    // 事件：当手续费接收地址更新时触发
    event FeeReceiverUpdated(address newFeeReceiver, uint256 timestamp);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev 初始化函数，替代构造函数
     * @param owner 合约所有者
     * @param _feeReceiver 手续费接收地址
     * @param _platformFeePercentage 平台手续费比例（万分比）
     */
    function initialize(
        address owner,
        address _feeReceiver,
        uint256 _platformFeePercentage
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(owner);
        __UUPSUpgradeable_init();
        
        require(_feeReceiver != address(0), "Invalid fee receiver");
        require(_platformFeePercentage <= 1000, "Fee too high"); // 最大 10%
        
        feeReceiver = _feeReceiver;
        platformFeePercentage = _platformFeePercentage;
        _listingIdCounter = 1;
    }
    
    /**
     * @dev 创建 NFT listing（上架 NFT）
     * @param nftContract NFT 合约地址
     * @param tokenId NFT 的 token ID
     * @param price 售价（以 wei 为单位）
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(nftContract != address(0), "Invalid NFT contract");
        require(price > 0, "Price must be greater than 0");
        require(nftToListingId[nftContract][tokenId] == 0, "NFT already listed");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Contract not authorized"
        );
        
        // 生成新的 listing ID
        uint256 listingId = _listingIdCounter++;
        
        // 创建 listing
        listings[listingId] = Listing({
            id: listingId,
            nftContract: nftContract,
            seller: msg.sender,
            buyer: address(0),
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        // 记录 NFT 到 listing 的映射
        nftToListingId[nftContract][tokenId] = listingId;
        
        emit ListingCreated(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            block.timestamp
        );
    }
    
    /**
     * @dev 取消 NFT listing（下架 NFT）
     * @param listingId listing ID
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        // 标记为非活跃
        listing.active = false;
        
        // 清除 NFT 到 listing 的映射
        delete nftToListingId[listing.nftContract][listing.tokenId];
        
        emit ListingCancelled(
            listingId,
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            block.timestamp
        );
    }
    
    /**
     * @dev 购买 NFT
     * @param listingId listing ID
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy own NFT");
        require(msg.value == listing.price, "Incorrect payment amount");
        
        // 计算平台手续费
        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // 更新 listing 状态
        listing.active = false;
        listing.buyer = msg.sender;
        
        // 清除 NFT 到 listing 的映射
        delete nftToListingId[listing.nftContract][listing.tokenId];
        
        // 转移 NFT
        // wake-disable-next-line
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // 转账给卖家
        if (sellerAmount > 0) {
            // wake-disable-next-line
            (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
            require(success, "Transfer to seller failed");
        }
        
        // 转账平台手续费
        if (platformFee > 0) {
            // wake-disable-next-line
            (bool success, ) = payable(feeReceiver).call{value: platformFee}("");
            require(success, "Transfer platform fee failed");
        }
        
        emit NFTPurchased(
            listingId,
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            platformFee,
            block.timestamp
        );
    }
    
    /**
     * @dev 设置平台手续费比例（仅所有者）
     * @param _platformFeePercentage 新的手续费比例（万分比）
     */
    function setPlatformFeePercentage(uint256 _platformFeePercentage) external onlyOwner {
        require(_platformFeePercentage <= 1000, "Fee too high"); // 最大 10%
        platformFeePercentage = _platformFeePercentage;
        emit PlatformFeeUpdated(_platformFeePercentage, block.timestamp);
    }
    
    /**
     * @dev 设置手续费接收地址（仅所有者）
     * @param _feeReceiver 新的手续费接收地址
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver, block.timestamp);
    }
    
    /**
     * @dev 获取 listing 信息
     * @param listingId listing ID
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev 获取下一个 listing ID
     */
    function nextListingId() external view returns (uint256) {
        return _listingIdCounter;
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