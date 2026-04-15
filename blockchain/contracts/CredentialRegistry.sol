// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialRegistry
 * @dev Manages academic credentials on the blockchain
 */
contract CredentialRegistry is Ownable {
    uint256 private _credentialIds;

    struct Credential {
        uint256 id;
        address student;
        address issuer;
        string uri;
        uint256 issuedAt;
        bool revoked;
        uint256 endorsementCount;
    }

    // Mapping from credential ID to Credential
    mapping(uint256 => Credential) public credentials;

    // Mapping from credential ID to endorsers
    mapping(uint256 => mapping(address => bool)) public endorsements;

    // Mapping from student address to their credential IDs
    mapping(address => uint256[]) public studentCredentials;

    // Events
    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed student,
        address indexed issuer,
        string uri
    );

    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed revokedBy
    );

    event CredentialEndorsed(
        uint256 indexed credentialId,
        address indexed endorser
    );

    // Constructor
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Issue a new credential
     */
    function issueCredential(
        address _student,
        string memory _uri
    ) external returns (uint256) {
        require(_student != address(0), "Invalid student address");
        require(bytes(_uri).length > 0, "URI cannot be empty");

        _credentialIds++;
        uint256 newCredentialId = _credentialIds;

        credentials[newCredentialId] = Credential({
            id: newCredentialId,
            student: _student,
            issuer: msg.sender,
            uri: _uri,
            issuedAt: block.timestamp,
            revoked: false,
            endorsementCount: 0
        });

        studentCredentials[_student].push(newCredentialId);

        emit CredentialIssued(newCredentialId, _student, msg.sender, _uri);

        return newCredentialId;
    }

    /**
     * @dev Revoke a credential
     */
    function revokeCredential(uint256 _credentialId) external {
        Credential storage credential = credentials[_credentialId];
        
        require(credential.id != 0, "Credential does not exist");
        require(!credential.revoked, "Credential already revoked");
        require(
            credential.issuer == msg.sender || owner() == msg.sender,
            "Not authorized to revoke"
        );

        credential.revoked = true;

        emit CredentialRevoked(_credentialId, msg.sender);
    }

    /**
     * @dev Endorse a credential
     */
    function endorseCredential(uint256 _credentialId) external {
        Credential storage credential = credentials[_credentialId];
        
        require(credential.id != 0, "Credential does not exist");
        require(!credential.revoked, "Cannot endorse revoked credential");
        require(
            !endorsements[_credentialId][msg.sender],
            "Already endorsed"
        );

        endorsements[_credentialId][msg.sender] = true;
        credential.endorsementCount++;

        emit CredentialEndorsed(_credentialId, msg.sender);
    }

    /**
     * @dev Get credential details
     */
    function getCredential(
        uint256 _credentialId
    ) external view returns (
        uint256 id,
        address student,
        address issuer,
        string memory uri,
        uint256 issuedAt,
        bool revoked,
        uint256 endorsementCount
    ) {
        Credential storage credential = credentials[_credentialId];
        require(credential.id != 0, "Credential does not exist");

        return (
            credential.id,
            credential.student,
            credential.issuer,
            credential.uri,
            credential.issuedAt,
            credential.revoked,
            credential.endorsementCount
        );
    }

    /**
     * @dev Get all credential IDs for a student
     */
    function getStudentCredentials(
        address _student
    ) external view returns (uint256[] memory) {
        return studentCredentials[_student];
    }

    /**
     * @dev Verify a credential
     */
    function verifyCredential(uint256 _credentialId) external view returns (bool) {
        Credential storage credential = credentials[_credentialId];
        return credential.id != 0 && !credential.revoked;
    }

    /**
     * @dev Get total number of credentials
     */
    function getTotalCredentials() external view returns (uint256) {
        return _credentialIds;
    }
}