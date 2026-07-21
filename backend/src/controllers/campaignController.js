const Campaign = require('../models/Campaign');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const AuditTrail = require('../models/AuditTrail');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res, next) => {
  try {
    const { status, visibility, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    // Default: only show public campaigns to non-admin
    if (visibility) {
      query.visibility = visibility;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const campaigns = await Campaign.find(query)
      .populate('winnerUser', 'name email')
      .populate('linkedProducts', 'title price thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    return sendSuccess(res, 'Campaigns retrieved successfully', campaigns, 200, {
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
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
      .populate('winnerUser', 'name email')
      .populate('linkedProducts', 'title price thumbnail description stock');

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

    // Check max tickets per user
    const userTicketCount = await Ticket.countDocuments({ user: req.user.id, campaign: campaignId });
    if (userTicketCount + qty > campaign.maxTicketsPerUser) {
      return sendError(res, `You can hold a maximum of ${campaign.maxTicketsPerUser} tickets for this campaign. You currently have ${userTicketCount}.`, 400);
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
        purchaseAmount: campaign.productPrice,
        paymentMethod: paymentMethod || 'simulated_wallet',
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

    // Create notification for the user
    await Notification.create({
      user: req.user.id,
      title: 'Tickets Earned! 🎟️',
      message: `You earned ${qty} ticket(s) for the "${campaign.title}" campaign. Good luck in the draw!`,
      type: 'campaign_purchase',
      relatedCampaign: campaignId
    });

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
      description,
      terms,
      bannerImage,
      productTitle,
      productPrice,
      productDescription,
      productImage,
      linkedProducts,
      prizeName,
      prizeDescription,
      prizeImage,
      drawDate,
      ticketLimit,
      ticketsPerPurchase,
      maxTicketsPerUser,
      visibility,
      status
    } = req.body;

    const campaign = await Campaign.create({
      title,
      description: description || '',
      terms: terms || '',
      bannerImage: bannerImage || '',
      productTitle,
      productPrice,
      productDescription,
      productImage,
      linkedProducts: linkedProducts || [],
      prizeName,
      prizeDescription,
      prizeImage,
      drawDate: drawDate || null,
      ticketLimit,
      ticketsPerPurchase: ticketsPerPurchase || 1,
      maxTicketsPerUser: maxTicketsPerUser || 10,
      visibility: visibility || 'public',
      status: status || 'active'
    });

    // Record enterprise activity log
    await ActivityLog.create({
      adminUser: req.user.id,
      action: 'CREATE_CAMPAIGN',
      details: `Created lucky draw campaign "${title}" with prize "${prizeName}" (Ticket pool limit: ${ticketLimit})`
    });

    // Record enterprise audit trail
    await AuditTrail.create({
      entityType: 'Campaign',
      entityId: campaign._id,
      changedBy: req.user.id,
      changeSummary: 'Created initial campaign profile',
      newState: campaign.toObject()
    });

    return sendSuccess(res, 'Lucky Draw campaign published successfully', campaign, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/admin/:id
// @access  Private/Admin
const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    const previousState = campaign.toObject();

    const allowedFields = [
      'title', 'description', 'terms', 'bannerImage',
      'productTitle', 'productPrice', 'productDescription', 'productImage',
      'linkedProducts', 'prizeName', 'prizeDescription', 'prizeImage',
      'drawDate', 'ticketLimit', 'ticketsPerPurchase', 'maxTicketsPerUser',
      'visibility', 'status'
    ];

    const changes = [];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (String(campaign[field]) !== String(req.body[field])) {
          changes.push(field);
        }
        campaign[field] = req.body[field];
      }
    });

    await campaign.save();

    const updated = await Campaign.findById(campaign._id)
      .populate('winnerUser', 'name email')
      .populate('linkedProducts', 'title price thumbnail');

    if (changes.length > 0) {
      // Record enterprise activity log
      await ActivityLog.create({
        adminUser: req.user.id,
        action: 'UPDATE_CAMPAIGN',
        details: `Updated campaign "${campaign.title}" fields: ${changes.join(', ')}`
      });

      // Record enterprise audit trail
      await AuditTrail.create({
        entityType: 'Campaign',
        entityId: campaign._id,
        changedBy: req.user.id,
        changeSummary: `Modified campaign parameters: ${changes.join(', ')}`,
        previousState,
        newState: updated.toObject()
      });
    }

    return sendSuccess(res, 'Campaign updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update campaign status
// @route   PUT /api/campaigns/admin/:id/status
// @access  Private/Admin
const updateCampaignStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'paused', 'sold-out', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    campaign.status = status;
    await campaign.save();

    return sendSuccess(res, `Campaign status updated to "${status}"`, campaign);
  } catch (error) {
    next(error);
  }
};

// @desc    Get campaign analytics
// @route   GET /api/campaigns/admin/analytics
// @access  Private/Admin
const getCampaignAnalytics = async (req, res, next) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const soldOutCampaigns = await Campaign.countDocuments({ status: 'sold-out' });

    const totalTickets = await Ticket.countDocuments();
    const activeTickets = await Ticket.countDocuments({ status: 'active' });

    // Revenue aggregation
    const revenueAgg = await Ticket.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$purchaseAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Unique participants
    const uniqueParticipants = await Ticket.distinct('user');

    // Top campaigns by tickets sold
    const topCampaigns = await Campaign.find()
      .sort({ ticketsSold: -1 })
      .limit(5)
      .select('title prizeName ticketsSold ticketLimit productPrice status');

    // Revenue by campaign
    const revenueByCampaign = await Ticket.aggregate([
      {
        $group: {
          _id: '$campaign',
          revenue: { $sum: '$purchaseAmount' },
          ticketCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaignInfo'
        }
      },
      { $unwind: '$campaignInfo' },
      {
        $project: {
          campaignTitle: '$campaignInfo.title',
          prizeName: '$campaignInfo.prizeName',
          revenue: 1,
          ticketCount: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Recent activity
    const recentTickets = await Ticket.find()
      .populate('user', 'name email')
      .populate('campaign', 'title prizeName')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(res, 'Campaign analytics retrieved', {
      overview: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        soldOutCampaigns,
        totalTickets,
        activeTickets,
        totalRevenue,
        uniqueParticipants: uniqueParticipants.length
      },
      topCampaigns,
      revenueByCampaign,
      recentActivity: recentTickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tickets for a specific campaign
// @route   GET /api/campaigns/admin/:id/tickets
// @access  Private/Admin
const getCampaignTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ campaign: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Campaign tickets retrieved', tickets);
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

    const previousState = campaign.toObject();

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
    campaign.winnerVideoUrl = `https://www.w3schools.com/html/mov_bbb.mp4`;
    await campaign.save();

    const fullyPopulatedCampaign = await Campaign.findById(campaign._id)
      .populate('winnerUser', 'name email');

    // Create notifications for winner
    await Notification.create({
      user: winningTicket.user,
      title: '🏆 Congratulations! You Won!',
      message: `Your ticket ${winningTicket.ticketNumber} won the "${campaign.title}" campaign! You've won ${campaign.prizeName}!`,
      type: 'winner_announcement',
      relatedCampaign: campaign._id
    });

    // Create notifications for all participants (except winner)
    const otherTickets = await Ticket.find({
      campaign: campaign._id,
      _id: { $ne: winningTicket._id }
    }).distinct('user');

    const notificationDocs = otherTickets.map(userId => ({
      user: userId,
      title: 'Draw Completed 🎲',
      message: `The draw for "${campaign.title}" has been completed. Unfortunately, your ticket was not selected this time. Better luck next time!`,
      type: 'draw_result',
      relatedCampaign: campaign._id
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    // Record enterprise activity log
    await ActivityLog.create({
      adminUser: req.user.id,
      action: 'CONDUCT_DRAW',
      details: `Conducted random draw for campaign "${campaign.title}". Selected winning ticket "${winningTicket.ticketNumber}".`
    });

    // Record enterprise audit trail
    await AuditTrail.create({
      entityType: 'Campaign',
      entityId: campaign._id,
      changedBy: req.user.id,
      changeSummary: 'Conducted lucky draw and declared winner',
      previousState,
      newState: fullyPopulatedCampaign.toObject()
    });

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
  updateCampaign,
  updateCampaignStatus,
  getCampaignAnalytics,
  getCampaignTickets,
  drawCampaignWinner
};
