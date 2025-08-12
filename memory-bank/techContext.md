# Technical Context - Crit Genius Listener

**Last Updated:** 2025-01-08 20:31 PST **Version:** 2.0.0 **Dependencies:** projectbrief.md,
productContext.md, systemPatterns.md

## Technology Stack (Context7 Validated)

### Core Technology Stack

Based on comprehensive Context7 analysis confirming excellent documentation quality and feature
alignment:

**Frontend Technology:**

- **React** with TypeScript for UI components and state management
- **Web Audio API** for real-time audio capture and processing
- **WebSocket** connections for real-time transcription streaming
- **Material-UI** or **Tailwind CSS** for responsive UI components

**Backend Services:**

- **Node.js** with Express framework for API services
- **AssemblyAI Node SDK** for speech-to-text and speaker diarization
- **WebSocket.io** for real-time client communication
- **TypeScript** for type safety and development efficiency

**Data Storage:**

- **MongoDB** for session data and speaker profiles (NoSQL flexibility)
- **Redis** for real-time session state and caching
- **File Storage** for audio artifacts (cloud-based or local)

**Infrastructure:**

- **Docker** containerization for consistent deployment
- **HTTPS/WSS** for secure audio streaming
- **Cloud deployment** (AWS/GCP/Azure) with auto-scaling

## Programming Languages

**Primary Languages:**

- **TypeScript/JavaScript** (Frontend and Backend)
  - React frontend development
  - Node.js backend services
  - AssemblyAI SDK integration
  - Real-time WebSocket communication

**Configuration Languages:**

- **YAML** for CI/CD pipeline configuration
- **JSON** for package management and configuration
- **Dockerfile** for containerization

## Frameworks and Libraries

### Frontend Framework Stack

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "react-dom": "^18.0.0",
  "web-audio-api": "native browser API",
  "socket.io-client": "^4.0.0",
  "material-ui/core": "^5.0.0" || "tailwindcss": "^3.0.0"
}
```

### Backend Framework Stack

```json
{
  "express": "^4.18.0",
  "socket.io": "^4.0.0",
  "assemblyai": "^4.0.0",
  "mongodb": "^6.0.0",
  "redis": "^4.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "dotenv": "^16.0.0"
}
```

### Testing Framework Stack

```json
{
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "cypress": "^13.0.0",
  "supertest": "^6.3.0"
}
```

## Development Tools

**IDE and Development Environment:**

- **VSCode** with extensions:
  - TypeScript and JavaScript Language Features
  - React snippets and IntelliSense
  - Docker extension
  - MongoDB for VS Code
- **AI Assistant:** Cline with Memory Bank system
- **Version Control:** Git with GitHub integration
- **Package Management:** npm or yarn

**Development Workflow Tools:**

- **ESLint** for code quality and consistency
- **Prettier** for code formatting
- **Husky** for Git hooks and pre-commit checks
- **Docker Compose** for local development environment

## Infrastructure and Deployment

**Containerization:**

```dockerfile
# Frontend Container (React)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend Container (Node.js)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "run", "start"]
```

**Cloud Infrastructure (Recommended):**

- **Container Orchestration:** Docker Swarm or Kubernetes
- **Load Balancer:** AWS ALB, GCP Load Balancer, or Azure Load Balancer
- **CDN:** CloudFront, CloudFlare, or Azure CDN
- **Auto Scaling:** Based on CPU/memory utilization and WebSocket connections

## Database Technologies

**Primary Database (MongoDB):**

```javascript
// Session Data Schema
{
  _id: ObjectId,
  sessionId: string,
  timestamp: Date,
  participants: [{
    speakerId: string,
    characterName: string,
    voiceProfile: Object
  }],
  transcript: [{
    timestamp: Date,
    speakerId: string,
    text: string,
    confidence: number
  }],
  metadata: {
    duration: number,
    audioQuality: string,
    processingLatency: number[]
  }
}
```

**Caching Layer (Redis):**

```javascript
// Real-time Session State
session:{sessionId} = {
  activeParticipants: Set<speakerId>,
  currentTranscript: string,
  speakerMappings: Map<speakerId, characterName>,
  connectionStatus: "active" | "paused" | "ended"
}
```

## APIs and Integrations

**AssemblyAI Integration (Context7 Validated):**

```javascript
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

// Real-time transcription with speaker diarization
const rt = client.streaming.transcriber({
  sampleRate: 16_000,
});

rt.on('transcript', transcript => {
  // Process real-time transcript with speaker labels
  const { text, speaker } = transcript;
  // Map to character and broadcast to clients
});
```

**Web Audio API Implementation:**

```javascript
// Real-time audio capture
const audioContext = new AudioContext();
const mediaStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  },
});

const source = audioContext.createMediaStreamSource(mediaStream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);
// Stream audio chunks to AssemblyAI via WebSocket
```

**CritGenius Ecosystem APIs:**

```javascript
// API Endpoints for ecosystem integration
app.post('/api/export/prompter', exportToPrompter);
app.post('/api/export/llm', exportToLLM);
app.post('/api/export/publisher', exportToPublisher);
app.get('/api/sessions/:id/transcript', getTranscript);
app.ws('/api/live-transcript/:id', liveTranscriptStream);
```

## Testing Framework

**Comprehensive Testing Strategy:**

```javascript
// Unit Tests (Jest + Testing Library)
describe('Audio Capture Component', () => {
  test('requests microphone permission', async () => {
    // Test microphone permission handling
  });

  test('handles permission denied gracefully', async () => {
    // Test error handling for denied permissions
  });
});

