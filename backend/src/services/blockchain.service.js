const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.connected = false;
  }

  async initialize() {
    try {
      if (!process.env.BLOCKCHAIN_RPC_URL) {
        console.log('⚠️ No BLOCKCHAIN_RPC_URL provided, running in database-only mode');
        return false;
      }

      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

      if (process.env.BACKEND_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, this.provider);
        console.log(`🔑 Backend wallet address: ${this.signer.address}`);
      }

      this.connected = true;
      console.log('✅ Blockchain service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      this.connected = false;
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }

  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  // ===== CREDENTIAL REGISTRY FUNCTIONS =====

  async issueCredential(studentAddress, metadataURI) {
    if (!this.contracts.credentialRegistry) {
      // Database-only mode - return mock response
      return {
        credentialId: Date.now().toString(),
        transactionHash: '0x' + '0'.repeat(64),
        blockNumber: 0
      };
    }

    try {
      const tx = await this.contracts.credentialRegistry.issueCredential(
        studentAddress,
        metadataURI
      );
      const receipt = await tx.wait();

      const iface = this.contracts.credentialRegistry.interface;
      const event = receipt.logs.find(log => {
        try {
          const parsed = iface.parseLog(log);
          return parsed && parsed.name === 'CredentialIssued';
        } catch (e) {
          return false;
        }
      });

      if (!event) {
        throw new Error('CredentialIssued event not found');
      }

      const parsedEvent = iface.parseLog(event);
      const credentialId = parsedEvent.args[0].toString();

      return {
        credentialId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error issuing credential:', error.message);
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  async getCredential(credentialId) {
    if (!this.contracts.credentialRegistry) {
      return null;
    }

    try {
      const credential = await this.contracts.credentialRegistry.credentials(credentialId);

      if (!credential || credential.student === ethers.ZeroAddress) {
        throw new Error('Credential not found');
      }

      return {
        id: credential.id.toString(),
        student: credential.student,
        issuer: credential.issuer,
        uri: credential.uri,
        issuedAt: Number(credential.issuedAt),
        revoked: credential.revoked
      };
    } catch (error) {
      console.error('Error getting credential:', error.message);
      throw error;
    }
  }

  async endorseCredential(credentialId) {
    if (!this.contracts.credentialRegistry) {
      return { transactionHash: '0x' + '0'.repeat(64), blockNumber: 0 };
    }

    try {
      const tx = await this.contracts.credentialRegistry.endorseCredential(credentialId);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error endorsing credential:', error.message);
      throw new Error(`Failed to endorse credential: ${error.message}`);
    }
  }

  async revokeCredential(credentialId) {
    if (!this.contracts.credentialRegistry) {
      return { transactionHash: '0x' + '0'.repeat(64), blockNumber: 0 };
    }

    try {
      const tx = await this.contracts.credentialRegistry.revokeCredential(credentialId);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error revoking credential:', error.message);
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }
  }

  async getEndorsementCount(credentialId) {
    if (!this.contracts.credentialRegistry) {
      return 0;
    }

    try {
      const count = await this.contracts.credentialRegistry.endorsementCount(credentialId);
      return Number(count);
    } catch (error) {
      return 0;
    }
  }

  async hasEndorsed(credentialId, validatorAddress) {
    if (!this.contracts.credentialRegistry) {
      return false;
    }

    try {
      if (!ethers.isAddress(validatorAddress)) return false;
      return await this.contracts.credentialRegistry.endorsements(credentialId, validatorAddress);
    } catch (error) {
      return false;
    }
  }

  // ===== STUDENT DID FUNCTIONS =====

  async getDID(studentAddress) {
    if (!this.contracts.studentDID) {
      return null;
    }

    try {
      return await this.contracts.studentDID.getDID(studentAddress);
    } catch (error) {
      return null;
    }
  }

  async verifyDIDRegistration(studentAddress) {
    const did = await this.getDID(studentAddress);
    return did && did.length > 0;
  }

  // ===== NFT BADGE FUNCTIONS =====

  async mintBadge(recipientAddress, credentialId, tokenURI) {
    if (!this.contracts.nftBadge) {
      return {
        tokenId: Date.now().toString(),
        transactionHash: '0x' + '0'.repeat(64),
        blockNumber: 0
      };
    }

    try {
      const tx = await this.contracts.nftBadge.mintBadge(recipientAddress, credentialId, tokenURI);
      const receipt = await tx.wait();

      const iface = this.contracts.nftBadge.interface;
      const event = receipt.logs.find(log => {
        try {
          const parsed = iface.parseLog(log);
          return parsed && parsed.name === 'BadgeMinted';
        } catch (e) {
          return false;
        }
      });

      if (!event) {
        throw new Error('BadgeMinted event not found');
      }

      const parsedEvent = iface.parseLog(event);
      const tokenId = parsedEvent.args[0].toString();

      return {
        tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error minting badge:', error.message);
      throw new Error(`Failed to mint badge: ${error.message}`);
    }
  }

  async getBadgesByStudent(studentAddress) {
    if (!this.contracts.nftBadge) {
      return [];
    }

    try {
      const balance = await this.contracts.nftBadge.balanceOf(studentAddress);
      const badges = [];

      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await this.contracts.nftBadge.tokenOfOwnerByIndex(studentAddress, i);
          badges.push({
            tokenId: tokenId.toString()
          });
        } catch (err) {
          console.warn(`Error fetching badge ${i}:`, err.message);
        }
      }

      return badges;
    } catch (error) {
      console.error('Error getting badges:', error.message);
      return [];
    }
  }

  // ===== FACULTY VALIDATOR FUNCTIONS =====

  async addFaculty(facultyAddress, name, department) {
    if (!this.contracts.facultyValidator) {
      return { transactionHash: '0x' + '0'.repeat(64), blockNumber: 0 };
    }

    try {
      const tx = await this.contracts.facultyValidator.addFaculty(facultyAddress, name, department);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error adding faculty:', error.message);
      throw new Error(`Failed to add faculty: ${error.message}`);
    }
  }

  async removeFaculty(facultyAddress) {
    if (!this.contracts.facultyValidator) {
      return { transactionHash: '0x' + '0'.repeat(64), blockNumber: 0 };
    }

    try {
      const tx = await this.contracts.facultyValidator.removeFaculty(facultyAddress);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error removing faculty:', error.message);
      throw new Error(`Failed to remove faculty: ${error.message}`);
    }
  }

  async getFaculty(facultyAddress) {
    if (!this.contracts.facultyValidator) {
      return null;
    }

    try {
      const faculty = await this.contracts.facultyValidator.faculties(facultyAddress);

      if (!faculty || faculty.account === ethers.ZeroAddress) {
        throw new Error('Faculty not found');
      }

      return {
        account: faculty.account,
        name: faculty.name,
        department: faculty.department,
        active: faculty.active
      };
    } catch (error) {
      console.error('Error getting faculty:', error.message);
      return null;
    }
  }

  async isFaculty(address) {
    if (!this.contracts.facultyValidator) {
      return false;
    }

    try {
      const faculty = await this.contracts.facultyValidator.faculties(address);
      return faculty && faculty.active;
    } catch {
      return false;
    }
  }
}

module.exports = new BlockchainService();