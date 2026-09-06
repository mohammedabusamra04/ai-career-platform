import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { jobPipelineService } from '../../config/services.js';
import router from './job.pipeline.route.js';

vi.mock('../../config/services.js', () => ({
  jobPipelineService: {
    run: vi.fn(),
  },
}));

vi.mock('../../shared/middleware/auth.middleware.js', () => ({
  requirePipelineAuth: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
    next();
  }),
}));

describe('Job Pipeline Route', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: {
    success: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      success: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  const getRunHandler = () => {
    const route = router.stack.find((layer) => layer.route && layer.route.path === '/run');
    if (!route || !route.route) {
      throw new Error('Route /run not found on router');
    }
    const handlers = route.route.stack;
    return handlers[handlers.length - 1].handle;
  };

  it('should run job pipeline successfully and return success response', async () => {
    vi.mocked(jobPipelineService.run).mockResolvedValueOnce(undefined);

    const handler = getRunHandler();
    await handler(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(jobPipelineService.run).toHaveBeenCalledTimes(1);
    expect(mockResponse.success).toHaveBeenCalledWith({
      message: 'Job pipeline executed successfully',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should pass error to next if jobPipelineService.run fails', async () => {
    const error = new Error('Pipeline execution failed');
    vi.mocked(jobPipelineService.run).mockRejectedValueOnce(error);

    const handler = getRunHandler();
    await handler(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(jobPipelineService.run).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(error);
  });
});
