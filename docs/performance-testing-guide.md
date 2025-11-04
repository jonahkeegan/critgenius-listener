# Performance Testing Guide - Specialized Procedures Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** Developers conducting
performance tests **Status:** Complete

---

## Table of Contents

1. [Performance Test Architecture](#1-performance-test-architecture)
2. [Audio Processing Benchmarks](#2-audio-processing-benchmarks)
3. [Socket.IO Load Testing](#3-socketio-load-testing)
4. [Memory and Resource Monitoring](#4-memory-and-resource-monitoring)

---

## 1. Performance Test Architecture

The performance testing suite uses a dedicated configuration that extends the shared Vitest setup
with performance-specific features.

### 1.1 Configuration Setup

```typescript
// vitest.performance.config.ts
import { defineConfig } from 'vitest/config';
import { assertUsesSharedConfig, createVitestConfig } from './vitest.shared.config';

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'node',
      testOverrides: {
        testTimeout: 30000, // Extended timeout for performance tests
        hookTimeout: 10000,
      },
    })
  )
);
```

### 1.2 Running Performance Tests

```bash
# Run all performance tests
pnpm test --config vitest.performance.config.ts

# Run specific performance test
pnpm test --config vitest.performance.config.ts audio-processing-performance.test.ts

# Generate performance report
pnpm test --config vitest.performance.config.ts --reporter=verbose
```

---

## 2. Audio Processing Benchmarks

Test audio processing performance under various conditions and load scenarios.

### 2.1 Basic Audio Processing Performance

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { createTestAudioChunk } from '@critgenius/test-utils/factories';
import { AudioProcessor } from './audio-processor';

describe('audio processing performance', () => {
  beforeAll(() => {
    installTestRuntime();
  });

  it('processes audio chunks within acceptable time limits', async () => {
    const processor = new AudioProcessor();
    const audioChunks = Array.from({ length: 100 }, (_, i) =>
      createTestAudioChunk({
        duration: 1000, // 1 second chunks
        sampleRate: 44100,
        channels: 2,
      })
    );

    const startTime = performance.now();

    for (const chunk of audioChunks) {
      await processor.processChunk(chunk);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Assert processing completes within acceptable time
    expect(totalTime).toBeLessThan(5000); // Should process 100 chunks in under 5 seconds
    expect(totalTime / audioChunks.length).toBeLessThan(50); // Average under 50ms per chunk
  });

  it('handles high-frequency audio input without degradation', async () => {
    const processor = new AudioProcessor();

    // Create audio chunks with minimal intervals (10ms apart)
    const chunks = Array.from({ length: 50 }, (_, i) =>
      createTestAudioChunk({
        timestamp: i * 10, // 10ms intervals
        duration: 100,
        sampleRate: 48000,
      })
    );

    const results = await Promise.all(chunks.map(chunk => processor.processChunk(chunk)));

    // Verify no chunks are dropped or delayed
    expect(results).toHaveLength(50);
    expect(results.every(r => r.processed)).toBe(true);
  });
});
```

### 2.2 Realistic Example: D&D Session Audio Load Testing

```typescript
describe('D&D session audio load simulation', () => {
  it('maintains performance during 2-hour session simulation', async () => {
    const sessionDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const chunkDuration = 500; // 500ms audio chunks
    const totalChunks = Math.floor(sessionDuration / chunkDuration);

    const processor = new AudioProcessor();
    const performanceMetrics = {
      chunksProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
    };

    const startTime = performance.now();

    // Simulate audio chunks from D&D session
    for (let i = 0; i < totalChunks; i++) {
      const chunkStartTime = performance.now();

      const chunk = createTestAudioChunk({
        timestamp: i * chunkDuration,
        duration: chunkDuration,
        sampleRate: 44100,
        // Simulate realistic audio data with varying complexity
        audioData: generateRealisticAudioData(chunkDuration, {
          speaker: i % 4, // 4 speakers (DM + 3 players)
          complexity: Math.random() * 0.8 + 0.2, // Variable complexity
        }),
      });

      await processor.processChunk(chunk);

      const chunkEndTime = performance.now();
      const processingTime = chunkEndTime - chunkStartTime;

      performanceMetrics.chunksProcessed++;
      performanceMetrics.totalProcessingTime += processingTime;
      performanceMetrics.maxProcessingTime = Math.max(
        performanceMetrics.maxProcessingTime,
        processingTime
      );
    }

    performanceMetrics.averageProcessingTime =
      performanceMetrics.totalProcessingTime / performanceMetrics.chunksProcessed;

    const totalTime = performance.now() - startTime;

    // Performance assertions for 2-hour session
    expect(performanceMetrics.chunksProcessed).toBe(totalChunks);
    expect(totalTime).toBeLessThan(sessionDuration * 0.1); // Should complete in under 10% of session time
    expect(performanceMetrics.averageProcessingTime).toBeLessThan(20); // Average under 20ms
    expect(performanceMetrics.maxProcessingTime).toBeLessThan(100); // No chunk should take over 100ms
  });
});
```

---

## 3. Socket.IO Load Testing

Test WebSocket communication under concurrent user load.

### 3.1 Concurrent Connection Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import {
  IntegrationTestHarness,
  createIntegrationServer,
  waitForSocketEventWithTimeout,
} from '@critgenius/test-utils/integration';

describe('socket.io load testing', () => {
  let harness: IntegrationTestHarness;
  let server: ReturnType<typeof createIntegrationServer>;

  beforeAll(async () => {
    harness = new IntegrationTestHarness({
      workflowName: 'load-testing',
      preset: 'localDevelopment',
    });

    server = await createIntegrationServer(harness);
  });

  afterAll(async () => {
    await harness.teardown();
  });

  it('handles 50 concurrent connections', async () => {
    const clientCount = 50;
    const clients = Array.from({ length: clientCount }, (_, i) =>
      ioClient(`http://localhost:${server.port}`)
    );

    // Connect all clients
    await Promise.all(
      clients.map(client => waitForSocketEventWithTimeout(client, 'connect', { timeoutMs: 5000 }))
    );

    // All clients should be connected
    const connectedClients = clients.filter(client => client.connected);
    expect(connectedClients).toHaveLength(clientCount);

    // Cleanup
    clients.forEach(client => client.close());
  });

  it('maintains performance with 25 concurrent D&D sessions', async () => {
    const sessionCount = 25;
    const clientsPerSession = 3; // DM + 2 players
    const totalClients = sessionCount * clientsPerSession;

    const clients = Array.from({ length: totalClients }, (_, i) =>
      ioClient(`http://localhost:${server.port}`)
    );

    // Connect all clients
    await Promise.all(
      clients.map(client => waitForSocketEventWithTimeout(client, 'connect', { timeoutMs: 5000 }))
    );

    // Create sessions and join rooms
    const promises = [];
    for (let session = 0; session < sessionCount; session++) {
      for (let player = 0; player < clientsPerSession; player++) {
        const clientIndex = session * clientsPerSession + player;
        const client = clients[clientIndex];
        const sessionId = `session-${session}`;

        promises.push(
          new Promise(resolve => {
            client.emit('session:join', { sessionId, role: player === 0 ? 'dm' : 'player' });
            client.once('session:joined', resolve);
          })
        );
      }
    }

    await Promise.all(promises);

    // Simulate chat traffic
    const chatStartTime = performance.now();
    const messagesPerSession = 10;
    const chatPromises = [];

    for (let session = 0; session < sessionCount; session++) {
      for (let message = 0; message < messagesPerSession; message++) {
        const clientIndex = session * clientsPerSession; // DM sends messages
        const client = clients[clientIndex];
        const sessionId = `session-${session}`;

        chatPromises.push(
          new Promise(resolve => {
            client.emit('chat:send', {
              sessionId,
              message: `Message ${message} from session ${session}`,
              timestamp: Date.now(),
            });
            client.once('chat:received', resolve);
          })
        );
      }
    }

    await Promise.all(chatPromises);
    const chatEndTime = performance.now();

    // Verify performance
    expect(chatEndTime - chatStartTime).toBeLessThan(5000); // Chat should complete within 5 seconds
    expect(totalClients).toBeGreaterThan(0);

    // Cleanup
    clients.forEach(client => client.close());
  });
});
```

---

## 4. Memory and Resource Monitoring

Monitor memory usage and resource consumption during long-running tests.

### 4.1 Memory Leak Detection

```typescript
import { describe, it, expect } from 'vitest';
import { createTestAudioChunk } from '@critgenius/test-utils/factories';
import { AudioProcessor } from './audio-processor';

