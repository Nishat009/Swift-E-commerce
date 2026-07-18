const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getCampaignById,
  purchaseTicket,
  getMyTickets,
  getWinners,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  getCampaignAnalytics,
  getCampaignTickets,
  drawCampaignWinner
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getCampaigns);
router.get('/winners', getWinners);

// Protected user routes
router.get('/my-tickets', protect, getMyTickets);
router.get('/:id', getCampaignById);
router.post('/:id/buy', protect, purchaseTicket);

// Admin routes
router.get('/admin/analytics', protect, authorize('admin'), getCampaignAnalytics);
router.post('/admin/create', protect, authorize('admin'), createCampaign);
router.put('/admin/:id', protect, authorize('admin'), updateCampaign);
router.put('/admin/:id/status', protect, authorize('admin'), updateCampaignStatus);
router.get('/admin/:id/tickets', protect, authorize('admin'), getCampaignTickets);
router.post('/admin/:id/draw', protect, authorize('admin'), drawCampaignWinner);

module.exports = router;
