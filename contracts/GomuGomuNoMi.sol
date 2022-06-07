// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import './royalties/ContractRoyalties.sol';

contract GomuGomuNoMi is ERC721, Ownable, ERC2981ContractRoyalties {
    using Counters for Counters.Counter;

    //merkle root used for allowlist minting
    bytes32 public merkleRoot = 0x9bc0fe0a813ddaa9ab51586699dbbd5ac692f11624ef91a3e3439fb44755933b;
    //mapping of already claimed allowlist addreeses
    mapping(address => bool) public allowlistClaimed;
    bool private allowlistIsOpen =false;

    //Interface for royalties
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    Counters.Counter private _tokenIds;

    bool private publicSaleIsOpen = false;

    //comparisons are strictly less than for gas efficiency.
    uint256 public constant MAX_SUPPLY = 10000;

    
    uint256 public constant PRICE = 0.001 ether;

    uint256 public constant MAX_PER_MINT = 6; //5
    uint256 public constant MAX_PER_WALLET = 6; //5

    uint96 public constant ROYALTIES_POINTS = 500; //5%

    string public baseTokenURI;

    event NFTMinted(uint256, uint256, address);

    //amount of mints that each address has executed.
    mapping(address => uint256) public mintsPerAddress;

    constructor(string memory baseURI) ERC721("NFTContract", "NFT") {
        baseTokenURI = baseURI;
        setRoyalties(owner(), ROYALTIES_POINTS);
        
    }

    //ensure that modified function cannot be called by another contract
    modifier callerIsUser() {
    require(tx.origin == msg.sender, "The caller is another contract");
    _;
  }

    function _baseURI() internal view override returns (string memory) {
       return baseTokenURI;
    }
    
    function reveal(string memory _newBaseTokenURI) public onlyOwner {
        baseTokenURI = _newBaseTokenURI;
    }

    function openPublicSale() external onlyOwner {
        require(publicSaleIsOpen == false, 'Sale is already Open!');
        publicSaleIsOpen = true;
    }

    function setMerkleRoot(bytes32 _newMerkleRoot) public onlyOwner{
        merkleRoot = _newMerkleRoot;
    }

    function openallowlistSale() external onlyOwner {
        require(allowlistIsOpen == false, 'allowlist Sale is already Open!');
        allowlistIsOpen = true;
    }

    function mintNFTs(uint256 _number) public callerIsUser payable {
        uint256 totalMinted = _tokenIds.current();

        require(publicSaleIsOpen == true, "Opensale is not Open");
        require(totalMinted + _number < MAX_SUPPLY, "Not enough NFTs!");
        require(mintsPerAddress[msg.sender] + _number < MAX_PER_WALLET, "Cannot mint more than 5 NFTs per wallet");
        require(_number > 0 && _number < MAX_PER_MINT, "Cannot mint specified number of NFTs.");
        require(msg.value == PRICE * _number , "Not enough/too much ether sent");
        
        mintsPerAddress[msg.sender] += _number;

        for (uint i = 0; i < _number; ++i) {
            _mintSingleNFT();
        }

        emit NFTMinted(_number, _tokenIds.current(), msg.sender);
    }


    function _mintSingleNFT() internal {
      uint newTokenID = _tokenIds.current();
      _safeMint(msg.sender, newTokenID);
      _tokenIds.increment();

    }

        function allowlistMint(uint256 _number, bytes32[] calldata _merkleProof) external payable callerIsUser{
        uint256 totalMinted = _tokenIds.current();
        
        //basic validation. Wallet has not already claimed
        require(allowlistIsOpen == true, "allowlist sale is not Open");
        require(!allowlistClaimed[msg.sender], "Address has already claimed NFT");
        require(totalMinted + _number < MAX_SUPPLY, "Not enough NFTs left to mint..");
        require(_number > 0 && _number < MAX_PER_MINT, "Cannot mint specified number of NFTs.");
        require(mintsPerAddress[msg.sender] < MAX_PER_WALLET, "Cannot mint more than 5 NFTs per wallet");
        require(msg.value == PRICE * _number, "Not enough/too much ether sent");

        //veryfy the provided Merkle Proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid Proof");

        //Mark address as having claimed the token
        allowlistClaimed[msg.sender] = true;

        mintsPerAddress[msg.sender] += _number;

        //mint tokens 
        for (uint i = 0; i < _number; i++) {
            _mintSingleNFT();
        }
    }

    function getCurrentId() public view returns (uint256) {
        return _tokenIds.current();
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981Base)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Sets token royalties
    /// @param recipient recipient of the royalties
    /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function setRoyalties(address recipient, uint256 value) public {
        _setRoyalties(recipient, value);
    }

    /// @dev retrieve all the funds obtained during minting
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;

        require(balance > 0, "No funds left to withdraw");

        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent, "Failed to send Ether");
    }

    /// @dev reverts transaction if someone accidentally send ETH to the contract 
    receive() payable external {
        revert();
    }
    
}