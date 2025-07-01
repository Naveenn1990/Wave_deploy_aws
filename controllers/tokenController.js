const Token = require("../models/Token");

exports.createToken = async (req, res) => {
    try {
        const { user, booking, tokenNumber, issue, userId } = req.body;

        // Validate required fields
        if (!user || !booking || !tokenNumber || !issue) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user, booking, tokenNumber, issue'
            });
        }



        // Check if token number is unique
        const existingToken = await Token.findOne({ tokenNumber });
        if (existingToken) {
            return res.status(400).json({
                success: false,
                message: 'Token number already exists'
            });
        }

        // Create new token
        const newToken = new Token({
            user,
            booking,
            tokenNumber,
            issue,
            status: 'pending',
            userId,
        });

        await newToken.save();

        // Populate the saved token for response
        const populatedToken = await Token.findById(newToken._id)
            .populate('user', 'name phone email')
            .populate({
                path: 'booking',
                select: 'amount subService',
                populate: {
                    path: 'subService',
                    select: 'name'
                }
            });

        res.status(201).json({
            success: true,
            message: 'Token created successfully',
            token: populatedToken
        });
    } catch (error) {
        console.error('Error creating token:', error);

        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({
                success: false,
                message: 'Token number must be unique'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating token',
            error: error.message
        });

    }
}

exports.getAllTokens = async (req, res) => {
    try {
        const tokens = await Token.find()
            .populate({
                path: 'user',
                select: 'name phone email' // Select only needed fields
            })
            .populate({
                path: 'booking',
                select: 'amount subService status', // Select only needed fields
                populate: {
                    path: 'subService',
                    select: 'name description'
                }
            })
            .sort({ createdAt: -1 }); // Most recent first

        // Transform data to match frontend expectations
        const transformedTokens = tokens.map(token => ({
            id: token._id,
            partnerId: token.user._id,
            partnerName: token.user.name,
            partnerPhone: token.user.phone,
            partnerEmail: token.user.email,
            bookingId: token.booking._id,
            serviceName: token.booking.subService?.name,
            serviceAmount: token.booking.amount,
            token: token.tokenNumber,
            issue: token.issue,
            status: token.status,
            resolution: token.resolution,
            resolvedAt: token.resolvedAt,
            generatedAt: token.createdAt.toLocaleString(),
            updatedAt: token.updatedAt.toLocaleString(),
            userId: token.userId
        }));

        res.json({
            success: true,
            tokens: transformedTokens
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tokens',
            error: error.message
        });
    }
}


exports.updateToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution, issue, userId,feedback } = req.body;
        const token = await Token.findById(id)
            .populate('user', 'name phone email')
            .populate({
                path: 'booking',
                select: 'amount subService status',
                populate: {
                    path: 'subService',
                    select: 'name description'
                }
            });

        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }
        if (status) {
            token.status = status
        }
        if (resolution) {
            token.resolution = resolution
        }
        if (issue) {
            token.issue = issue
        }
        if(feedback){
            token.feedback = feedback
        }
        await token.save();

        res.json({
            success: true,
            token
        });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching token',
            error: error.message
        });
    }
}

exports.deleteToken = async (req, res) => {
    try {
        const { id } = req.params;

        const token = await Token.findById(id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        await Token.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Token deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting token',
            error: error.message
        });
    }
}

exports.tokenOverView = async (req, res) => {
    try {
        const stats = await Token.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalTokens = await Token.countDocuments();
        const resolvedTokens = await Token.countDocuments({ status: 'resolved' });
        const pendingTokens = await Token.countDocuments({ status: 'pending' });
        const inProgressTokens = await Token.countDocuments({ status: 'in_progress' });

        res.json({
            success: true,
            stats: {
                total: totalTokens,
                resolved: resolvedTokens,
                pending: pendingTokens,
                inProgress: inProgressTokens,
                byStatus: stats
            }
        });
    } catch (error) {
        console.error('Error fetching token stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching token statistics',
            error: error.message
        });
    }
}

exports.gettokentByuserid = async (req, res) => {
    try {
        const { userId } = req.params;

        const tokens = await Token.find({ user: userId })
            .populate({
                path: 'booking',
                select: 'amount subService status',
                populate: {
                    path: 'user',
                    select: 'name description'
                },
            })
            .populate({
                path: 'booking',
                select: 'amount subService status',
                populate: {
                    path: 'subService',
                    select: 'name description'
                },
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tokens
        });
    } catch (error) {
        console.error('Error fetching user tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user tokens',
            error: error.message
        });
    }
}

