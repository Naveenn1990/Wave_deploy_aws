const Razorpay = require("razorpay");
require("dotenv").config();

// Check if credentials exist
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Razorpay credentials are missing in .env file");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (amount) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    return await razorpay.orders.create(options);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    throw new Error("Failed to create payment order");
  }
};

// Verify payment signature
exports.verifyPayment = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return false;
  }
};
