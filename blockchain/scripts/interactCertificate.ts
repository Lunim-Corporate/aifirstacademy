import { ethers } from "hardhat";

// Replace with your deployed contract address after deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  // 1️⃣ Get signer (account to send transactions)
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // 2️⃣ Get the contract instance
  const Certificate = await ethers.getContractFactory("Certificate");
  const certificate = Certificate.attach(CONTRACT_ADDRESS);

  // 3️⃣ Issue a certificate
  const credentialId = "CERT-123456";
  const txIssue = await certificate.issueCertificate(
    credentialId,
    "Blockchain Mastery",
    "Track-001",
    deployer.address
  );
  await txIssue.wait();
  console.log("Certificate issued with credentialId:", credentialId);

  // 4️⃣ Verify the certificate on-chain
  const certData = await certificate.certificates(credentialId);
  console.log("Verified certificate data:", certData);

  // 5️⃣ Revoke the certificate
  const txRevoke = await certificate.revokeCertificate(credentialId);
  await txRevoke.wait();
  console.log("Certificate revoked:", credentialId);

  // 6️⃣ Reissue the certificate (generate new one)
  const newCredentialId = credentialId + "-RE";
  const txReissue = await certificate.issueCertificate(
    newCredentialId,
    "Blockchain Mastery - Reissued",
    "Track-001",
    deployer.address
  );
  await txReissue.wait();
  console.log("Certificate reissued with credentialId:", newCredentialId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

