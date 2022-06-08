//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import '../royalties/ContractRoyalties.sol';

import "../GomuGomuNoMi.sol";

import "hardhat/console.sol";

contract BasicMarketplaceRoyalties is Ownable, ERC165 {

    using Counters for Counters.Counter;
    Counters.Counter private lastListingId;

    
    //Royalties Interface
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    address private nft;


    struct priceDistribution {
        uint256 sellerPayment;
        address creatorAddress;
        uint256 creatorRoyalties;
    }
    

    struct Listing {
        address seller;
        address currency;
        uint256 tokenId;
        uint256 price;
        bool isSold;
        bool exist;
    }


    mapping(uint256=>Listing) public listings;
    mapping(uint256=>uint256) public tokensListing;



    function setNFTContract(address _nft) external onlyOwner {
        require(nft != _nft,"Marketplace: New NFT contract address have same value as the old one");
        nft = _nft;
    }


    function calculatePayments(uint256 tokenId, uint256 sellPrice) private view returns (address creatorAddress, uint256 creatorRoyalties) {
        GomuGomuNoMi token = getToken();
        (creatorAddress, creatorRoyalties) = token.royaltyInfo(tokenId, sellPrice); 
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC165) returns (bool){

        return interfaceId == type(IERC2981Royalties).interfaceId || super.supportsInterface(interfaceId);
    }


    function listNft(uint256 tokenId, uint256 price) external {
        lastListingId.increment();
        uint256 listingId = lastListingId.current();

        

        require( tokensListing[tokenId] == 0, "Marketplace: invalid listingId");
       
        
        tokensListing[tokenId] = listingId;

        Listing memory _list = listings[tokensListing[tokenId]];
        require(_list.exist == false, "Marketplace: List already exist");
        require(_list.isSold == false, "Marketplace: Can not list an already sold item");

        Listing memory newListing = Listing(
            msg.sender,
            address(0),
            tokenId,
            price,
            false,
            true
        );

        listings[listingId] = newListing;

    }



    function buyExactMatchNative(uint256 tokenId) external payable {
        Listing storage _list = listings[tokensListing[tokenId]];
        

        require(_list.exist == true, "Marketplace: item does not exist");
        require(_list.price == msg.value, "Marketplace: not enough tokens send");
        require(_list.isSold == false,"Marketplace: item is already sold");
        require(_list.currency == address(0), "Marketplace: item currency is not the native one");
        require(_list.seller != msg.sender, "Marketplace: seller has the same address as buyer");

        GomuGomuNoMi token = getToken();
        
        token.safeTransferFrom(_list.seller, msg.sender, tokenId);
        priceDistribution memory price;

        (price.creatorAddress, price.creatorRoyalties) = calculatePayments(tokenId, msg.value);
        //Royalties for creator (calculated over total amount)
        payable(price.creatorAddress).transfer(price.creatorRoyalties);
        //Remaining msg.value goes to seller
        price.sellerPayment = msg.value - price.creatorRoyalties ;
        payable(_list.seller).transfer(price.sellerPayment);

        console.log("sellerPayments", price.sellerPayment);
        console.log("Creator Royalties", price.creatorRoyalties);

        _list.isSold = true;

        clearStorage(tokenId);
    }

    function getToken() internal view returns(GomuGomuNoMi) {
        GomuGomuNoMi token = GomuGomuNoMi(payable(nft));
        return token;
    }


    function clearStorage(uint256 tokenId) internal {
        delete listings[tokensListing[tokenId]];
        delete tokensListing[tokenId];
    } 
 

    function clearListing(uint256 tokenId) external onlyOwner {

        clearStorage(tokenId);

    }

    function getListing(uint256 tokenId) external view returns (bool exists)  {

        Listing memory _list = listings[tokensListing[tokenId]];

        return exists = _list.exist == true;
    }
}