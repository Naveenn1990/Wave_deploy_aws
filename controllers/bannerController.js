const Banner = require("../models/Banner");
const fs = require("fs").promises;
const path = require("path");
const Promovideo = require("../models/Promovideo");
const { uploadFile2, deleteFile } = require("../middleware/aws");

// Helper function to get filename from path
const getFilename = (filepath) => {
  if (!filepath) return null;
  // If it's a full URL or path, extract just the filename
  if (filepath.includes('/')) {
    return filepath.split('/').pop();
  }
  return filepath;
};
 

const bannerController = {
  // Upload a new banner
  uploadBanner: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No banner image file provided",
        });
      }

      // Get just the filename without any path
      const filename =await uploadFile2(req.file,"banner")

      const banner = new Banner({
        image: filename,
        title: req.body.title,
        description: req.body.description,
        order: req.body.order || 0,
        isActive: true
      });

      await banner.save();

      const bannerResponse = banner;
      bannerResponse.image = (bannerResponse.image);

      res.status(201).json({
        success: true,
        message: "Banner uploaded successfully",
        banner: bannerResponse,
      });
    } catch (error) {
      console.error("Error in uploadBanner:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading banner",
        error: error.message,
      });
    }
  },

  // Get all banners
  getAllBanners: async (req, res) => {
    try {
      const banners = await Banner.find().sort({ order: 1 }).lean();
      
      // Clean image paths
      const bannersWithCleanImages = banners.map(banner => ({
        ...banner,
        image: (banner.image)
      }));

      res.status(200).json({
        success: true,
        banners: bannersWithCleanImages,
      });
    } catch (error) {
      console.error("Error in getAllBanners:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching banners",
        error: error.message,
      });
    }
  },

  // Get active banners for users
  getActiveBanners: async (req, res) => {
    try {
      const banners = await Banner.find({ isActive: true })
        .sort({ order: 1 })
        .lean();

      // Clean image paths
      const bannersWithCleanImages = banners.map(banner => ({
        ...banner,
        image: (banner.image)
      }));

      res.status(200).json({
        success: true,
        banners: bannersWithCleanImages,
      });
    } catch (error) {
      console.error("Error in getActiveBanners:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching active banners",
        error: error.message,
      });
    }
  },
 
 updateBanner : async (req, res) => {
    try {
      const { bannerId } = req.params;
      const { title } = req.body;
      
      // Create an object to store the update data
      let updateData = {};
  
      // Update title only if provided
      if (title) {
        updateData.title = title;
      }
  
      // Update image only if a new file is uploaded
      if (req.file) {
        updateData.image = await uploadFile2(req.file,"banner");
      }
      
      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields provided for update",
        });
      }
  
      console.log(updateData , bannerId ,"updateData")
      // Perform the update operation
      const banner = await Banner.findByIdAndUpdate(
        bannerId,
        { $set: updateData }, // Use $set to update only provided fields
        { new: true, lean: true }
      );
  
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: "Banner not found",
        });
      }
  
      // Clean the image path in response
      if (banner.image) {
        banner.image = (banner.image);
      }
  
      res.status(200).json({
        success: true,
        message: "Banner updated successfully",
        banner,
      });
    } catch (error) {
      console.error("Error in updateBanner:", error);
      res.status(500).json({
        success: false,
        message: "Error updating banner",
        error: error.message,
      });
    }
  },

  // Delete banner
  deleteBanner: async (req, res) => {
    try {
      const { bannerId } = req.params;
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: "Banner not found",
        });
      }

      // Delete the image file if it exists
      if (banner.image) {
        try {
          deleteFile(banner.image)
        } catch (err) {
          console.error("Error deleting banner image file:", err);
        }
      }

      await Banner.findByIdAndDelete(bannerId);

      res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteBanner:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting banner",
        error: error.message,
      });
    }
  },

  // Upload a new Promovideo
  uploadPromovideo: async (req, res) => {
    console.log("Req body and req.file : " , req.body , req.file)
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No PromoVideo file provided",
        });
      }

      // Get just the filename without any path
      const filename = await uploadFile2(req.file,"banner");

      const PromotionalVideo = new Promovideo({
        image: filename,
        title: req.body.title,
        description: req.body.description, 
        isActive: true
      });

      await PromotionalVideo.save();

      const PromovideoResponse = PromotionalVideo.toObject();
      PromovideoResponse.image = (PromovideoResponse.image);

      res.status(201).json({
        success: true,
        message: "Promotional Video uploaded successfully",
        banner: PromovideoResponse,
      });
    } catch (error) {
      console.error("Error in upload:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading PromotionalVideo",
        error: error.message,
      });
    }
  },

  // Get all Promovideos
  getAllPromovideos: async (req, res) => {
      try {
        const banners = await Promovideo.find().sort({ order: 1 }).lean();
        
        // Clean video paths
        const promoVideos = banners.map(banner => ({
          ...banner,
          image: (banner.image)
        }));
  
        res.status(200).json({
          success: true,
          promoVideos ,
        });
      } catch (error) {
        console.error("Error in getAllPromoVideos:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching PromoVideos",
          error: error.message,
        });
      }
  },

  updatePromoVideo: async (req, res) => {
    console.log("Req body and req.file: ", req.body, req.file);
    try {
      const { id } = req.params;
      const updateFields = {};
  
      // Check if the promo video exists
      const existingVideo = await Promovideo.findById(id);
      if (!existingVideo) {
        return res.status(404).json({
          success: false,
          message: "Promo Video not found",
        });
      }
  
      // Allow partial updates for title, description, and isActive
      if (req.body?.title) updateFields.title = req.body.title;
      // if (req.body?.description) updateFields.description = req.body.description;
      // if (req.body?.isActive !== undefined) updateFields.isActive = req.body.isActive;
  
      // If a new video file is uploaded, replace the old one
 
      // Store new file
      if (req?.file?.path){

        updateFields.image = await uploadFile2(req.file,"banner");
      }
      console.log("updateFields : " , updateFields)
      // Update the document
      const updatedPromo = await Promovideo.findByIdAndUpdate(id, updateFields, { new: true });
  
      res.status(200).json({
        success: true,
        message: "Promo Video updated successfully",
        updatedPromo,
      });
    } catch (error) {
      console.error("Error in updatePromoVideo:", error);
      res.status(500).json({
        success: false,
        message: "Error updating Promo Video",
        error: error.message,
      });
    }
  },

  deletePromoVideo: async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check if the promo video exists
      const promoVideo = await Promovideo.findById(id);
      if (!promoVideo) {
        return res.status(404).json({
          success: false,
          message: "Promo Video not found",
        });
      }
  
      // Delete the associated file from storage
      // deleteFile(promoVideo.image);
  
      // Remove from database
      await Promovideo.findByIdAndDelete(id);
  
      res.status(200).json({
        success: true,
        message: "Promo Video deleted successfully",
      });
    } catch (error) {
      console.error("Error in deletePromoVideo:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting Promo Video",
        error: error.message,
      });
    } 
  }
  
};

module.exports = bannerController 