describe('memory usage monitoring', () => {
  it('does not have memory leaks during extended processing', async () => {
    const processor = new AudioProcessor();
    const initialMemory = process.memoryUsage();

    // Process many audio chunks to detect memory leaks
    for (let i = 0; i < 1000; i++) {
      const chunk = createTestAudioChunk({
        duration: 1000,
        sampleRate: 44100,
        audioData: generateLargeAudioData(1000), // 1 second of audio data
      });

      await processor.processChunk(chunk);

      // Force garbage collection periodically (if available)
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }

    // Final memory measurement
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 50MB for 1000 chunks)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    // Verify no extreme memory usage
    expect(finalMemory.heapUsed / 1024 / 1024).toBeLessThan(200); // Less than 200MB
    expect(finalMemory.rss / 1024 / 1024).toBeLessThan(300); // Less than 300MB RSS
  });
});
```

### 4.2 Resource Cleanup Validation

```typescript
describe('resource cleanup', () => {
  it('properly cleans up resources after test completion', async () => {
    const processor = new AudioProcessor();

    // Create and use resources
    const audioContext = new AudioContext();
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Process some audio
    await processor.processWithContext(audioContext, mediaStream);

    // Cleanup
    audioContext.close();
    mediaStream.getTracks().forEach(track => track.stop());

    // Verify cleanup
    expect(audioContext.state).toBe('closed');
    expect(mediaStream.active).toBe(false);

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Verify no lingering references
    const memoryAfterGC = process.memoryUsage();
    expect(memoryAfterGC.heapUsed).toBeLessThan(memoryAfterGC.heapTotal * 0.8);
  });
});
```

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Integration Testing Standards](./integration-testing-standards.md) - Integration test
  requirements
- [Integration Test Patterns](./integration-test-patterns.md) - Pattern catalog

---

**End of Performance Testing Guide**
