const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');

// Get all categories with their services
exports.getAllCategories = async (req, res) => {
    try {
        // Get all categories
        const categories = await ServiceCategory.find({})
            .select('name description icon')
            .sort({ name: 1 });

        // Get all services in one query to avoid N+1 problem
        const allServices = await Service.find({})
            .select('name description basePrice duration icon category')
            .sort({ name: 1 });

        // Group services by category
        const servicesByCategory = allServices.reduce((acc, service) => {
            const categoryId = service.category.toString();
            if (!acc[categoryId]) {
                acc[categoryId] = [];
            }
            acc[categoryId].push({
                id: service._id,
                name: service.name,
                description: service.description,
                basePrice: service.basePrice,
                duration: service.duration,
                icon: service.icon
            });
            return acc;
        }, {});

        // Format response with nested services
        const formattedCategories = categories.map(category => ({
            id: category._id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            services: servicesByCategory[category._id.toString()] || []
        }));

        res.json({
            success: true,
            count: formattedCategories.length,
            categories: formattedCategories
        });

    } catch (error) {
        console.error("Get All Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories with services",
            error: error.message
        });
    }
};
