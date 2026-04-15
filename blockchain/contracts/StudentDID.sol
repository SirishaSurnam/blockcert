// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StudentDID
 * @dev Decentralized Identity for students
 */
contract StudentDID is Ownable {
    struct DIDDocument {
        string did;
        address student;
        string publicKey;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
    }

    // Mapping from student address to DID document
    mapping(address => DIDDocument) public didDocuments;

    // Mapping from DID to student address
    mapping(string => address) public didToAddress;

    // Events
    event DIDRegistered(
        address indexed student,
        string did,
        uint256 timestamp
    );

    event DIDUpdated(
        address indexed student,
        string did,
        uint256 timestamp
    );

    event DIDDeactivated(
        address indexed student,
        string did,
        uint256 timestamp
    );

    // Constructor
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new DID
     */
    function registerDID(
        string memory _did,
        string memory _publicKey
    ) external {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(
            didDocuments[msg.sender].student == address(0),
            "DID already registered for this address"
        );
        require(
            didToAddress[_did] == address(0),
            "DID already registered"
        );

        didDocuments[msg.sender] = DIDDocument({
            did: _did,
            student: msg.sender,
            publicKey: _publicKey,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        didToAddress[_did] = msg.sender;

        emit DIDRegistered(msg.sender, _did, block.timestamp);
    }

    /**
     * @dev Update DID document
     */
    function updateDID(
        string memory _publicKey
    ) external {
        DIDDocument storage doc = didDocuments[msg.sender];
        require(doc.student != address(0), "DID not registered");
        require(doc.active, "DID is deactivated");

        doc.publicKey = _publicKey;
        doc.updatedAt = block.timestamp;

        emit DIDUpdated(msg.sender, doc.did, block.timestamp);
    }

    /**
     * @dev Deactivate DID
     */
    function deactivateDID() external {
        DIDDocument storage doc = didDocuments[msg.sender];
        require(doc.student != address(0), "DID not registered");
        require(doc.active, "DID already deactivated");

        doc.active = false;
        doc.updatedAt = block.timestamp;

        emit DIDDeactivated(msg.sender, doc.did, block.timestamp);
    }

    /**
     * @dev Get DID for an address
     */
    function getDID(address _student) external view returns (string memory) {
        return didDocuments[_student].did;
    }

    /**
     * @dev Get DID document
     */
    function getDIDDocument(
        address _student
    ) external view returns (
        string memory did,
        address student,
        string memory publicKey,
        uint256 createdAt,
        uint256 updatedAt,
        bool active
    ) {
        DIDDocument storage doc = didDocuments[_student];
        return (
            doc.did,
            doc.student,
            doc.publicKey,
            doc.createdAt,
            doc.updatedAt,
            doc.active
        );
    }

    /**
     * @dev Verify DID is active
     */
    function isDIDActive(address _student) external view returns (bool) {
        return didDocuments[_student].active;
    }

    /**
     * @dev Resolve DID to address
     */
    function resolveDID(string memory _did) external view returns (address) {
        return didToAddress[_did];
    }
}