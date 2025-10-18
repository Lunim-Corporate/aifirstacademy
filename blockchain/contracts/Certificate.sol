// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Certificate {
    struct Cert {
        string credentialId;
        string title;
        string trackId;
        address owner;
        uint256 issuedAt;
    }

    mapping(string => Cert) private certificates;

    event CertificateIssued(string credentialId, address owner);

    // Issue a certificate on-chain
    function issueCertificate(
        string memory credentialId,
        string memory title,
        string memory trackId,
        address owner
    ) public {
        require(bytes(certificates[credentialId].credentialId).length == 0, "Certificate already exists");

        certificates[credentialId] = Cert({
            credentialId: credentialId,
            title: title,
            trackId: trackId,
            owner: owner,
            issuedAt: block.timestamp
        });

        emit CertificateIssued(credentialId, owner);
    }

    // Verify certificate exists on-chain
    function verifyCertificate(string memory credentialId) public view returns (bool) {
        return bytes(certificates[credentialId].credentialId).length > 0;
    }

    // Fetch certificate details
    function getCertificate(string memory credentialId) public view returns (Cert memory) {
        require(bytes(certificates[credentialId].credentialId).length > 0, "Certificate not found");
        return certificates[credentialId];
    }
}
