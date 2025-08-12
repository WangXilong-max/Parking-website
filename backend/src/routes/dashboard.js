import express from 'express';
import { getDashboardMetrics } from '../services/dashboardService.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await getDashboardMetrics();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Failed to fetch dashboard metrics', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
