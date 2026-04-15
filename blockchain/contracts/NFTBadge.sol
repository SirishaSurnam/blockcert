// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTBadge
 * @dev NFT badges for skill achievements
 */
contract NFTBadge is ERC721, Ownable {
    uint256 private _tokenIds;

    struct Badge {
        uint256 tokenId;
        address student;
        string skillName;
        uint256 level;
        uint256 timestamp;
        string uri;
    }

    // Mapping from token ID to Badge
    mapping(uint256 => Badge) public badges;

    // Mapping from student address to their badge token IDs
    mapping(address => uint256[]) public studentBadges;

    // Mapping from token ID to credential ID
    mapping(uint256 => uint256) public tokenCredential;

    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed to,
        string skillName,
        uint256 level
    );

    // Constructor
    constructor() ERC721("SkillBadge", "SBADGE") Ownable(msg.sender) {}

    /**
     * @dev Mint a new badge
     */
    function mintBadge(
        address _to,
        uint256 _credentialId,
        string memory _uri
    ) external returns (uint256) {
        require(_to != address(0), "Invalid address");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _uri);

        tokenCredential[newTokenId] = _credentialId;
        studentBadges[_to].push(newTokenId);

        badges[newTokenId] = Badge({
            tokenId: newTokenId,
            student: _to,
            skillName: "",
            level: 1,
            timestamp: block.timestamp,
            uri: _uri
        });

        emit BadgeMinted(newTokenId, _to, "", 1);

        return newTokenId;
    }

    /**
     * @dev Mint a skill badge with details
     */
    function mintSkillBadge(
        address _to,
        string memory _skillName,
        uint256 _level,
        string memory _uri
    ) external returns (uint256) {
        require(_to != address(0), "Invalid address");
        require(_level >= 1 && _level <= 5, "Invalid level");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _uri);

        studentBadges[_to].push(newTokenId);

        badges[newTokenId] = Badge({
            tokenId: newTokenId,
            student: _to,
            skillName: _skillName,
            level: _level,
            timestamp: block.timestamp,
            uri: _uri
        });

        emit BadgeMinted(newTokenId, _to, _skillName, _level);

        return newTokenId;
    }

    /**
     * @dev Internal function to set token URI
     */
    function _setTokenURI(uint256 tokenId, string memory _uri) internal {
        _tokenURIs[tokenId] = _uri;
    }

    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Get badge details
     */
    function getBadge(uint256 _tokenId) external view returns (Badge memory) {
        require(_exists(_tokenId), "Badge does not exist");
        return badges[_tokenId];
    }

    /**
     * @dev Get all badges for a student
     */
    function getStudentBadges(address _student) external view returns (uint256[] memory) {
        return studentBadges[_student];
    }

    /**
     * @dev Get badge count for a student
     */
    function getBadgeCount(address _student) external view returns (uint256) {
        return studentBadges[_student].length;
    }

    /**
     * @dev Get total number of badges
     */
    function getTotalBadges() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }
}