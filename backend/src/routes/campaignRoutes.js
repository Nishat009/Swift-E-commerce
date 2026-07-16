const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getCampaignById,
  purchaseTicket,
  getMyTickets,
  getWinners,
  createCampaign,
  drawCampaignWinner
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getCampaigns);
router.get('/my-tickets', protect, getMyTickets);
router.get('/winners', getWinners);
router.get('/:id', getCampaignById);

router.post('/:id/buy', protect, purchaseTicket);
router.post('/admin/create', protect, authorize('admin'), createCampaign);
router.post('/admin/:id/draw', protect, authorize('admin'), drawCampaignWinner);

module.exports = router;
