const PromotionalBanner = require('../models/PromotionalBanner');
const CompanyBanner = require('../models/CompanyBanner');
const path = require('path');

const adminBannerController = {
    // Promotional Banner Controllers
    uploadPromotionalBanner: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No banner image provided"
                });
            }

            const banner = new PromotionalBanner({
                title: req.body.title,
                description: req.body.description,
                image: path.basename(req.file.path),
                order: req.body.order || 0,
                link: req.body.link
            });

            await banner.save();

            res.status(201).json({
                success: true,
                message: "Promotional banner uploaded successfully",
                data: banner
            });
        } catch (error) {
            console.error('Upload Promotional Banner Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAllPromotionalBanners: async (req, res) => {
        try {
            const banners = await PromotionalBanner.find().sort({ order: 1 });
            res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Get Promotional Banners Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Company Banner Controllers
    uploadCompanyBanner: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No banner image provided"
                });
            }

            const banner = new CompanyBanner({
                title: req.body.title,
                description: req.body.description,
                image: path.basename(req.file.path),
                order: req.body.order || 0
            });

            await banner.save();

            res.status(201).json({
                success: true,
                message: "Company banner uploaded successfully",
                data: banner
            });
        } catch (error) {
            console.error('Upload Company Banner Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAllCompanyBanners: async (req, res) => {
        try {
            const banners = await CompanyBanner.find().sort({ order: 1 });
            res.status(200).json({
                success: true,
                data: banners
            });
        } catch (error) {
            console.error('Get Company Banners Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = adminBannerController;
