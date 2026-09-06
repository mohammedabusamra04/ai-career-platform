import { Router } from 'express';
import { jobPipelineService } from '../../config/services.js';
import { requirePipelineAuth } from '../../shared/middleware/auth.middleware.js';
import logger from '../../shared/utils/logger.js';

const router = Router();

router.post('/run', requirePipelineAuth, async (_req, res, next) => {
  try {
    logger.info('Starting job pipeline execution triggered via API');

    await jobPipelineService.run();

    logger.info('Job pipeline execution completed successfully');

    res.success({
      message: 'Job pipeline executed successfully',
    });
  } catch (error) {
    logger.error(
      `Job pipeline execution failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    next(error);
  }
});

export default router;
