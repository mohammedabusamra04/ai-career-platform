import { describe, expect, it, vi, beforeEach } from 'vitest';
import logger from './logger.js';

describe('logger utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages with [INFO] prefix', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Server started');

    expect(consoleSpy).toHaveBeenCalledWith('[INFO] Server started');
  });

  it('should log warn messages with [WARN] prefix', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Redis slow response');

    expect(consoleSpy).toHaveBeenCalledWith('[WARN] Redis slow response');
  });

  it('should log error messages with [ERROR] prefix', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Connection failed');

    expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Connection failed');
  });
});
