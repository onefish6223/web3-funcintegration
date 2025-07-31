// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC721 is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
        if (tokenId >= _tokenIdCounter) {
            _tokenIdCounter = tokenId + 1;
        }
    }
    
    function mintNext(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        _tokenIdCounter++;
        return tokenId;
    }
    
    function burn(uint256 tokenId) external {
        require(
            msg.sender == ownerOf(tokenId) || 
            msg.sender == getApproved(tokenId) || 
            isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not approved or owner"
        );
        _burn(tokenId);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}