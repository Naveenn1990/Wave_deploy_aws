const Cart = require("../models/cart");
const ServiceCategory = require("../models/ServiceCategory");
const SubService = require("../models/SubService");

// Get cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.json({ 
        _id: null,
        user: null,
        totalAmount: 0,
        createdAt: null,
        updatedAt: null,
        items: [] 
      });
    }

    // Populate service and subservice details for each cart item
    const populatedCart = {
      _id: cart._id,
      user: cart.user,
      totalAmount: cart.totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: await Promise.all(cart.items.map(async (item) => {
        console.log("Processing item:", item);

        // Find the category that contains this service
        const category = await ServiceCategory.findOne({ "services._id": item.service });

        if (!category) {
          console.log(`Category not found for service ID: ${item.service}`);
        }

        // Extract service details
        const service = category?.services?.find(
          s => s._id.toString() === item.service.toString()
        );

        if (!service) {
          console.log(`Service not found in category for service ID: ${item.service}`);
        }

        // Extract subservice details if applicable
        let subservice = null;
        if (service && item.subservice) {
          subservice = service.subservices?.find(
            sub => sub._id.toString() === item.subservice.toString()
          );

          if (!subservice) {
            console.log(`Subservice not found for subservice ID: ${item.subservice}`);
          }
        }

        return {
          _id: item._id,
          serviceId: service?._id,
          serviceName: service?.name,
          serviceDescription: service?.description,
          // serviceBasePrice: service?.basePrice,
          serviceDuration: service?.duration,
          subserviceId: subservice?._id, // Add this line for subservice ID
          subserviceName: subservice?.name,
          subservicePrice: subservice?.price,
          subserviceDescription: subservice?.description,
          quantity: item.quantity, // This already exists
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
          location: item.location
        };
      }))
    };

    res.json(populatedCart);
  } catch (error) {
    console.error("🔥 Error in getCart:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
};



// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params; // The item ID from request

    // Fetch the cart for the logged-in user
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 🔍 DEBUG: Print the items in the cart
    console.log("🛒 Cart Items Before Removal:", cart.items.map(item => ({
      id: item._id.toString(),
      subservice: item.subservice ? item.subservice.toString() : "MISSING"
    })));

    console.log("🔍 Requested itemId:", itemId);

    // Find the item to remove
    const itemToRemove = cart.items.find(item => item._id.toString() === itemId);

    if (!itemToRemove) {
      console.log("❌ Item not found in cart");
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove the item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    await cart.save();

    res.json({ message: "Item removed from cart successfully", cart });
  } catch (error) {
    console.error("🔥 Error in removeFromCart:", error);
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
// Add subservice directly to cart
exports.addSubServiceToCart = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { subserviceId, scheduledDate, scheduledTime, location } = req.body;

    if (!subserviceId) {
      console.error("subserviceId is missing in request body");
      return res.status(400).json({ message: "subserviceId is required" });
    }

    console.log("Subservice ID from request body:", subserviceId);

    // Fetch subservice details
    const subservice = await SubService.findById(subserviceId);
    if (!subservice) {
      console.error("Subservice not found for ID:", subserviceId);
      return res.status(404).json({ message: "Subservice not found" });
    }

    console.log("Fetched Subservice:", subservice);

    if (typeof subservice.price !== "number") {
      console.error("Invalid subservice price for ID:", subserviceId);
      return res.status(400).json({ message: "Invalid subservice price" });
    }

    // Find user's cart; if not found, create a new one
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    console.log("Cart before update:", JSON.stringify(cart, null, 2));

    // Check if the subservice is already in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.subservice?.toString() === subserviceId
    );

    if (existingItemIndex !== -1) {
      console.log("Subservice already in cart, removing it...");
      // Remove the item if it already exists (toggle behavior)
      cart.items.splice(existingItemIndex, 1);
    } else {
      console.log("Adding new subservice to cart...");
      // Add the subservice item to the cart
      cart.items.push({
        subservice: subserviceId,
        price: subservice.price
      });
    }

    // Recalculate totalAmount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price || 0), 0);

    await cart.save();

    console.log("Updated Cart:", JSON.stringify(cart, null, 2));
    res.json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart", error: error.message });
  }
};



// Get user's cart
exports.getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.subservice");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
};

