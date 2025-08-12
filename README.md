# CritGenius Listener

> Real-time audio capture and transcription component for the CritGenius ecosystem

## Overview

CritGenius Listener is a modular monolith application that provides real-time audio capture,
transcription, and speaker identification capabilities. Built as part of the CritGenius ecosystem,
it seamlessly integrates with other components for comprehensive content analysis and publishing
workflows.

## Architecture

- **Pattern**: Modular monolith with microservices migration capability
- **Technology Stack**: Node.js, React, TypeScript, AssemblyAI, MongoDB, Redis
- **Real-time Features**: WebSocket connections, streaming audio processing
- **Privacy-first Design**: Local processing capabilities, configurable data retention

## Packages

This monorepo contains three main packages:

### 📱 Client (`packages/client`)

React-based frontend application providing:

- Real-time audio capture interface
- Live transcription display with speaker mapping
- Session management and export capabilities
- Integration with CritGenius ecosystem services

**Technologies**: React, TypeScript, Vite, Web Audio API, WebSocket

### ⚙️ Server (`packages/server`)

Node.js backend processing engine featuring:

- Real-time audio stream processing
- AssemblyAI transcription integration
- Speaker identification and management
- RESTful API and WebSocket server
- Data persistence with MongoDB and Redis

**Technologies**: Node.js, Express, WebSocket, AssemblyAI, MongoDB, Redis

### 📦 Shared (`packages/shared`)

TypeScript shared library containing:

- Common type definitions
- Utility functions and constants
- API interfaces and schemas
- Validation helpers

**Technologies**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB instance
- Redis instance
- AssemblyAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jonahkeegan/critgenius-listener.git
   cd critgenius-listener
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**

   ```bash
   # Start all packages in development mode
   pnpm dev

   # Or start individual packages
   pnpm --filter @critgenius/listener-server dev
   pnpm --filter @critgenius/listener-client dev
   ```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/critgenius-listener
REDIS_URL=redis://localhost:6379

# CritGenius Ecosystem
CRITGENIUS_ECOSYSTEM_BASE_URL=http://localhost:3000
CRITGENIUS_PROMPTER_URL=http://localhost:3001
CRITGENIUS_LLM_URL=http://localhost:3002
CRITGENIUS_PUBLISHER_URL=http://localhost:3003

# Application Configuration
NODE_ENV=development
PORT=3100
CLIENT_PORT=3101
```

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev              # Start all packages in watch mode
pnpm dev:client       # Start only client
pnpm dev:server       # Start only server

# Building
pnpm build            # Build all packages
pnpm build:client     # Build client package
pnpm build:server     # Build server package
pnpm build:shared     # Build shared package

# Testing
pnpm test             # Run tests in all packages
pnpm test:client      # Test client package
pnpm test:server      # Test server package

# Linting
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
```

### Package Management

This project uses pnpm workspaces. Key commands:

```bash
# Add dependency to specific package
pnpm --filter @critgenius/listener-client add react-query

# Add dev dependency to root
pnpm add -D -w eslint

# Run script in specific package
pnpm --filter @critgenius/listener-server test

# Run script in all packages
pnpm -r build
```

## API Endpoints

### Server APIs (`packages/server`)

| Endpoint                    | Method       | Description                         |
| --------------------------- | ------------ | ----------------------------------- |
| `/api/transcription/stream` | WebSocket    | Real-time transcription stream      |
| `/api/transcription/upload` | POST         | Upload audio file for transcription |
| `/api/speakers/identify`    | POST         | Identify speakers in audio          |
| `/api/speakers/manage`      | GET/POST/PUT | Manage speaker profiles             |
| `/api/session/create`       | POST         | Create new transcription session    |
| `/api/session/list`         | GET          | List user sessions                  |
| `/api/export/*`             | GET          | Export transcripts (JSON/TXT/PDF)   |
| `/api/integration/webhooks` | POST         | Ecosystem integration webhooks      |
| `/api/health`               | GET          | Health check endpoint               |

## CritGenius Ecosystem Integration

The Listener component integrates with other CritGenius services:

- **CritGenius Prompter**: Generates context-aware prompts from transcriptions
- **CritGenius LLM**: Processes transcripts for insights and analysis
- **CritGenius Publisher**: Publishes processed content to various platforms

Integration is configured through environment variables and follows the CritGenius ecosystem
metadata standards.

## Features

### 🎙️ Audio Processing

- Real-time audio capture from microphone
- Support for various audio formats
- Audio quality optimization and noise reduction

### 📝 Transcription

- Real-time transcription via AssemblyAI
- High accuracy with punctuation and formatting
- Custom vocabulary and domain-specific models

### 👥 Speaker Identification

- Automatic speaker detection and separation
- Speaker labeling and management
- Visual speaker mapping in transcripts

### 💾 Data Management

- Session-based organization
- Configurable data retention policies
- GDPR-compliant data handling
- Export in multiple formats (JSON, TXT, PDF)

### 🔗 Ecosystem Integration

- Seamless connection to CritGenius services
- Webhook-based event system
- Service discovery through metadata

## Development Guidelines

### Code Quality

- TypeScript strict mode enabled
- ESLint with CritGenius-specific rules
- Prettier for consistent formatting
- Husky for pre-commit hooks

### Testing Strategy

- Unit tests with Vitest
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage reporting

### Architecture Principles

- Modular monolith design
- Dependency injection
- Event-driven communication
- Privacy by design
- Containerization ready

## Deployment

### Docker Support

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -f packages/server/Dockerfile .
docker build -f packages/client/Dockerfile .
```

### Production Environment

- Configure environment variables for production
- Set up MongoDB and Redis instances
- Configure AssemblyAI production API key
- Set up monitoring and logging
- Configure HTTPS and security headers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@critgenius.com
- 🐛 Issues: [GitHub Issues](https://github.com/jonahkeegan/critgenius-listener/issues)
- 📖 Documentation: [CritGenius Docs](https://docs.critgenius.com)
- 💬 Community: [CritGenius Discord](https://discord.gg/critgenius)

---

**CritGenius Listener** - Empowering real-time audio analysis for the modern content creator.