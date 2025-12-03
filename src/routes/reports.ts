import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  summaryReportHandler,
  byVariantReportHandler,
  exportCsvReportHandler,
} from '../controllers/reportsController';

const router = Router();

// Semua laporan hanya untuk admin/super_admin
router.use(authenticate, authorize(['admin', 'super_admin']));

router.get('/summary', summaryReportHandler);
router.get('/by-variant', byVariantReportHandler);
router.get('/export', exportCsvReportHandler);

export default router;
