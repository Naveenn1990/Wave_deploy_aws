exports.sendOTP = async (phone, otp) => {
  try {
    // Implement your SMS sending logic here
    console.log(`Sending OTP: ${otp} to phone: ${phone}`);
    // In production, integrate with SMS service provider
    return true;
  } catch (error) {
    console.error("SMS Sending Error:", error);
    throw error;
  }
};
