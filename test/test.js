const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const linkToken = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20")


describe("NFT contract creation, NFT minting, whitelist minting, royalties, reward pool, withdraw,", () => {
  let nftFactory;
  let nft;
  let owner;
  let alice;
  let bob;

  beforeEach(async () => {
    let signers = await ethers.getSigners()
    ownerAccount = signers[0]
    aliceAccount = signers[1]
    bobAccount = signers[2]
    carolAccount = signers[3]
    ineAccount = signers[4]

    owner = ownerAccount.address
    alice = aliceAccount.address 
    bob = bobAccount.address
    carol = carolAccount.address
    ine = ineAccount.address

    nftFactory = await ethers.getContractFactory("GomuGomuNoMi")

    const baseTokenUri = "ipfs://some_IPFS_CID/"
    
    nft = await nftFactory.deploy(baseTokenUri)



  })

  describe("Minting in Public Sale with sale not open", () => {

    it("Should fail when Owner tries to mint. Sale not open", async () => {
     await expect(nft.mintNFTs(1, {value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("Opensale is not Open")
    })

    it("Should fail when User tries to mint. Sale not open", async () => {
      await expect(nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("Opensale is not Open")
     })
    })

  describe("Minting in Public Sale with public sale open", () => {

     beforeEach(async () => {
       await nft.openPublicSale();
     })

     it("Should try to open sale again, fail Public Sale is already Open", async () => {
       await expect(nft.openPublicSale()).to.be.revertedWith("Sale is already Open!")
     })

    it("Should open sale and allow user (not owner) to mint 1 token with exact price", async () => {
      await nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("0.001")})
      expect(await nft.balanceOf(alice)).to.be.equal(1)
    })

    it("Should open sale and allow user (not owner) to mint 2 tokens with exact price", async () => {
      await nft.connect(aliceAccount).mintNFTs(2, {value: ethers.utils.parseEther("0.002")})
      expect(await nft.balanceOf(alice)).to.be.equal(2)
    })

    it("Should open sale but fail to allow user (not owner) to mint more than the max amount of tokens per address", async () => {
      await expect(nft.connect(aliceAccount).mintNFTs(6, {value: ethers.utils.parseEther("0.006")})).to.be.revertedWith('Cannot mint more than 5 NFTs per wallet')
    })

    it("Should open sale but fail to allow user (not owner) to mint if not enought ether sent", async () => {
      await expect( nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("0.00001")})).to.be.revertedWith('Not enough/too much ether sent')
    })

    it("Should open sale but fail to allow user (not owner) to mint if more ether sent than necessary", async () => {
      await expect( nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("4")})).to.be.revertedWith('Not enough/too much ether sent')
    })
  })

  describe("Transfer of tokens", () => {

    beforeEach(async () => {
      await nft.openPublicSale();
    })

    it("Should mint by Alice and try to transfer 1 token from user Alice to user Carol", async () => {
      await nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("0.001")})
      await nft.connect(aliceAccount).transferFrom(alice, carol, await nft.getCurrentId()-1)

      expect(await nft.balanceOf(alice)).to.be.equal(0)
      expect(await nft.balanceOf(carol)).to.be.equal(1)
    })
  })

  describe("Whitelist Sale with whitelist NOT open", () => {
    let aliceProof = ["0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94","0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae","0x26cb158cf4ecb18683907b73c29e42576312db276de44d66ecfa72a69edc45d2","0xb6af7bc58d7cb770b7b2a0b3e85aae4cce2ac46139c0f9d263c2698e32efc8c8"]

    it(`Should fail to whitelist mint with reason Whitelist not open`, async () => {
     await expect(nft.whitelistMint(1, aliceProof)).to.be.revertedWith("Whitelist sale is not Open")
    })

    it("Should open whitelist and then fail to try to open it again", async () => {
      await nft.openWhitelistSale()
      await expect (nft.openWhitelistSale()).to.be.revertedWith("Whitelist Sale is already Open!")
    })

    it("Should try to open whitelist sale without being owner", async () => {
      await expect (nft.connect(aliceAccount).openWhitelistSale()).to.be.revertedWith("Ownable: caller is not the owner")
    })

  })

  describe("Whitelist Sale", () => {
    let ownerProof = ["0x5c4a1afe01494e8514ae2a01ae4d9e6ceb2839e29f0b727832f936c96a597d7f","0xfa820a421a73532a4f7f1b072c73674692fe3d1d758a3320bdf06aad2d2a3af8","0x299933cac28b9df1ae6dbf7f5d9814b5fe409a67795ed15dea6135b5fe78c6e3","0xb6af7bc58d7cb770b7b2a0b3e85aae4cce2ac46139c0f9d263c2698e32efc8c8"]
    let aliceProof = ["0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94","0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae","0x26cb158cf4ecb18683907b73c29e42576312db276de44d66ecfa72a69edc45d2","0xb6af7bc58d7cb770b7b2a0b3e85aae4cce2ac46139c0f9d263c2698e32efc8c8"]
    let bobProof = ["0x00314e565e0574cb412563df634608d76f5c59d9f817e85966100ec1d48005c0","0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae","0x26cb158cf4ecb18683907b73c29e42576312db276de44d66ecfa72a69edc45d2","0xb6af7bc58d7cb770b7b2a0b3e85aae4cce2ac46139c0f9d263c2698e32efc8c8"]
    let carolProof = ["0x343750465941b29921f50a28e0e43050e5e1c2611a3ea8d7fe1001090d5e1436","0x26cb158cf4ecb18683907b73c29e42576312db276de44d66ecfa72a69edc45d2","0xb6af7bc58d7cb770b7b2a0b3e85aae4cce2ac46139c0f9d263c2698e32efc8c8"]
    let ineProof = []
    
    beforeEach(async () => {
      await nft.openWhitelistSale();
    })

   it("Should allow whitelisted user (not owner) to mint 1 token with exact price", async () => {
    await nft.connect(aliceAccount).whitelistMint(1, aliceProof, {value: ethers.utils.parseEther("0.001")})
    expect(await nft.balanceOf(alice)).to.be.equal(1)
   })

   it("Should allow whitelisted user (not owner) to mint 2 tokens with exact price", async () => {
    await nft.connect(carolAccount).whitelistMint(2, carolProof, {value: ethers.utils.parseEther("0.002")})
    expect(await nft.balanceOf(carol)).to.be.equal(2)
  })

   it("Should fail to allow NON whitelisted user to mint 1 token with exact price", async () => {
    await expect(nft.connect(ineAccount).whitelistMint(1, ineProof, {value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("Invalid Proof")
  
  })

   it("Should fail to allow whitelisted user to mint twice 1 token with exact price. Whitelist mint already claimed", async () => {
    await nft.connect(aliceAccount).whitelistMint(1, aliceProof, {value: ethers.utils.parseEther("0.001")})
    await expect(nft.connect(aliceAccount).whitelistMint(1, aliceProof, {value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("Address has already claimed NFT")
  })

   it("Should fail to allow whitelisted user to mint more than the max amount of tokens per address", async () => {
    await expect(nft.connect(aliceAccount).whitelistMint(6, aliceProof, {value: ethers.utils.parseEther("0.006")})).to.be.revertedWith("Cannot mint specified number of NFTs.")
   })

   it("Should fail to allow whitelisted user to mint if not enought ether sent", async () => {
    await expect(nft.connect(aliceAccount).whitelistMint(2, aliceProof, {value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("Not enough/too much ether sent")
   })

   it("Should fail to allow whitelisted user to mint if more ether sent than necessary", async () => {
    await expect(nft.connect(aliceAccount).whitelistMint(1, aliceProof, {value: ethers.utils.parseEther("0.002")})).to.be.revertedWith("Not enough/too much ether sent")
   })

  })

  describe("Withdrawal of funds", () => {


    it("should sell 2 NFTs and fail to allow withdrawal of funds by not owner address", async() => {
      
        await nft.openPublicSale()
        await nft.connect(aliceAccount).mintNFTs(2, {value: ethers.utils.parseEther("0.002")})
        expect(await nft.balanceOf(alice)).to.be.equal(2)
  
        await expect(nft.connect(aliceAccount).withdraw()).to.revertedWith("Ownable: caller is not the owner")
      })
  })


describe("GomuGomuNoMi Royalties", () => {

  let marketplaceFactory;
  let marketplace

  beforeEach(async () => {
    marketplaceFactory = await ethers.getContractFactory("BasicMarketplaceRoyalties")

    marketplace = await marketplaceFactory.deploy()

    await marketplace.setNFTContract(nft.address)
    await nft.openPublicSale();

  })
    it("should aprove, list and sell a token in the marketplace, 10% of price should go to royalties address Owner", async () => {
      await nft.connect(aliceAccount).mintNFTs(1, {value: ethers.utils.parseEther("0.001")})
      await nft.connect(aliceAccount).setApprovalForAll(marketplace.address, true)
      await marketplace.connect(aliceAccount).listNft(30, ethers.utils.parseEther("10"))
      
      expect(()=> marketplace.connect(bobAccount).buyExactMatchNative(1, 1, "0x", {value:ethers.utils.parseEther("10")}).to.changeEtherBalances([alice, bob, owner], [9, -10, 1]))
    })

    
  })
})