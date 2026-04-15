const QRCode = require('qrcode');

class QRService {
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate QR code for credential verification
   */
  async generateCredentialQR(credentialId, studentAddress) {
    const verificationUrl = `${this.frontendUrl}/verify/${credentialId}`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1F4E79',
          light: '#FFFFFF'
        }
      });

      return {
        qrCode: qrCodeDataURL,
        verificationUrl,
        credentialId
      };
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for student profile
   */
  async generateProfileQR(studentAddress, studentName) {
    const profileUrl = `${this.frontendUrl}/public-profile/${studentAddress}`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#FFFFFF'
        }
      });

      return {
        qrCode: qrCodeDataURL,
        profileUrl,
        studentName
      };
    } catch (error) {
      console.error('Profile QR generation error:', error);
      throw error;
    }
  }

  /**
   * Generate downloadable QR code as PNG buffer
   */
  async generateDownloadableQR(url, filename) {
    try {
      const buffer = await QRCode.toBuffer(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        buffer,
        filename,
        mimeType: 'image/png'
      };
    } catch (error) {
      console.error('Downloadable QR generation error:', error);
      throw error;
    }
  }

  /**
   * Parse QR code data
   */
  parseQRData(qrData) {
    try {
      // Try to parse as JSON
      if (qrData.startsWith('{')) {
        const data = JSON.parse(qrData);
        return data;
      }

      // Parse as URL
      if (qrData.startsWith('http')) {
        const url = new URL(qrData);
        const pathParts = url.pathname.split('/').filter(Boolean);

        if (pathParts[0] === 'verify' && pathParts[1]) {
          return {
            type: 'credential',
            id: pathParts[1],
            studentAddress: url.searchParams.get('student')
          };
        }

        if (pathParts[0] === 'public-profile' && pathParts[1]) {
          return {
            type: 'profile',
            studentAddress: pathParts[1]
          };
        }

        if (pathParts[0] === 'profile' && pathParts[1]) {
          return {
            type: 'profile',
            studentAddress: pathParts[1]
          };
        }

        return { type: 'url', url: qrData };
      }

      // Return raw data
      return { type: 'raw', data: qrData };
    } catch (error) {
      return { error: 'Invalid QR data format' };
    }
  }
}

module.exports = new QRService();