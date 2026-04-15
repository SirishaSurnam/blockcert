// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FacultyValidator
 * @dev Manages faculty validators who can issue and endorse credentials
 */
contract FacultyValidator is Ownable {
    struct Faculty {
        address account;
        string name;
        string department;
        bool active;
        uint256 addedAt;
    }

    // Mapping from faculty address to Faculty struct
    mapping(address => Faculty) public faculties;

    // Array of all faculty addresses
    address[] public facultyList;

    // Events
    event FacultyAdded(
        address indexed account,
        string name,
        string department
    );

    event FacultyRemoved(
        address indexed account
    );

    event FacultyUpdated(
        address indexed account,
        string name,
        string department
    );

    // Constructor
    constructor() Ownable(msg.sender) {}

    // Modifier to check if caller is active faculty
    modifier onlyActiveFaculty() {
        require(faculties[msg.sender].active, "Not active faculty");
        _;
    }

    /**
     * @dev Add a new faculty member
     */
    function addFaculty(
        address _account,
        string memory _name,
        string memory _department
    ) external onlyOwner {
        require(_account != address(0), "Invalid address");
        require(!faculties[_account].active, "Faculty already active");

        faculties[_account] = Faculty({
            account: _account,
            name: _name,
            department: _department,
            active: true,
            addedAt: block.timestamp
        });

        facultyList.push(_account);

        emit FacultyAdded(_account, _name, _department);
    }

    /**
     * @dev Remove a faculty member
     */
    function removeFaculty(address _account) external onlyOwner {
        require(faculties[_account].active, "Faculty not active");

        faculties[_account].active = false;

        emit FacultyRemoved(_account);
    }

    /**
     * @dev Update faculty details
     */
    function updateFaculty(
        address _account,
        string memory _name,
        string memory _department
    ) external onlyOwner {
        require(faculties[_account].account != address(0), "Faculty not found");

        faculties[_account].name = _name;
        faculties[_account].department = _department;

        emit FacultyUpdated(_account, _name, _department);
    }

    /**
     * @dev Check if address is active faculty
     */
    function isFaculty(address _account) external view returns (bool) {
        return faculties[_account].active;
    }

    /**
     * @dev Get faculty details
     */
    function getFaculty(
        address _account
    ) external view returns (
        address account,
        string memory name,
        string memory department,
        bool active,
        uint256 addedAt
    ) {
        Faculty storage faculty = faculties[_account];
        return (
            faculty.account,
            faculty.name,
            faculty.department,
            faculty.active,
            faculty.addedAt
        );
    }

    /**
     * @dev Get total number of faculty members
     */
    function getFacultyCount() external view returns (uint256) {
        return facultyList.length;
    }

    /**
     * @dev Get all active faculty addresses
     */
    function getActiveFaculty() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Count active faculty
        for (uint256 i = 0; i < facultyList.length; i++) {
            if (faculties[facultyList[i]].active) {
                activeCount++;
            }
        }

        // Create array of active faculty
        address[] memory activeFaculty = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < facultyList.length; i++) {
            if (faculties[facultyList[i]].active) {
                activeFaculty[index] = facultyList[i];
                index++;
            }
        }

        return activeFaculty;
    }
}