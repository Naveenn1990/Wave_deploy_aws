const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');

const serviceHierarchyController = {
    // Get complete service hierarchy
    getServiceHierarchy: async (req, res) => {
        try {
            // Fetch all categories with their details
            const categories = await ServiceCategory.find()
                .select('_id name description icon isActive order')
                .sort({ order: 1 })
                .lean();

            // Fetch all services with their subservices
            const services = await Service.find()
                .select('_id categoryId name description icon isActive order subServices')
                .sort({ order: 1 })
                .lean();

            // Create a map of services by category
            const servicesByCategory = {};
            services.forEach(service => {
                if (!servicesByCategory[service.categoryId]) {
                    servicesByCategory[service.categoryId] = [];
                }
                servicesByCategory[service.categoryId].push(service);
            });

            // Create a map of sub-services by service
            const subServicesByService = {};
            services.forEach(service => {
                if (!subServicesByService[service._id]) {
                    subServicesByService[service._id] = [];
                }
                (service.subServices || []).forEach(subService => {
                    subServicesByService[service._id].push(subService);
                });
            });

            // Build the hierarchy
            const hierarchy = categories.map(category => ({
                _id: category._id,
                name: category.name,
                description: category.description,
                icon: category.icon,
                isActive: category.isActive,
                order: category.order,
                services: (servicesByCategory[category._id] || []).map(service => ({
                    _id: service._id,
                    name: service.name,
                    description: service.description,
                    icon: service.icon,
                    isActive: service.isActive,
                    order: service.order,
                    categoryId: service.categoryId,
                    subServices: (subServicesByService[service._id] || []).map(subService => ({
                        _id: subService._id,
                        name: subService.name,
                        description: subService.description,
                        icon: subService.icon,
                        isActive: subService.isActive,
                        order: subService.order
                    }))
                }))
            }));

            res.json({
                success: true,
                data: {
                    categories: hierarchy
                }
            });
        } catch (error) {
            console.error('Error fetching service hierarchy:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching service hierarchy',
                error: error.message
            });
        }
    }
};

module.exports = serviceHierarchyController;
