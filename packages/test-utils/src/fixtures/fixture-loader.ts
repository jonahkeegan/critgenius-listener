import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = new URL('./data/', import.meta.url);

type FixtureCache = Map<string, unknown>;

export class FixtureLoader {
  private readonly cache: FixtureCache = new Map();

  constructor(private readonly baseUrl: URL = DEFAULT_BASE_URL) {}

  async loadBuffer(relativePath: string): Promise<Uint8Array> {
    const cached = this.cache.get(relativePath);
    if (cached instanceof Uint8Array) {
      return cached;
    }

    const url = new URL(relativePath, this.baseUrl);
    const buffer = await readFile(fileURLToPath(url));
    this.cache.set(relativePath, buffer);
    return buffer;
  }

  async loadJson<T>(relativePath: string): Promise<T> {
    const cached = this.cache.get(relativePath);
    if (cached) {
      return cached as T;
    }

    const buffer = await this.loadBuffer(relativePath);
    const data = JSON.parse(Buffer.from(buffer).toString('utf-8')) as T;
    this.cache.set(relativePath, data);
    return data;
  }

  async loadText(relativePath: string): Promise<string> {
    const buffer = await this.loadBuffer(relativePath);
    return Buffer.from(buffer).toString('utf-8');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const defaultFixtureLoader = new FixtureLoader();
