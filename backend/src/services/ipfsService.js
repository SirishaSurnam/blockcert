const axios = require('axios');

/**
 * IPFS Service using Pinata
 * Stores credential metadata on IPFS via Pinata API
 */
class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataApiSecret = process.env.PINATA_API_SECRET;
    this.pinataJWT = process.env.PINATA_JWT;
    
    // Pinata API endpoints
    this.pinataApiUrl = 'https://api.pinata.cloud';
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    
    // Check if Pinata is configured
    this.isConfigured = !!(this.pinataJWT || (this.pinataApiKey && this.pinataApiSecret));
    
    if (this.isConfigured) {
      console.log('✅ Pinata IPFS service configured');
    } else {
      console.log('⚠️ Pinata not configured, using mock IPFS');
    }
  }

  /**
   * Get headers for Pinata API requests
   */
  getHeaders() {
    if (this.pinataJWT) {
      return {
        'Authorization': `Bearer ${this.pinataJWT}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'pinata_api_key': this.pinataApiKey,
      'pinata_secret_api_key': this.pinataApiSecret,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Upload JSON to IPFS via Pinata
   * @param {Object} data - JSON data to upload
   * @param {string} name - Optional name for the file
   * @returns {Promise<string>} - IPFS URI (ipfs://hash)
   */
  async uploadJSON(data, name = 'credential') {
    if (!this.isConfigured) {
      return this.mockUpload();
    }

    try {
      const payload = {
        pinataContent: data,
        pinataMetadata: {
          name: `blockcert_${name}_${Date.now()}`,
          keyvalues: {
            type: 'credential',
            app: 'blockcert'
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      };

      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinJSONToIPFS`,
        payload,
        { headers: this.getHeaders() }
      );

      const hash = response.data.IpfsHash;
      console.log(`✅ Uploaded to IPFS: ${hash}`);
      
      return `ipfs://${hash}`;
    } catch (error) {
      console.error('Pinata upload error:', error.response?.data || error.message);
      // Fallback to mock
      return this.mockUpload();
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param {Buffer} fileBuffer - File content
   * @param {string} filename - Original filename
   * @returns {Promise<string>} - IPFS URI
   */
  async uploadFile(fileBuffer, filename) {
    if (!this.isConfigured) {
      return this.mockUpload();
    }

    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('file', fileBuffer, { filename });
      form.append('pinataMetadata', JSON.stringify({
        name: `blockcert_file_${Date.now()}`,
        keyvalues: { type: 'file', app: 'blockcert' }
      }));
      form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
        form,
        { 
          headers: {
            ...this.getHeaders(),
            ...form.getHeaders()
          }
        }
      );

      return `ipfs://${response.data.IpfsHash}`;
    } catch (error) {
      console.error('Pinata file upload error:', error.response?.data || error.message);
      return this.mockUpload();
    }
  }

  /**
   * Fetch JSON from IPFS
   * @param {string} ipfsUri - IPFS URI (ipfs://hash or hash)
   * @returns {Promise<Object|null>} - Parsed JSON or null
   */
  async fetchJSON(ipfsUri) {
    try {
      let hash = ipfsUri;
      if (ipfsUri.startsWith('ipfs://')) {
        hash = ipfsUri.replace('ipfs://', '');
      }

      // Try multiple gateways
      const gateways = [
        this.gatewayUrl,
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
      ];

      for (const gateway of gateways) {
        try {
          const response = await axios.get(`${gateway}${hash}`, { 
            timeout: 10000,
            headers: this.isConfigured ? this.getHeaders() : {}
          });
          return response.data;
        } catch (e) {
          continue;
        }
      }

      console.warn('Could not fetch from any gateway');
      return null;
    } catch (error) {
      console.error('IPFS fetch error:', error.message);
      return null;
    }
  }

  /**
   * Create credential metadata for IPFS
   * @param {Object} credential - Credential data
   * @returns {Promise<string>} - IPFS URI
   */
  async createCredentialMetadata(credential) {
    const metadata = {
      name: credential.title || 'Digital Credential',
      description: credential.description || 'Blockchain-verified credential',
      image: credential.image || `${process.env.FRONTEND_URL}/images/default-badge.png`,
      external_url: `${process.env.FRONTEND_URL}/verify/${credential.id}`,
      attributes: [
        { trait_type: 'Type', value: credential.type || 'Certificate' },
        { trait_type: 'Category', value: credential.category || 'General' },
        { trait_type: 'Issuer', value: credential.issuerName || 'BlockCert' },
        { trait_type: 'Issue Date', value: new Date().toISOString() },
        { trait_type: 'Grade', value: credential.grade || 'N/A' }
      ],
      properties: {
        studentAddress: credential.studentAddress,
        issuerAddress: credential.issuerAddress,
        course: credential.course,
        skills: credential.skills || [],
        credentialId: credential.id
      }
    };

    return this.uploadJSON(metadata, 'credential');
  }

  /**
   * Create badge metadata for IPFS (NFT)
   * @param {Object} badgeData - Badge data
   * @returns {Promise<string>} - IPFS URI
   */
  async createBadgeMetadata(badgeData) {
    const metadata = {
      name: `${badgeData.skillName} Badge`,
      description: `Level ${badgeData.level} achievement in ${badgeData.skillName}`,
      image: badgeData.image || `${process.env.FRONTEND_URL}/images/default-badge.png`,
      attributes: [
        { trait_type: 'Skill', value: badgeData.skillName },
        { trait_type: 'Level', value: badgeData.level },
        { trait_type: 'Category', value: badgeData.category || 'Technical' },
        { trait_type: 'Earned Date', value: new Date().toISOString() }
      ],
      properties: {
        studentAddress: badgeData.studentAddress,
        type: 'skill-badge',
        level: badgeData.level
      }
    };

    return this.uploadJSON(metadata, 'badge');
  }

  /**
   * Mock upload for development without Pinata
   */
  mockUpload() {
    const mockHash = `Qm${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    console.log(`📦 Mock IPFS upload: ${mockHash}`);
    return `ipfs://${mockHash}`;
  }

  /**
   * Test Pinata connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'Pinata not configured' };
    }

    try {
      const response = await axios.get(
        `${this.pinataApiUrl}/data/testAuthentication`,
        { headers: this.getHeaders() }
      );
      
      return { 
        success: true, 
        message: 'Pinata connection successful',
        data: response.data
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error?.reason || error.message 
      };
    }
  }

  /**
   * Get pinned files list from Pinata
   */
  async getPinnedFiles(limit = 10) {
    if (!this.isConfigured) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.pinataApiUrl}/data/pinList?status=pinned&pageLimit=${limit}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.rows || [];
    } catch (error) {
      console.error('Error fetching pinned files:', error.message);
      return [];
    }
  }

  /**
   * Unpin file from Pinata
   * @param {string} hash - IPFS hash to unpin
   */
  async unpin(hash) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await axios.delete(
        `${this.pinataApiUrl}/pinning/unpin/${hash}`,
        { headers: this.getHeaders() }
      );
      console.log(`🗑️ Unpinned: ${hash}`);
      return true;
    } catch (error) {
      console.error('Unpin error:', error.message);
      return false;
    }
  }
}

module.exports = new IPFSService();