const mongoose = require('mongoose');
const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");
const SubService = require("../models/SubService");
const SubCategory = require("../models/SubCategory");
const Booking = require("../models/booking"); // Assuming you have a Booking model
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

const getCategories = async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true })
            .populate({
                path: 'subcategories',
                match: { isActive: true },
                populate: {
                    path: 'services',
                    match: { isActive: true },
                    populate: {
                        path: 'subservices',
                        match: { isActive: true }
                    }
                }
            });

        console.log('Fetched Categories:', categories); // Log fetched categories

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error); // Log errors
        res.status(500).json({ success: false, message: error.message });
    }
};

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

const getAllServicesForUser = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true }); // Fetch active services

        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// const getAllSubCategories = async (req, res) => {
//   try {
//       const subcategories = await SubCategory.find({ isActive: true })
//           .populate('category'); // Populate the category field to get full details

//       res.status(200).json({
//           success: true,
//           data: subcategories
//       });
//   } catch (error) {
//       console.error('Error fetching subcategories:', error);
//       res.status(500).json({ success: false, message: error.message });
//   }
// };

const getAllSubCategories = async (req, res) => {
  // console.log("testttt")
  try {
      const subcategories = await SubCategory.find({ isActive: true })
          .populate('category')
          .populate({
              path: 'services',
              model: 'Service',
              populate: { 
                  path: 'subCategory', 
                  model: 'SubCategory' 
              }
          })
          .populate({
              path: 'subservices',   // <-- Add this to fetch subservices
              model: 'SubService'
          });
          // console.log('Fetched Subcategories:', subcategories);
          // .populate({
          //   path: 'subservices',
          //   populate: {
          //       path: 'services', // SubService -> Service
          //       populate: {
          //           path: 'subCategory', // Service -> SubCategory
          //           populate: {
          //               path: 'category', // SubCategory -> ServiceCategory
          //            }
          //       }
          //   }
          // })
      res.status(200).json({
          success: true,
          data: subcategories
      });
  } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ success: false, message: error.message });
  }
};




const getAllSubCategoriesForUser = async (req, res) => {
  console.log("subcategory")
    try {
        const subcategories = await SubCategory.find({ isActive: true }); // Fetch active subcategories

        res.status(200).json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// const getAllSubServices = async (req, res) => {
//     try {
//         const subservices = await SubService.find({ isActive: true }).populate('service');; // Fetch active subservices
//         console.log('Fetched Subservices:');
//         res.status(200).json({
//             success: true,
//             data: subservices
//         });
//     } catch (error) {
//         console.error('Error fetching subservices:', error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

const getAllSubServices = async (req, res) => {
  try {
      const subservices = await SubService.find({ isActive: true })
          .populate({
              path: 'service',
              populate: {
                  path: 'subCategory',
                  populate: {
                      path: 'category', // This refers to the ServiceCategory
                      model: 'ServiceCategory'
                  }
              }
          })
          .populate({
            path: 'reviews',  // Make sure this matches the updated schema
            model: 'Review'
            // populate: {
            //     path: 'user',  // If you want to get user details along with the review
            //     model: 'User'
            // }
        });

      res.status(200).json({
          success: true,
          data: subservices
      });
  } catch (error) {
      console.error('Error fetching subservices:', error);
      res.status(500).json({ success: false, message: error.message });
  }
};


const getAllSubServicesForUser = async (req, res) => {
  console.log("hi")
    try {
        const subservices = await SubService.find({ isActive: true }); // Fetch active subservices

        res.status(200).json({
            success: true,
            data: subservices
        });
    } catch (error) {
        console.error('Error fetching subservices:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCategoriesForUser = async (req, res) => {
    try {
        const categories = await ServiceCategory.find(); // Fetch active categories
        console.log(categories)
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true }); // Fetch active categories

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSubCategoryHierarchy = async (req, res) => {
    try {
        const subcategories = await SubCategory.find({ isActive: true })
            .populate({
                path: 'services',
                match: { isActive: true },
                populate: {
                    path: 'subservices',
                    match: { isActive: true }
                }
            });

        res.status(200).json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategory hierarchy:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserSubCategoryHierarchy = async (req, res) => {
    try {
        const subcategories = await SubCategory.find({ isActive: true })
            .populate({
                path: 'services',
                match: { isActive: true },
                populate: {
                    path: 'subservices',
                    match: { isActive: true }
                }
            });

        res.status(200).json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategory hierarchy for user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Book subservice
exports.bookSubService = async (req, res) => {
    const { subServiceId, userId } = req.body; // Assuming these are passed in the request

    // Logic to find the subservice and create a booking
    const subService = await SubService.findById(subServiceId);
    if (!subService) {
        return res.status(404).json({ message: "Subservice not found." });
    }

    // Logic to create a booking
    const booking = new Booking({
        user: userId,
        subService: subServiceId,
        // other relevant booking details
    });

    await booking.save();
    return res.status(201).json({ message: "Booking created successfully", booking });
};

module.exports = {
  getCategories,
  getCategoryServices,
  getServiceDetails,
  searchServices,
  getPopularServices,
  getServiceHierarchy,
  getAllServices,
  getAllServicesForUser,
  getAllSubCategories,
  getAllSubCategoriesForUser,
  getAllSubServices,
  getAllSubServicesForUser,
  getAllCategoriesForUser,
  getAllCategories,
  getSubCategoryHierarchy,
  getUserSubCategoryHierarchy
};
