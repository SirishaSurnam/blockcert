const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class WalletPoolService {
  constructor() {
    this.availableWallets = [];
    this.assignedWallets = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (!process.env.BLOCKCHAIN_RPC_URL) {
        console.log('⚠️ No BLOCKCHAIN_RPC_URL, using mock wallets');
        return;
      }

      const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
      const accounts = await provider.listAccounts();
      
      // Convert to strings (handles different formats)
      const addressList = accounts.map(acc => {
        if (typeof acc === 'string') return acc;
        if (acc && acc.address) return acc.address;
        return String(acc);
      });
      
      console.log(`🔑 Found ${addressList.length} Hardhat accounts`);
      
      // Load existing assignments
      this.loadAssignedWallets();
      
      // Skip account[0] (deployer), use accounts 1-19 for users
      this.availableWallets = addressList.slice(1).filter(addr => {
        const addrLower = String(addr).toLowerCase();
        return !this.assignedWallets.has(addrLower);
      });
      
      console.log(`📋 Wallet pool: ${this.availableWallets.length} available, ${this.assignedWallets.size} assigned`);
      
      this.initialized = true;
    } catch (error) {
      console.error('Wallet pool init error:', error.message);
    }
  }

  loadAssignedWallets() {
    const dataPath = path.join(__dirname, '../data/wallet-assignments.json');
    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        for (const [wallet, userId] of Object.entries(data)) {
          this.assignedWallets.set(wallet.toLowerCase(), userId);
        }
      }
    } catch (error) {
      console.warn('Could not load wallet assignments:', error.message);
    }
  }

  saveAssignedWallets() {
    const dataDir = path.join(__dirname, '../data');
    const dataPath = path.join(dataDir, 'wallet-assignments.json');
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(this.assignedWallets), null, 2));
    } catch (error) {
      console.error('Failed to save wallet assignments:', error.message);
    }
  }

  async assignWallet(userId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.availableWallets.length === 0) {
        console.warn('⚠️ No wallets available in pool');
        return null;
      }

      const walletAddress = String(this.availableWallets.shift());
      this.assignedWallets.set(walletAddress.toLowerCase(), userId);
      this.saveAssignedWallets();
      
      console.log(`✅ Assigned wallet ${walletAddress} to ${userId}`);
      console.log(`📋 ${this.availableWallets.length} wallets remaining`);
      
      return walletAddress;
    } catch (error) {
      console.error('Assign wallet error:', error.message);
      return null;
    }
  }

  releaseWallet(walletAddress) {
    const normalized = String(walletAddress).toLowerCase();
    if (this.assignedWallets.has(normalized)) {
      this.assignedWallets.delete(normalized);
      this.availableWallets.push(walletAddress);
      this.saveAssignedWallets();
    }
  }

  isRealWallet(walletAddress) {
    return this.assignedWallets.has(String(walletAddress).toLowerCase());
  }

  getStatus() {
    return {
      total: 19,
      available: this.availableWallets.length,
      assigned: this.assignedWallets.size
    };
  }
}

module.exports = new WalletPoolService();