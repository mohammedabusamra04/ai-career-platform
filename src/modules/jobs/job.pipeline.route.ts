import { Router } from 'express';

import { jobPipelineService } from '../../config/services.js';
import { requirePipelineAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.post('/run', requirePipelineAuth, async (_req, res, next) => {
  try {
    const result = await jobPipelineService.run();

    res.success({
      message: 'Job pipeline executed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

