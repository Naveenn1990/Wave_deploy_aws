const ServiceCategory = require("../models/ServiceCategory");
const PartnerService = require("../models/PartnerService");

// Get all categories with services
exports.getAllCategories = async (req, res) => {
  try {
    const allCategories = await ServiceCategory.find({});
    // console.log(`All categories in the database: ${JSON.stringify(allCategories)}`);
    // console.log(`Number of categories fetched: ${allCategories.length}`);
    allCategories.forEach(category => {
      // console.log(`Category: ${category.name}, Icon: ${category.icon}`);
      // console.log(`Icon: ${category.icon}`); // added this line
    });
    const categories = allCategories.filter(category => category.status === 'active');
    // console.log(`Number of active categories fetched: ${categories.length}`);
    const defaultIcon = "path/to/default/icon.png";
    res.json({
      success: true,
      categories: categories.map(category => ({
        _id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon || defaultIcon
      }))
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories"
    });
  }
};

// Get category details
exports.getCategoryDetails = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ServiceCategory.findById(categoryId).populate({
      path: "services",
      select: "-createdBy",
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get active partners count for this category
    const activePartnersCount = await PartnerService.countDocuments({
      category: categoryId,
      status: "active",
    });

    // Get service statistics
    const serviceStats = await Promise.all(
      category.services.map(async (service) => {
        const partnerCount = await PartnerService.countDocuments({
          category: categoryId,
          "service._id": service._id,
          status: "active",
        });

        return {
          serviceId: service._id,
          name: service.name,
          activePartners: partnerCount,
        };
      })
    );

    res.json({
      category,
      stats: {
        totalActivePartners: activePartnersCount,
        serviceWisePartners: serviceStats,
      },
    });
  } catch (error) {
    console.error("Get Category Details Error:", error);
    res.status(500).json({ message: "Error fetching category details" });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, services } = req.body;

    const category = new ServiceCategory({
      name,
      description,
      services: services.map(service => ({
        name: service.name,
        description: service.description,
        basePrice: service.basePrice
      }))
    });

    await category.save();

    res.json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category"
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If status is being updated to inactive, check for active partners
    if (updates.status === "inactive") {
      const hasActivePartners = await PartnerService.exists({
        category: categoryId,
        status: "active",
      });

      if (hasActivePartners) {
        return res.status(400).json({
          message: "Cannot deactivate category with active partners",
        });
      }
    }

    Object.assign(category, updates);
    await category.save();

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has active partners
    const hasActivePartners = await PartnerService.exists({
      category: categoryId,
      status: "active",
    });

    if (hasActivePartners) {
      return res.status(400).json({
        message: "Cannot delete category with active partners",
      });
    }

    await category.remove();

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};

// Add service to category
exports.addService = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, basePrice, commissionRate } = req.body;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if service already exists in category
    if (category.services.some((service) => service.name === name)) {
      return res.status(400).json({
        message: "Service already exists in this category",
      });
    }

    category.services.push({
      name,
      description,
      basePrice,
      commissionRate,
    });

    await category.save();

    res.json({
      message: "Service added successfully",
      service: category.services[category.services.length - 1],
    });
  } catch (error) {
    console.error("Add Service Error:", error);
    res.status(500).json({ message: "Error adding service" });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { categoryId, serviceId } = req.params;
    const updates = req.body;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const service = category.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // If status is being updated to inactive, check for active partners
    if (updates.status === "inactive") {
      const hasActivePartners = await PartnerService.exists({
        category: categoryId,
        "service._id": serviceId,
        status: "active",
      });

      if (hasActivePartners) {
        return res.status(400).json({
          message: "Cannot deactivate service with active partners",
        });
      }
    }

    Object.assign(service, updates);
    await category.save();

    res.json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update Service Error:", error);
    res.status(500).json({ message: "Error updating service" });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const { categoryId, serviceId } = req.params;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if service has active partners
    const hasActivePartners = await PartnerService.exists({
      category: categoryId,
      "service._id": serviceId,
      status: "active",
    });

    if (hasActivePartners) {
      return res.status(400).json({
        message: "Cannot delete service with active partners",
      });
    }

    category.services.pull(serviceId);
    await category.save();

    res.json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete Service Error:", error);
    res.status(500).json({ message: "Error deleting service" });
  }
};

module.exports = exports;