// Remove an item from the cart
exports.removeItemFromCart = async (req, res) => {
  try {
    const { subserviceId } = req.body;

    if (!subserviceId) {
      return res.status(400).json({ message: "subserviceId is required" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.subservice.toString() !== subserviceId);

    // Recalculate totalAmount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Error removing item from cart" });
  }
};

// Clear the cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 },
      { new: true }
    );

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Error clearing cart" });
  }
};




// exports.addSubServiceToCart = async (req, res) => {
//   try {
//     console.log("Request Body:", req.body);
//     const { subserviceId, quantity, scheduledTime, scheduledDate } = req.body;

//     // Fetch the subservice directly from the SubService collection
//     const subservice = await SubService.findById(subserviceId);

//     if (!subservice) {
//       console.error("Subservice not found for ID:", subserviceId);
//       return res.status(404).json({ message: "Subservice not found" });
//     }

//     console.log("Fetched Subservice:", subservice);

//     if (!subservice.price || isNaN(subservice.price)) {
//       console.error("Subservice price is invalid for ID:", subserviceId);
//       return res.status(400).json({ message: "Invalid subservice price" });
//     }

//     // Find or create user's cart
//     let cart = await Cart.findOne({ user: req.user._id });

//     if (!cart) {
//       cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
//     }

//     // Ensure `items` is always an array (prevents `undefined` issues)
//     if (!Array.isArray(cart.items)) {
//       cart.items = [];
//     }

//     // Convert subserviceId to string to prevent mismatches
//     const subserviceIdStr = subserviceId.toString();

//     // Check if the subservice is already in the cart
//     const existingItemIndex = cart.items.findIndex(item => item.subservice?.toString() === subserviceIdStr);

//     if (existingItemIndex > -1) {
//       // If the subservice already exists, update its quantity and scheduled details
//       cart.items[existingItemIndex].quantity += quantity;
//       cart.items[existingItemIndex].scheduledTime = scheduledTime;
//       cart.items[existingItemIndex].scheduledDate = scheduledDate;
//     } else {
//       // Add new subservice to the cart
//       const cartItem = {
//         subservice: subservice._id, // Ensure ObjectId consistency
//         quantity,
//         scheduledTime,
//         scheduledDate,
//         service: subservice.service, // Correct reference to service
//         price: subservice.price,
//       };

//       console.log("New Cart Item:", cartItem);
//       cart.items.push(cartItem);
//     }

//     // Recalculate total amount
//     cart.totalAmount = cart.items.reduce((sum, item) => {
//       const price = item.price || 0; // Ensure price is a valid number
//       const quantity = item.quantity || 1; // Default quantity to 1 if missing
//       return sum + price * quantity;
//     }, 0);

//     await cart.save();

//     console.log("Cart after update:", cart);
//     res.json({
//       message: "Subservice added to cart successfully",
//       cart,
//     });
//   } catch (error) {
//     console.error("Error in addSubServiceToCart:", error);
//     res.status(500).json({ message: "Error adding subservice to cart" });
//   }
// };




// New function for adding sub-services directly to the cart
exports.addSubServiceToCartNew = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { subserviceId, quantity } = req.body;

    // Validate request data
    if (!subserviceId || !quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Fetch the subservice from the database
    const subservice = await SubService.findById(subserviceId);
    if (!subservice) {
      return res.status(404).json({ message: "Subservice not found" });
    }

    console.log("Fetched Subservice:", subservice);

    // Find or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    // Ensure `cart.items` is an array
    if (!Array.isArray(cart.items)) {
      cart.items = [];
    }

    console.log("Current Cart:", cart);

    // Convert `subserviceId` to string for proper comparison
    const subserviceIdStr = subserviceId.toString();

    // Find if subservice already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.subservice?.toString() === subserviceIdStr
    );

    if (existingItemIndex > -1) {
      // If item exists, update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new subservice to the cart
      cart.items.push({
        subservice: subservice._id,
        quantity,
        price: subservice.price || 0, // Store price to avoid re-fetching later
      });
    }

    // Recalculate total amount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Save the updated cart
    await cart.save();

    console.log("Updated Cart:", cart);

    res.json({
      message: "Subservice added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in addSubServiceToCartNew:", error);
    res.status(500).json({ message: "Error adding subservice to cart" });
  }
};
