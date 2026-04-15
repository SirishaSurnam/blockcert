#!/bin/bash
echo "Setting up BlockCert environment variables for Codespaces..."

# Backend
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/blockcert}
JWT_SECRET=${JWT_SECRET:-your_secure_jwt_secret_here}
PINATA_API_KEY=${PINATA_API_KEY:-your_pinata_api_key_here}
PINATA_API_SECRET=${PINATA_API_SECRET:-your_pinata_api_secret_here}
PINATA_JWT=${PINATA_JWT:-your_pinata_jwt_here}
EOF

# Python Service
cat > python_service/.env << EOF
FLASK_PORT=5001
NODE_BACKEND_URL=http://localhost:5000
GEMINI_API_KEY=${GEMINI_API_KEY:-your_google_gemini_api_key_here}
REDIS_URL=redis://localhost:6379
EOF

# AI Engine
cat > ai-engine/.env << EOF
PORT=5002
PYTHON_SERVICE_URL=http://localhost:5001
EOF

# Frontend
cat > src/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_AI_API_URL=http://localhost:5001/api/ai
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=localhost
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_APP_NAME=BlockCert
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
NODE_ENV=development
EOF

echo "✅ Environment files created!"
echo ""
echo "📝 Next steps:"
echo "1. If using Codespaces secrets, make sure JWT_SECRET and GEMINI_API_KEY are set"
echo "2. For MongoDB, consider using MongoDB Atlas (free tier available)"
echo "3. Update placeholder values in .env files with your actual keys"
echo ""
echo "🚀 Ready to run: npm run install:all"
