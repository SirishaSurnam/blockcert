#!/bin/bash
echo "Setting up BlockCert environment variables for Codespaces..."

# Backend
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/blockcert}
JWT_SECRET=${JWT_SECRET:-your_secure_jwt_secret_here}
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

echo "✅ Environment files created!"
echo ""
echo "📝 Next steps:"
echo "1. If using Codespaces secrets, make sure JWT_SECRET and GEMINI_API_KEY are set"
echo "2. For MongoDB, consider using MongoDB Atlas (free tier available)"
echo "3. Update placeholder values in .env files with your actual keys"
echo ""
echo "🚀 Ready to run: npm run install:all"