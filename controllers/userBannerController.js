const PromotionalBanner = require('../models/PromotionalBanner');
const CompanyBanner = require('../models/CompanyBanner');

const userBannerController = {
    // Get active promotional banners
    getActivePromotionalBanners: async (req, res) => {
        try {
            const banners = await PromotionalBanner.find({ isActive: true })
                .sort({ order: 1 })
                .select('-__v')
                .lean();

            res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Get Active Promotional Banners Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get active company banners
    getActiveCompanyBanners: async (req, res) => {
        try {
            const banners = await CompanyBanner.find({ isActive: true })
                .sort({ order: 1 })
                .select('-__v')
                .lean();

            res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Get Active Company Banners Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = userBannerController;
