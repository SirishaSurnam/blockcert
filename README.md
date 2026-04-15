# BlockCert - Blockchain-Based Credential Verification System

A comprehensive, decentralized platform for issuing, verifying, and managing academic and professional credentials using blockchain technology, NFT badges, and AI-powered career guidance.

## 🚀 Features

### Core Functionality
- **NFT Skill Badges**: Every validated competency becomes a unique, verifiable NFT on blockchain
- **Blockchain Verification**: Immutable credential storage with public verification via QR codes
- **AI Career Guidance**: Personalized career recommendations based on skill profiles
- **Skill Tree Visualization**: Interactive progress tracking from beginner to expert levels
- **Multi-Role Support**: Students, faculty, institutions, and employers

### Technical Highlights
- **Decentralized Identity**: Student DID management for secure, portable credentials
- **Smart Contracts**: Solidity-based credential registry and NFT badge contracts
- **AI Integration**: Python microservice with PyTorch and Sentence Transformers
- **Real-time Analytics**: Dashboard with skill growth metrics and class comparisons
- **Gamification**: Achievement system with milestones and leaderboards

## 🏗️ Architecture

```
BlockCert/
├── src/                    # Next.js frontend (React/TypeScript)
│   ├── app/               # App router pages and components
│   ├── components/        # Reusable UI components
│   └── lib/               # Utilities and API clients
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   └── services/      # External integrations
│   └── uploads/           # File storage
├── blockchain/            # Hardhat Ethereum development
│   ├── contracts/         # Solidity smart contracts
│   ├── scripts/           # Deployment and testing
│   └── test/              # Contract tests
├── python_service/        # AI microservice (Flask)
│   ├── app.py            # Main AI service
│   └── requirements.txt   # Python dependencies
└── ai-engine/             # Node.js AI integration layer
    ├── server.js         # Express server for AI endpoints
    └── controllers/      # AI request handlers
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, MongoDB, JWT authentication
- **Blockchain**: Solidity, Hardhat, OpenZeppelin, Ethereum
- **AI/ML**: Python, PyTorch, Sentence Transformers, Flask
- **Infrastructure**: Docker, Redis (optional caching)

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB
- Git
- (Optional) Redis for caching
- (Optional) Hardhat/Ganache for local blockchain

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd blockcert

# Install all dependencies
npm run install:all
```

### 2. Environment Setup

Create `.env` files in each service directory:

**backend/.env**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blockcert
JWT_SECRET=your_jwt_secret
```

**python_service/.env**:
```env
FLASK_PORT=5001
NODE_BACKEND_URL=http://localhost:5000
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379
```

**ai-engine/.env**:
```env
PORT=5002
PYTHON_SERVICE_URL=http://localhost:5001
```

### 3. Start Services

#### Option A: Manual Startup
```bash
# Terminal 1: MongoDB (if not running)
mongod

# Terminal 2: Blockchain (optional)
cd blockchain
npx hardhat node

# Terminal 3: Backend
cd backend
npm run dev

# Terminal 4: Python AI Service
cd python_service
python app.py

# Terminal 5: AI Engine
cd ai-engine
npm start

# Terminal 6: Frontend
cd src
npm run dev
```

#### Option B: Using Test Script
```bash
# Run comprehensive test suite
./ai-engine/test_all.ps1
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001
- **AI Engine**: http://localhost:5002

## � GitHub Codespaces Setup

Since `.env` files are not committed to the repository, you'll need to create them when running in Codespaces:

### Option 1: Create .env files manually in Codespaces

1. **Open Codespaces terminal** and create the required `.env` files:

```bash
# Backend environment
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blockcert
JWT_SECRET=your_secure_jwt_secret_here
EOF

# Python service environment
cat > python_service/.env << EOF
FLASK_PORT=5001
NODE_BACKEND_URL=http://localhost:5000
GEMINI_API_KEY=your_google_gemini_api_key_here
REDIS_URL=redis://localhost:6379
EOF

# AI Engine environment
cat > ai-engine/.env << EOF
PORT=5002
PYTHON_SERVICE_URL=http://localhost:5001
EOF
```

2. **Replace placeholder values** with your actual API keys and secrets.

### Option 2: Use Codespaces Secrets (Recommended for Production)

1. Go to your repository **Settings** → **Codespaces** → **Secrets**
2. Add these secrets:
   - `JWT_SECRET`: Your JWT secret key
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `MONGODB_URI`: MongoDB connection string (use MongoDB Atlas for Codespaces)

3. **Create a setup script** in your repository root:

