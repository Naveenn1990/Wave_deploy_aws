const Support = require('../models/Support');
const AutoResponse = require('../models/AutoResponse');
const Partner = require('../models/Partner');
const socketService = require('../services/socketService');

// Enhanced support request management for partners
exports.handleSupportRequest = async (req, res) => {
  try {
    const { type, priority, description, bookingId } = req.body;
    const partnerId = req.partner._id;

    // Create support ticket
    const supportTicket = await Support.create({
      requestedBy: partnerId,
      requestorType: 'Partner',
      type,
      priority,
      description,
      bookingId,
      status: 'open'
    });

    // Get automated response based on issue type
    const autoResponse = await AutoResponse.findOne({ issueType: type });
    if (autoResponse) {
      supportTicket.autoResponse = autoResponse.response;
      supportTicket.suggestedActions = autoResponse.suggestedActions;
      await supportTicket.save();
    }

    // Notify admin about new support request
    socketService.notifyAdmin('new_support_request', {
      ticketId: supportTicket._id,
      partnerId,
      priority,
      type
    });

    res.status(201).json({
      success: true,
      data: supportTicket
    });
  } catch (error) {
    console.error('Support Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating support request'
    });
  }
};

// Get support request history with advanced filtering
exports.getSupportHistory = async (req, res) => {
  try {
    const {
      status,
      priority,
      startDate,
      endDate,
      type
    } = req.query;

    const query = {
      requestedBy: req.partner._id,
      requestorType: 'Partner'
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const supportTickets = await Support.find(query)
      .populate('bookingId', 'bookingNumber status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: supportTickets
    });
  } catch (error) {
    console.error('Get Support History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support history'
    });
  }
};

// Update support ticket
exports.updateSupportTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { additionalInfo, status } = req.body;

    const supportTicket = await Support.findOne({
      _id: ticketId,
      requestedBy: req.partner._id
    });

    if (!supportTicket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (additionalInfo) {
      supportTicket.updates.push({
        content: additionalInfo,
        updatedBy: req.partner._id,
        updaterType: 'Partner'
      });
    }

    if (status && status === 'resolved') {
      supportTicket.resolvedAt = new Date();
    }

    supportTicket.status = status || supportTicket.status;
    await supportTicket.save();

    // Notify admin about the update
    socketService.notifyAdmin('support_ticket_update', {
      ticketId,
      status: supportTicket.status,
      partnerId: req.partner._id
    });

    res.json({
      success: true,
      data: supportTicket
    });
  } catch (error) {
    console.error('Update Support Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating support ticket'
    });
  }
};

// Get support ticket analytics
exports.getSupportAnalytics = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const analytics = await Support.aggregate([
      {
        $match: {
          requestedBy: partnerId,
          requestorType: 'Partner',
          ...dateQuery
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          averageResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                0
              ]
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              status: '$status'
            }
          },
          byType: {
            $push: {
              type: '$type',
              status: '$status'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics[0] || {
        totalTickets: 0,
        resolvedTickets: 0,
        averageResolutionTime: 0,
        byPriority: [],
        byType: []
      }
    });
  } catch (error) {
    console.error('Support Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support analytics'
    });
  }
};
