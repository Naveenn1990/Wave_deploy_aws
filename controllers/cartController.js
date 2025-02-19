const Cart = require("../models/cart");
const ServiceCategory = require("../models/ServiceCategory");
const SubService = require("../models/SubService");

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

// Add subservice directly to cart
exports.addSubServiceToCart = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { subserviceId, quantity, scheduledTime, scheduledDate } = req.body;

    // Fetch the subservice directly from the SubService collection
    const subservice = await SubService.findById(subserviceId);

    if (!subservice) {
      console.error("Subservice not found for ID:", subserviceId);
      return res.status(404).json({ message: "Subservice not found" });
    }

    console.log("Fetched Subservice:", subservice);

    if (!subservice.price) {
      console.error("Subservice price is undefined for ID:", subserviceId);
      return res.status(400).json({ message: "Invalid subservice price" });
    }

    // Calculate total amount based on subservice price and quantity
    const totalAmount = subservice.price * quantity;
    // console.log(totalAmount , "totalAmount")
    // Find or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    // if (!cart) {
    // }
    cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });

    // Create new cart item
    const cartItem = {
      subservice: subserviceId,
      quantity,
      scheduledTime,
      scheduledDate,
      service: subserviceId, // Ensure this is correctly referenced
      price: subservice.price,
    };

    console.log(`Cart Item:`, cartItem);

    // Add new item to the cart
    cart.items.push(cartItem);

    // Recalculate total amount
    console.log("start",cart , "cart")
    // cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.totalAmount = cart.items.reduce((sum, item) => {
      const price = item.price || 0; // Ensure price is a valid number
      const quantity = item.quantity || 1; // Default quantity to 1 if missing
      return sum + (price * quantity);
    }, 0);
    
    await cart.save();

    console.log("end" , "cart")
    res.json({
      message: "Subservice added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in addSubServiceToCart:", error);
    res.status(500).json({ message: "Error adding subservice to cart" });
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

