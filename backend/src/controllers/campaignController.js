const Campaign = require('../models/Campaign');
const Ticket = require('../models/Ticket');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const campaigns = await Campaign.find(query)
      .populate('winnerUser', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Campaigns retrieved successfully', campaigns);
  } catch (error) {
    next(error);
  }
};

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('winnerUser', 'name email');

    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    return sendSuccess(res, 'Campaign details retrieved', campaign);
  } catch (error) {
    next(error);
  }
};

// @desc    Purchase tickets/products & generate tickets
// @route   POST /api/campaigns/:id/buy
// @access  Private
const purchaseTicket = async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const { quantity, paymentMethod } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    if (campaign.status !== 'active') {
      return sendError(res, 'This campaign is no longer active', 400);
    }

    const availableTickets = campaign.ticketLimit - campaign.ticketsSold;
    if (qty > availableTickets) {
      return sendError(res, `Only ${availableTickets} tickets remaining for this campaign`, 400);
    }

    // Generate Tickets
    const generatedTickets = [];
    for (let i = 0; i < qty; i++) {
      const uniqueSuffix = `${campaignId.substring(18, 24).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const ticketNumber = `SWIFT-TKT-${uniqueSuffix}`;

      const ticket = await Ticket.create({
        ticketNumber,
        user: req.user.id,
        campaign: campaignId,
        status: 'active'
      });
      generatedTickets.push(ticket);
    }

    // Update campaign counters
    campaign.ticketsSold += qty;
    if (campaign.ticketsSold >= campaign.ticketLimit) {
      campaign.status = 'sold-out';
    }
    await campaign.save();

    return sendSuccess(res, `Successfully purchased ${qty} products & earned entry tickets`, {
      tickets: generatedTickets,
      campaign
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's tickets
// @route   GET /api/campaigns/my-tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate({
        path: 'campaign',
        populate: {
          path: 'winnerUser',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'My tickets retrieved successfully', tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get previous winners
// @route   GET /api/campaigns/winners
// @access  Public
const getWinners = async (req, res, next) => {
  try {
    const winners = await Campaign.find({ status: 'completed' })
      .populate('winnerUser', 'name email')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 'Winners gallery retrieved successfully', winners);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new campaign
// @route   POST /api/campaigns/admin/create
// @access  Private/Admin
const createCampaign = async (req, res, next) => {
  try {
    const {
      title,
      productTitle,
      productPrice,
      productDescription,
      productImage,
      prizeName,
      prizeDescription,
      prizeImage,
      ticketLimit
    } = req.body;

    const campaign = await Campaign.create({
      title,
      productTitle,
      productPrice,
      productDescription,
      productImage,
      prizeName,
      prizeDescription,
      prizeImage,
      ticketLimit
    });

    return sendSuccess(res, 'Lucky Draw campaign published successfully', campaign, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Draw random winner for campaign
// @route   POST /api/campaigns/admin/:id/draw
// @access  Private/Admin
const drawCampaignWinner = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    if (campaign.status === 'completed') {
      return sendError(res, 'Draw has already been conducted for this campaign', 400);
    }

    // Retrieve all entries
    const tickets = await Ticket.find({ campaign: campaign._id });
    if (tickets.length === 0) {
      return sendError(res, 'Cannot draw winner: No tickets purchased for this campaign', 400);
    }

    // Select random ticket
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];

    // Update statuses
    winningTicket.status = 'won';
    await winningTicket.save();

    // Mark other tickets as lost
    await Ticket.updateMany(
      { campaign: campaign._id, _id: { $ne: winningTicket._id } },
      { status: 'lost' }
    );

    // Update campaign details
    campaign.status = 'completed';
    campaign.winnerUser = winningTicket.user;
    campaign.winnerTicket = winningTicket.ticketNumber;
    campaign.winnerVideoUrl = `https://www.w3schools.com/html/mov_bbb.mp4`; // Mock testimonial video URL
    await campaign.save();

    const fullyPopulatedCampaign = await Campaign.findById(campaign._id)
      .populate('winnerUser', 'name email');

    return sendSuccess(res, 'Lottery draw conducted successfully!', {
      campaign: fullyPopulatedCampaign,
      winningTicket
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  purchaseTicket,
  getMyTickets,
  getWinners,
  createCampaign,
  drawCampaignWinner
};
