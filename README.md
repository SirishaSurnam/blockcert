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

## 📚 API Documentation

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
