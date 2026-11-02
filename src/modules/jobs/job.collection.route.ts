import { Router } from 'express';
import { jobCollectionService } from '../../config/services.js';
import { requirePipelineAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

/**
 * POST /jobs/collection/run
 * Internal authenticated endpoint to trigger decoupled job collection cycle.
 * Protected by requirePipelineAuth.
 */
router.post('/run', requirePipelineAuth, async (req, res, next) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await jobCollectionService.executeCollectionCycle({ force });

    if (!result.executed) {
      res.status(409).json({
        success: false,
        message: result.skippedReason || 'Collection cycle locked by another runner',
        runId: result.runId,
      });
      return;
    }

    res.success({
      message: 'Job collection cycle executed successfully',
      data: result.stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