```bash
# Create setup_codespaces.sh
cat > setup_codespaces.sh << 'EOF'
#!/bin/bash
echo "Setting up BlockCert environment variables..."

# Backend
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/blockcert}
JWT_SECRET=$JWT_SECRET
EOF

# Python Service
cat > python_service/.env << EOF
FLASK_PORT=5001
NODE_BACKEND_URL=http://localhost:5000
GEMINI_API_KEY=$GEMINI_API_KEY
REDIS_URL=redis://localhost:6379
EOF

# AI Engine
cat > ai-engine/.env << EOF
PORT=5002
PYTHON_SERVICE_URL=http://localhost:5001
EOF

echo "Environment files created!"
echo "Note: Make sure to set JWT_SECRET and GEMINI_API_KEY in Codespaces secrets"
EOF

chmod +x setup_codespaces.sh
```

4. **Run the setup script** in Codespaces:
```bash
./setup_codespaces.sh
```

### Option 3: Use Codespace Configuration

Create a `.devcontainer/devcontainer.json` file in your repository:

```json
{
  "name": "BlockCert Development",
  "dockerFile": "Dockerfile",
  "settings": {},
  "extensions": [
    "ms-vscode.vscode-typescript-next",
    "ms-python.python",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode"
  ],
  "forwardPorts": [3000, 5000, 5001, 5002, 8545],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "notify"
    },
    "5000": {
      "label": "Backend API",
      "onAutoForward": "notify"
    },
    "5001": {
      "label": "Python AI Service",
      "onAutoForward": "notify"
    },
    "5002": {
      "label": "AI Engine",
      "onAutoForward": "notify"
    }
  },
  "postCreateCommand": "./setup_codespaces.sh",
  "secrets": {
    "JWT_SECRET": {
      "description": "JWT secret for authentication"
    },
    "GEMINI_API_KEY": {
      "description": "Google Gemini API key for AI features"
    }
  }
}
```

### Running in Codespaces

1. **Open Codespaces** from your GitHub repository
2. **Set up environment variables** using one of the options above
3. **Install dependencies**:
```bash
npm run install:all
```
4. **Start services** (you may need multiple terminals):
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Python Service  
cd python_service && python app.py

# Terminal 3: AI Engine
cd ai-engine && npm start

# Terminal 4: Frontend
cd src && npm run dev
```

### Accessing Your App in Codespaces

- **Frontend**: Click the "Ports" tab → Forwarded address for port 3000
- **Backend API**: Port 5000
- **Python AI Service**: Port 5001
- **AI Engine**: Port 5002

### Database Setup in Codespaces

For MongoDB, you have two options:

1. **Use MongoDB Atlas** (recommended):
   - Create a free cluster at mongodb.com
   - Add your Codespaces IP to whitelist (0.0.0.0/0 for development)
   - Use the connection string in `MONGODB_URI`

2. **Use local MongoDB** (if available in Codespaces environment)

### Troubleshooting Codespaces

- **Port conflicts**: Codespaces may have different port assignments
- **Memory limits**: Close unused terminals and processes
- **Environment variables**: Double-check your `.env` files after creation
- **Dependencies**: Some packages may need additional setup in the container

---

## �📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Credential Management
- `POST /api/credentials/issue` - Issue new credential
- `GET /api/credentials/:id` - Get credential details
- `GET /api/credentials/verify/:id` - Verify credential

### AI Services
- `POST /api/ai/career-guidance` - Get career recommendations
- `POST /api/ai/skill-gap` - Analyze skill gaps
- `POST /api/ai/chat` - AI-powered chat support

### Public Verification
- `GET /api/public/verify/:credentialId` - Public credential verification
- `GET /api/public/institute/:instituteId` - Institute information

## 🧪 Testing

Run the comprehensive test suite:

```bash
./ai-engine/test_all.ps1
```

This tests:
- Service health checks
- AI functionality
- API endpoints
- Integration between services

## 🚀 Deployment

### Production Setup

1. **Environment Variables**: Set production values for all `.env` files
2. **Database**: Use MongoDB Atlas for production database
3. **Blockchain**: Deploy contracts to testnet/mainnet
4. **AI Keys**: Configure production API keys
5. **Build Frontend**:
   ```bash
   cd src
   npm run build
   npm start
   ```

### Docker Deployment (Optional)

```bash
# Build all services
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Guidelines
- Use TypeScript for frontend components
- Follow ESLint/Prettier configurations
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation
- Review the test suite for common problems

## 🔄 Recent Updates

- Cleaned repository: removed build artifacts and unnecessary files
- Consolidated documentation into single README
- Streamlined testing to single comprehensive test suite
- Updated dependencies to latest stable versions

---

**BlockCert** - Transforming education through blockchain technology.
