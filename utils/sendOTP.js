const fetch = require('node-fetch');

exports.sendOTP = async (phone, otp) => {
  try {
    console.log("calling sendOTP with phone:", phone, "and otp:", otp);
    
    const apiURL = 'http://123.108.46.13/sms-panel/api/http/index.php';

    const params = {
      username: 'OTPDEMO', // Replace with your actual username
      apikey: 'A7F54-E05A7',   // Replace with your actual API key
      apirequest: 'Text',
      sender: `ROHIPA`,
      mobile: phone,
      message: `Dear Customer Your verification code is ${otp} Regards Rohi`,
      route: `OTP`,
      TemplateID: `1707165538475778811`,
      format: 'JSON',
    };
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${apiURL}?${queryParams}`, {
      method: 'GET', // API uses GET method
    });

    if (response.ok) {
      // const data = await response.json();
      return true; // Return true if SMS sent successfully
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
      return false; // Return false if SMS sending failed
    }
    // Implement your SMS sending logic here
    console.log(`Sending OTP: ${otp} to phone: ${phone}`);
    // In production, integrate with SMS service provider
    return true;
  } catch (error) {
    console.error("SMS Sending Error:", error);
    throw error;
  }
};
