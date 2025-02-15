const Cart = require("../models/cart");
const ServiceCategory = require("../models/ServiceCategory");

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const {
      serviceId,
      scheduledDate,
      scheduledTime,
      location,
    } = req.body;

    // Find the category containing this service
    const category = await ServiceCategory.findOne({
      "services._id": serviceId
    });

    if (!category) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Get the specific service from the category
    const service = category.services.find(
      service => service._id.toString() === serviceId
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if service already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.service.toString() === serviceId
    );

    const cartItem = {
      service: serviceId,
      scheduledDate,
      scheduledTime,
      location,
    };

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex] = cartItem;
    } else {
      // Add new item
      cart.items.push(cartItem);
    }

    // Calculate total amount
    cart.totalAmount = service.basePrice || 0;

    await cart.save();

    res.json({
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({ message: "Error adding item to cart" });
  }
};

// Get cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    // Populate service details for each cart item
    const populatedCart = {
      ...cart.toObject(),
      items: await Promise.all(cart.items.map(async (item) => {
        const category = await ServiceCategory.findOne({
          "services._id": item.service
        });
        const service = category?.services?.find(
          s => s._id.toString() === item.service.toString()
        );
        return {
          ...item,
          service: service ? {
            _id: service._id,
            name: service.name,
            description: service.description,
            basePrice: service.basePrice,
            duration: service.duration
          } : null
        };
      }))
    };

    res.json(populatedCart);
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    // Recalculate total amount
    if (cart.items.length === 0) {
      cart.totalAmount = 0;
    } else {
      const category = await ServiceCategory.findOne({
        "services._id": cart.items[0].service
      });
      const service = category?.services?.find(
        s => s._id.toString() === cart.items[0].service.toString()
      );
      cart.totalAmount = service?.basePrice || 0;
    }

    await cart.save();

    res.json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    res.status(500).json({ message: "Error removing item from cart" });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      scheduledDate,
      scheduledTime,
      location,
    } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update item
    cart.items[itemIndex] = {
      ...cart.items[itemIndex],
      scheduledDate: scheduledDate || cart.items[itemIndex].scheduledDate,
      scheduledTime: scheduledTime || cart.items[itemIndex].scheduledTime,
      location: location || cart.items[itemIndex].location,
    };

    await cart.save();

    res.json({
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    res.status(500).json({ message: "Error updating cart item" });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error in clearCart:", error);
    res.status(500).json({ message: "Error clearing cart" });
  }
};
