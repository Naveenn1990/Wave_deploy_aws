const mongoose = require('mongoose');
const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");
const SubService = require("../models/SubService");

// Helper function to get clean image filename
function getCleanImageName(imagePath) {
    if (!imagePath) return null;
    // If it's a full URL or path, extract just the filename
    if (imagePath.includes('/')) {
        return imagePath.split('/').pop();
    }
    return imagePath;
}

// Get complete service hierarchy (categories -> services -> subservices)
async function getServiceHierarchy(req, res) {
  try {
    console.log("Starting to fetch service hierarchy...");

    // Get all active categories
    const categories = await ServiceCategory.find({ status: "active" }).lean();
    console.log("Found categories:", categories.length);

    // First, let's check all services in the database
    const allServices = await Service.find({}).lean();
    console.log("Total services in database:", allServices);

    // Process each category to include its services and subservices
    const hierarchyData = await Promise.all(categories.map(async (category) => {
      console.log(`Processing category: ${category.name} (${category._id})`);
      
      // Get all active services for this category
      const services = await Service.find({
        category: category._id,
        isActive: true
      }).lean();
      
      console.log(`Found ${services.length} services for category ${category.name}:`, services);

      // Get subservices for each service
      const servicesWithSubservices = await Promise.all(services.map(async (service) => {
        console.log(`Processing service: ${service.name} (${service._id})`);
        
        const subServices = await SubService.find({
          service: service._id
        }).lean();
        
        console.log(`Found ${subServices.length} subservices for service ${service.name}:`, subServices);

        // Format subservices
        const formattedSubServices = subServices.map(subService => ({
          _id: subService._id,
          name: subService.name,
          description: subService.description,
          icon: getCleanImageName(subService.icon),
          price: subService.price,
          duration: subService.duration,
          isActive: subService.isActive
        }));

        // Return service with its subservices
        return {
          _id: service._id,
          name: service.name,
          description: service.description,
          icon: getCleanImageName(service.icon),
          basePrice: service.basePrice,
          duration: service.duration,
          isActive: service.isActive,
          subServices: formattedSubServices
        };
      }));

      // Return category with its services
      return {
        _id: category._id,
        name: category.name,
        description: category.description,
        icon: getCleanImageName(category.icon),
        services: servicesWithSubservices
      };
    }));

    return res.status(200).json({
      success: true,
      message: "Service hierarchy fetched successfully",
      data: hierarchyData
    });
  } catch (error) {
    console.error("Error in getServiceHierarchy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching service hierarchy",
      error: error.message
    });
  }
}

// Get all service categories with their services and sub-services
async function getCategories(req, res) {
    try {
        // Get all categories with populated services and sub-services
        const categories = await ServiceCategory.find({})
            .select('name description icon status subCategoryTitle createdAt updatedAt')
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No categories found in the database",
                data: []
            });
        }

        // Process each category to include its services and sub-services
        const categoriesWithServices = await Promise.all(categories.map(async (category) => {
            // Get all services for this category
            const services = await Service.find({
                category: category._id,
                isActive: true
            })
            .select('name description icon basePrice duration isRecommended isMostBooked')
            .lean();

            // Get and format services with their sub-services
            const servicesWithSubServices = await Promise.all(services.map(async (service) => {
                // Get sub-services for this service
                const subServices = await SubService.find({
                    service: service._id,
                    isActive: true
                })
                .select('name description icon price duration')
                .lean();

                // Format sub-services
                const formattedSubServices = subServices.map(subService => ({
                    _id: subService._id,
                    name: subService.name,
                    description: subService.description,
                    icon: getCleanImageName(subService.icon),
                    price: subService.price,
                    duration: subService.duration
                }));

                // Return formatted service with its sub-services
                return {
                    _id: service._id,
                    name: service.name,
                    description: service.description,
                    icon: getCleanImageName(service.icon),
                    basePrice: service.basePrice,
                    duration: service.duration,
                    isRecommended: service.isRecommended,
                    isMostBooked: service.isMostBooked,
                    subServices: formattedSubServices
                };
            }));

            // Return category with its services
            return {
                _id: category._id,
                name: category.name,
                description: category.description,
                icon: getCleanImageName(category.icon),
                status: category.status,
                subCategoryTitle: category.subCategoryTitle,
                services: servicesWithSubServices
            };
        }));

        res.status(200).json({
            success: true,
            data: categoriesWithServices
        });
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get services by category
async function getCategoryServices(req, res) {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const category = await ServiceCategory.findOne({
      _id: categoryId,
      status: "active",
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const services = await Service.find({
      category: categoryId,
      isActive: true,
    })
      .select("name description icon basePrice duration")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Add clean image names to service icons
    const servicesWithCleanImages = services.map((service) => ({
      ...service,
      icon: getCleanImageName(service.icon)
    }));

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: servicesWithCleanImages,
    });
  } catch (error) {
    console.error("Error in getCategoryServices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching services",
      error: error.message,
    });
  }
}

// Get service details with sub-services
async function getServiceDetails(req, res) {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    })
      .populate("category", "name description")
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // Get sub-services if any
    const subServices = await SubService.find({ service: serviceId })
      .select("name description icon price duration")
      .lean();

    // Add clean image name to icons
    service.icon = getCleanImageName(service.icon);
    const subServicesWithUrls = subServices.map((subService) => ({
      ...subService,
      icon: getCleanImageName(subService.icon),
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...service,
        subServices: subServicesWithUrls,
      },
      message: "Service details fetched successfully",
    });
  } catch (error) {
    console.error("Error in getServiceDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service details",
      error: error.message,
    });
  }
}

// Search services
async function searchServices(req, res) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const services = await Service.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .populate("category", "name")
      .select("name description icon basePrice duration category")
      .lean();

    // Add clean image name to service icons
    const servicesWithUrls = services.map((service) => ({
      ...service,
      icon: getCleanImageName(service.icon),
    }));

    return res.status(200).json({
      success: true,
      data: servicesWithUrls,
      message: "Services searched successfully",
    });
  } catch (error) {
    console.error("Error in searchServices:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching services",
      error: error.message,
    });
  }
}

// Get popular services
async function getPopularServices(req, res) {
  try {
    const { limit = 10 } = req.query;

    // Get services sorted by booking count (you can implement your own popularity logic)
    const services = await Service.find({ isActive: true })
      .populate("category", "name")
      .select("name description icon basePrice duration category")
      .limit(parseInt(limit))
      .lean();

    // Add clean image name to service icons
    const servicesWithUrls = services.map((service) => ({
      ...service,
      icon: getCleanImageName(service.icon),
    }));

    return res.status(200).json({
      success: true,
      data: servicesWithUrls,
      message: "Popular services fetched successfully",
    });
  } catch (error) {
    console.error("Error in getPopularServices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching popular services",
      error: error.message,
    });
  }
}

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get all services (debug endpoint)
async function getAllServices(req, res) {
  try {
    // Get all services regardless of status
    const services = await Service.find({})
      .populate('category')
      .lean();

    console.log("All services:", services);

    return res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services.map(service => ({
        _id: service._id,
        name: service.name,
        description: service.description,
        icon: getCleanImageName(service.icon),
        basePrice: service.basePrice,
        duration: service.duration,
        isActive: service.isActive,
        category: {
          _id: service.category?._id,
          name: service.category?.name
        }
      }))
    });
  } catch (error) {
    console.error("Error in getAllServices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching services",
      error: error.message
    });
  }
}

module.exports = {
  getCategories,
  getCategoryServices,
  getServiceDetails,
  searchServices,
  getPopularServices,
  getServiceHierarchy,
  getAllServices
};
