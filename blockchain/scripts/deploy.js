const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BlockCert Smart Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Deploy CredentialRegistry
  console.log("📄 Deploying CredentialRegistry...");
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy();
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("✅ CredentialRegistry deployed to:", credentialRegistryAddress);

  // Deploy StudentDID
  console.log("\n📄 Deploying StudentDID...");
  const StudentDID = await hre.ethers.getContractFactory("StudentDID");
  const studentDID = await StudentDID.deploy();
  await studentDID.waitForDeployment();
  const studentDIDAddress = await studentDID.getAddress();
  console.log("✅ StudentDID deployed to:", studentDIDAddress);

  // Deploy NFTBadge
  console.log("\n📄 Deploying NFTBadge...");
  const NFTBadge = await hre.ethers.getContractFactory("NFTBadge");
  const nftBadge = await NFTBadge.deploy();
  await nftBadge.waitForDeployment();
  const nftBadgeAddress = await nftBadge.getAddress();
  console.log("✅ NFTBadge deployed to:", nftBadgeAddress);

  // Deploy FacultyValidator
  console.log("\n📄 Deploying FacultyValidator...");
  const FacultyValidator = await hre.ethers.getContractFactory("FacultyValidator");
  const facultyValidator = await FacultyValidator.deploy();
  await facultyValidator.waitForDeployment();
  const facultyValidatorAddress = await facultyValidator.getAddress();
  console.log("✅ FacultyValidator deployed to:", facultyValidatorAddress);

  console.log("\n" + "=".repeat(50));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("");
  console.log("Add these to your .env file:");
  console.log("");
  console.log(`CREDENTIAL_REGISTRY_ADDRESS=${credentialRegistryAddress}`);
  console.log(`STUDENT_DID_ADDRESS=${studentDIDAddress}`);
  console.log(`NFT_BADGE_ADDRESS=${nftBadgeAddress}`);
  console.log(`FACULTY_VALIDATOR_ADDRESS=${facultyValidatorAddress}`);
  console.log("");
  console.log("=".repeat(50));

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      CredentialRegistry: credentialRegistryAddress,
      StudentDID: studentDIDAddress,
      NFTBadge: nftBadgeAddress,
      FacultyValidator: facultyValidatorAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n✅ Deployment complete!");
  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });