const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  let credentialRegistry;
  let owner;
  let student;
  let issuer;

  beforeEach(async function () {
    [owner, student, issuer] = await ethers.getSigners();
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.waitForDeployment();
  });

  describe("Credential Issuance", function () {
    it("Should issue a new credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        student.address,
        "ipfs://test123"
      );

      const total = await credentialRegistry.getTotalCredentials();
      expect(total).to.equal(1);

      const cred = await credentialRegistry.getCredential(1);
      expect(cred.student).to.equal(student.address);
      expect(cred.issuer).to.equal(issuer.address);
      expect(cred.uri).to.equal("ipfs://test123");
      expect(cred.revoked).to.be.false;
    });

    it("Should emit CredentialIssued event", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(
          student.address,
          "ipfs://test123"
        )
      ).to.emit(credentialRegistry, "CredentialIssued");
    });
  });

  describe("Credential Revocation", function () {
    it("Should allow issuer to revoke credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        student.address,
        "ipfs://test123"
      );

      await credentialRegistry.connect(issuer).revokeCredential(1);

      const cred = await credentialRegistry.getCredential(1);
      expect(cred.revoked).to.be.true;
    });
  });

  describe("Credential Endorsement", function () {
    it("Should allow endorsement of credentials", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        student.address,
        "ipfs://test123"
      );

      await credentialRegistry.connect(owner).endorseCredential(1);

      const cred = await credentialRegistry.getCredential(1);
      expect(cred.endorsementCount).to.equal(1);
    });
  });
});

describe("NFTBadge", function () {
  let nftBadge;
  let owner;
  let student;

  beforeEach(async function () {
    [owner, student] = await ethers.getSigners();
    const NFTBadge = await ethers.getContractFactory("NFTBadge");
    nftBadge = await NFTBadge.deploy();
    await nftBadge.waitForDeployment();
  });

  describe("Badge Minting", function () {
    it("Should mint a skill badge", async function () {
      await nftBadge.connect(owner).mintSkillBadge(
        student.address,
        "JavaScript",
        3,
        "ipfs://badge123"
      );

      const total = await nftBadge.getTotalBadges();
      expect(total).to.equal(1);

      const balance = await nftBadge.balanceOf(student.address);
      expect(balance).to.equal(1);
    });

    it("Should return correct badge details", async function () {
      await nftBadge.connect(owner).mintSkillBadge(
        student.address,
        "Python",
        4,
        "ipfs://badge456"
      );

      const badge = await nftBadge.getBadge(1);
      expect(badge.skillName).to.equal("Python");
      expect(badge.level).to.equal(4);
    });
  });
});