// Integration Tests
describe('AssemblyAI Integration', () => {
  test('processes real-time audio stream', async () => {
    // Test end-to-end audio processing pipeline
  });
});

// Performance Tests (Custom)
describe('Latency Requirements', () => {
  test('end-to-end latency under 500ms', async () => {
    // Measure audio-to-transcript latency
  });
});
```

## Build and CI/CD

**GitHub Actions Workflow:**

```yaml
name: CritGenius Listener CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t critgenius-listener .
      - run: docker push ${{ secrets.REGISTRY_URL }}/critgenius-listener
```

## Monitoring and Logging

**Application Performance Monitoring:**

- **Frontend:** Browser performance monitoring with Core Web Vitals
- **Backend:** Node.js APM with real-time metrics
- **Real-time Latency:** Custom metrics for audio-to-transcript latency
- **Error Tracking:** Comprehensive error logging and alerting

**Logging Strategy:**

```javascript
// Structured logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Performance metrics logging
logger.info('Audio processing latency', {
  sessionId,
  latency: processingTime,
  accuracy: transcriptionAccuracy,
  speakerCount: detectedSpeakers,
});
```

## Security Tools and Practices

**Security Implementation:**

- **HTTPS/WSS:** Encrypted communication for audio streams
- **API Key Management:** Secure environment variable handling
- **CORS Configuration:** Controlled cross-origin resource sharing
- **Input Validation:** Comprehensive data sanitization
- **Rate Limiting:** Protection against API abuse

**Security Configuration:**

```javascript
// Helmet.js for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 'wss:', 'https://api.assemblyai.com'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  })
);
```

## Development Environment Setup

**Local Development:**

```bash
# Development environment setup
git clone https://github.com/crit-genius/listener.git
cd listener
npm install
cp .env.example .env
# Configure ASSEMBLYAI_API_KEY and other environment variables
docker-compose up -d mongodb redis
npm run dev
```

**Environment Variables:**

```bash
# .env.example
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/critgenius-listener
REDIS_URI=redis://localhost:6379
ASSEMBLYAI_API_KEY=your_api_key_here
SESSION_SECRET=your_session_secret
ALLOWED_ORIGINS=http://localhost:3000
```

## Technical Constraints

**Performance Constraints:**

- **Latency Requirement:** <500ms end-to-end audio-to-transcript processing
- **Accuracy Targets:** >95% transcription accuracy, >90% speaker identification
- **Browser Compatibility:** Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **Network Requirements:** Stable internet connection for AssemblyAI service

**Resource Constraints:**

- **Memory Usage:** Optimized for continuous audio processing
- **CPU Usage:** Real-time processing without blocking UI
- **Storage:** Efficient session data management with cleanup policies
- **Bandwidth:** Optimized audio streaming with compression

## Performance Requirements

**System Performance Targets:**

- **End-to-end Latency:** <500ms (Target: <300ms)
- **Transcription Accuracy:** >95% (Target: >97%)
- **Speaker Identification:** >90% (Target: >93%)
- **System Uptime:** >99.9% during active sessions
- **Audio Processing:** >99.5% sessions without dropouts

**Scalability Requirements:**

- **Concurrent Sessions:** Support for 100+ simultaneous sessions
- **Database Performance:** <100ms query response times
- **WebSocket Connections:** 1000+ concurrent connections
- **Auto-scaling:** Dynamic resource allocation based on usage

## Third-Party Dependencies

**Critical Dependencies (Context7 Validated):**

- **AssemblyAI:** Real-time transcription and speaker diarization service
- **MongoDB Atlas:** Cloud database service for production
- **Redis Cloud:** Managed caching service
- **Cloud Provider:** AWS/GCP/Azure for infrastructure
- **CDN Service:** CloudFlare or AWS CloudFront for asset delivery

**Development Dependencies:**

- **npm/yarn:** Package management
- **Docker:** Containerization and local development
- **GitHub Actions:** CI/CD pipeline automation
- **ESLint/Prettier:** Code quality and formatting tools

## Notes

- Technology stack validated through comprehensive Context7 analysis
- AssemblyAI and Web Audio API confirmed excellent documentation quality
- Architecture optimized for real-time performance and CritGenius integration
- Scalability planning includes microservices migration path
- Security implementation follows industry best practices

## Reference Links

- **Dependencies:** ../memory-bank/projectbrief.md, ../memory-bank/productContext.md,
  ../memory-bank/systemPatterns.md
- **Next Dependencies:** activeContext.md
- **Architecture Strategy:** ../architecture-strategy-evaluation-critgenius-listener.md
- **AssemblyAI Documentation:** https://www.assemblyai.com/docs
- **Web Audio API Specification:** https://webaudio.github.io/web-audio-api/