import express from 'express';

const router = express.Router();

/**
 * GET Public Transparency & Civic Performance Metrics
 */
router.get('/transparency', (req, res) => {
  res.json({
    success: true,
    data: {
      totalReceived: 4210,
      totalResolved: 3890,
      activeCases: 320,
      resolutionRate: '92.4%',
      avgResolutionHours: 28.4,
      slaComplianceRate: '94.8%',
      categoriesBreakdown: [
        { category: 'Sanitation', count: 1420, resolved: 1350 },
        { category: 'Road & Infrastructure', count: 1100, resolved: 980 },
        { category: 'Street Lights', count: 780, resolved: 740 },
        { category: 'Water Supply', count: 620, resolved: 570 },
        { category: 'Public Safety', count: 290, resolved: 250 }
      ],
      citizenSatisfactionScore: 4.6
    }
  });
});

export default router;
