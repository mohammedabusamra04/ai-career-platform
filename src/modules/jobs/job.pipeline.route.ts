import { Router } from 'express';

import { jobPipelineService } from '../../config/services.js';
import { requirePipelineAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.post('/run', requirePipelineAuth, async (_req, res, next) => {
  try {
    await jobPipelineService.run();

    res.success({
      message: 'Job pipeline executed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

