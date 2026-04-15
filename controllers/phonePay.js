// const transactionModel = require("../models/phonePay")
// const axios = require("axios");
// const crypto = require('crypto');
// const MERCHANT_ID = "M22TSD1Q44NGY";
// const SECRET_KEY = "883088e0-5c29-40a0-8577-bda713f8da3f";
// const CALLBACK_URL = "https://wavetechservice.in";


// // PayU Configuration from environment variables
// const PAYU_CONFIG = {
//   key: process.env.PAYU_MERCHANT_KEY||"d50S7c",
//   salt: process.env.PAYU_MERCHANT_SALT||"eDjkqwfl7U4LWH5C1awowMFKMw4F8Be9",
//   baseUrl: process.env.PAYU_MODE === 'production' ? 'https://secure.payu.in' : 'https://test.payu.in',
//   skipHashVerification: process.env.PAYU_SKIP_HASH_VERIFICATION === 'true',
// };

// // Log configuration on startup (without exposing sensitive data)
// console.log('PayU Configuration:', {
//   keyPresent: !!PAYU_CONFIG.key,
//   saltPresent: !!PAYU_CONFIG.salt,
//   baseUrl: PAYU_CONFIG.baseUrl,
//   mode: process.env.PAYU_MODE
// });

// class Transaction{
//   // PayU Payment - Main payment initiation (keeping same API name as PhonePe)
//   async addPaymentPhone(req, res) {
//     try {
//       // Validate PayU configuration
//       if (!PAYU_CONFIG.key || !PAYU_CONFIG.salt) {
//         console.error('PayU Config Error:', PAYU_CONFIG);
//         return res.status(500).json({ error: "PayU configuration missing. Check environment variables." });
//       }

//       let { userId, username, Mobile, orderId, amount, config, successUrl, failedUrl, email } = req.body;
//         if(!username){
//           username="Parner"
//         }

//       // Validate required fields
//       if (!userId || !username || !Mobile || !amount) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }

//       // Validate and format amount - PayU requires proper decimal format
//       let numAmount = parseFloat(amount);
//       if (isNaN(numAmount) || numAmount <= 0) {
//         return res.status(400).json({ error: "Invalid amount" });
//       }

//       // PayU requires amount with exactly 2 decimal places, minimum 1.00
//       if (numAmount < 1) {
//         numAmount = 1.00;
//       }
//       const formattedAmount = numAmount.toFixed(2);

//       let data = await transactionModel.create({
//         userId,
//         username:username||"Partner",
//         Mobile,
//         orderId,
//         amount: numAmount,
//         config,
//         successUrl,
//         failedUrl,
//         paymentGateway: 'PayU',
//         email
//       });

//       if (!data) return res.status(400).json({ error: "Something went wrong" });

//       // Generate PayU payment parameters
//       const txnid = data._id.toString();
//       const productinfo = orderId || 'Service Payment';
//       const firstname = username;
//       const userEmail = email || `${userId}@wavetechservice.in`;
//       const phone = Mobile.toString();
//       const surl = `https://wavetechservice.in/api/phonepay/payment-success`;
//       const furl = `https://wavetechservice.in/api/phonepay/payment-failed`;

//       // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
//       const hashString = `${PAYU_CONFIG.key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${userEmail}|||||||||||${PAYU_CONFIG.salt}`;
//       const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//       console.log('PayU Payment Request:', {
//         key: PAYU_CONFIG.key,
//         txnid,
//         amount: formattedAmount,
//         productinfo,
//         firstname,
//         email: userEmail,
//         phone,
//         baseUrl: PAYU_CONFIG.baseUrl
//       });

//       const paymentData = {
//         key: PAYU_CONFIG.key,
//         txnid: txnid,
//         amount: formattedAmount,
//         productinfo: productinfo,
//         firstname: firstname,
//         email: userEmail,
//         phone: phone,
//         surl: surl,
//         furl: furl,
//         hash: hash
//       };

//       // Store payment data temporarily in the transaction record
//       data.paymentData = JSON.stringify(paymentData);
//       await data.save();

//       // Return a URL to our redirect endpoint
//       const redirectUrl = `https://wavetechservice.in/api/phonepay/payu-redirect/${data._id}`;

//       // Return response in same format as PhonePe (with nested url object)
//       return res.status(200).json({
//         id: data._id,
//         url: { url: redirectUrl }
//       });
//     } catch (error) {
//       console.log('PayU Error:', error);
//       return res.status(500).json({ error: error.message });
//     }
//   }

//   // PayU Redirect endpoint - serves HTML form that auto-submits to PayU
//   async payuRedirect(req, res) {
//     try {
//       const transactionId = req.params.id;
//       const transaction = await transactionModel.findById(transactionId);

//       if (!transaction || !transaction.paymentData) {
//         return res.status(404).send('Transaction not found');
//       }

//       const paymentData = JSON.parse(transaction.paymentData);

//       // Create HTML form that auto-submits to PayU
//       const html = `
// <!DOCTYPE html>
// <html>
// <head>
//   <title>Redirecting to Payment Gateway...</title>
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <style>
//     body {
//       font-family: Arial, sans-serif;
//       text-align: center;
//       padding: 50px;
//       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//       color: white;
//       margin: 0;
//       min-height: 100vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }
//     .container {
//       background: white;
//       color: #333;
//       padding: 40px;
//       border-radius: 10px;
//       box-shadow: 0 10px 40px rgba(0,0,0,0.2);
//       max-width: 400px;
//     }
//     .loader {
//       border: 5px solid #f3f3f3;
//       border-top: 5px solid #667eea;
//       border-radius: 50%;
//       width: 50px;
//       height: 50px;
//       animation: spin 1s linear infinite;
//       margin: 20px auto;
//     }
//     @keyframes spin {
//       0% { transform: rotate(0deg); }
//       100% { transform: rotate(360deg); }
//     }
//     h2 { color: #667eea; margin-bottom: 10px; }
//     p { color: #666; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <h2>Redirecting to Payment Gateway</h2>
//     <div class="loader"></div>
//     <p>Please wait while we redirect you to the secure payment page...</p>
//   </div>
//   <form id="payuForm" action="${PAYU_CONFIG.baseUrl}/_payment" method="POST">
//     <input type="hidden" name="key" value="${paymentData.key}" />
//     <input type="hidden" name="txnid" value="${paymentData.txnid}" />
//     <input type="hidden" name="amount" value="${paymentData.amount}" />
//     <input type="hidden" name="productinfo" value="${paymentData.productinfo}" />
//     <input type="hidden" name="firstname" value="${paymentData.firstname}" />
//     <input type="hidden" name="email" value="${paymentData.email}" />
//     <input type="hidden" name="phone" value="${paymentData.phone}" />
//     <input type="hidden" name="surl" value="${paymentData.surl}" />
//     <input type="hidden" name="furl" value="${paymentData.furl}" />
//     <input type="hidden" name="hash" value="${paymentData.hash}" />
//   </form>
//   <script>
//     setTimeout(function() {
//       document.getElementById('payuForm').submit();
//     }, 1000);
//   </script>
// </body>
// </html>`;

//       res.send(html);
//     } catch (error) {
//       console.error('PayU Redirect Error:', error);
//       res.status(500).send('Error processing payment redirect');
//     }
//   }

//   // PayU Success handler
//   async paymentSuccess(req, res) {
//     try {
//       const { txnid, status, hash, amount, productinfo, firstname, email, mihpayid } = req.body;

//       console.log('PayU Success Callback:', { txnid, status, mihpayid });
//       let data = await transactionModel.findById(txnid);
//       // Verify hash if not skipped
//       if (!PAYU_CONFIG.skipHashVerification) {
//         const hashString = `${PAYU_CONFIG.salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.key}`;
//         const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
//         if (calculatedHash !== hash) {
//           console.log('Hash verification failed');
//           return res.redirect(`https://wavetechservice.in/payment-success?transactionId=${txnid}&userID=${data?.userId || ''}`);
//         }
//       }


//       if (data) {
//         data.status = 'COMPLETED';
//         data.paymentId = mihpayid;

//         // Call config API if exists
//         if (data.config) {
//           try {
//             await axios(JSON.parse(data.config));
//             data.config = null;
//           } catch (configError) {
//             console.error('Config API call failed:', configError);
//           }
//         }
//         await data.save();
//       }

//       console.log(`PayU Transaction ${txnid} completed successfully`);

//       // Redirect to success page
//       res.redirect(`https://wavetechservice.in/payment-success?transactionId=${txnid}&userID=${data?.userId || ''}`);
//     } catch (error) {
//       console.error('Payment Success Error:', error);
//       res.redirect(`https://wavetechservice.in/payment-success?error=processing_error`);
//     }
//   }

//   // PayU Failed handler
//   async paymentFailed(req, res) {
//     try {
//       const { txnid, status, hash, amount, productinfo, firstname, email, mihpayid } = req.body;

//       console.log('PayU Failed Callback:', { txnid, status, mihpayid });
//       let data = await transactionModel.findById(txnid);
//       // Verify hash if not skipped
//       if (!PAYU_CONFIG.skipHashVerification) {
//         const hashString = `${PAYU_CONFIG.salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.key}`;
//         const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
//         if (calculatedHash !== hash) {
//           console.log('Hash verification failed');
//           return res.redirect(`https://wavetechservice.in/payment-success?transactionId=${txnid}&userID=${data?.userId || ''}`);
//         }
//       }


//       if (data) {
//         data.status = 'FAILED';
//         data.paymentId = mihpayid;
//         await data.save();
//       }

//       console.log(`PayU Transaction ${txnid} failed`);

//       // Redirect to failed page (do NOT call config API)
//       res.redirect(`https://wavetechservice.in/payment-success?transactionId=${txnid}&userID=${data?.userId || ''}`);
//     } catch (error) {
//       console.error('Payment Failed Error:', error);
//       res.redirect(`https://wavetechservice.in/payment-success?error=processing_error`);
//     }
//   }

//   // PayU Callback handler (keeping for backward compatibility)
//   async paymentcallback(req, res) {
//     try {
//       const { txnid, status, hash, amount, productinfo, firstname, email, mihpayid } = req.body;

//       console.log('PayU Callback received:', { txnid, status, mihpayid });

//       // Verify hash if not skipped
//       if (!PAYU_CONFIG.skipHashVerification) {
//         const hashString = `${PAYU_CONFIG.salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.key}`;
//         const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
//         if (calculatedHash !== hash) {
//           console.log('Hash verification failed');
//           return res.status(400).json({ error: 'Invalid hash' });
//         }
//       }

//       let data = await transactionModel.findById(txnid);
//       if (data) {
//         data.status = status === 'success' ? 'COMPLETED' : 'FAILED';
//         data.paymentId = mihpayid;

//         if (status === 'success' && data.config) {
//           // await axios(JSON.parse(data.config));
//           // data.config = null;
//         }
//         await data.save();
//       }

//       console.log(`PayU Transaction ${txnid}, Status: ${status}`);
//       res.status(200).send('Callback processed');
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({ error: error.message });
//     }
//   }

//   // Check payment status
//   async checkPayment(req, res) {
//     try {
//       let id = req.params.id;
//       let userId = req.params.userId;
//       let check = await transactionModel.findOne({ _id: id, userId: userId });
//       if (!check) return res.status(400).json({ error: "Payment is not completed" });
//       return res.status(200).json({ success: check });
//     } catch (error) {
//       console.log(error);
//       return res.status(400).json({ error: error.message });
//     }
//   }

//   // Update payment status manually
//   async updateStatuspayment(req, res){
//     try{
//       let id = req.params.id;
//       let data = await transactionModel.findById(id);
//       if(!data) return res.status(400).json({error: "Data not found"});
//       data.status = "Completed";
//       await data.save();
//       return res.status(200).json({success: "Successfully Completed"});
//     }catch(error){
//       console.log(error);
//       return res.status(500).json({error: error.message});
//     }
//   }

//   // Get all payments
//   async getallpayment(req, res){
//     try{
//       let data = await transactionModel.find({}).sort({_id: -1});
//       return res.status(200).json({success: data});
//     }catch(error){
//       console.log(error);
//       return res.status(500).json({error: error.message});
//     }
//   }

//   // Generic makepayment method (using PayU)
//   async makepayment(req, res) {
//     try {
//       let { amount, merchantTransactionId, merchantUserId, mobileNumber, email } = req.body;

//       let numAmount = parseFloat(amount);
//       if (isNaN(numAmount) || numAmount <= 0) {
//         return res.status(400).json({ error: "Invalid amount" });
//       }

//       // PayU requires minimum 1.00
//       if (numAmount < 1) {
//         numAmount = 1.00;
//       }
//       const formattedAmount = numAmount.toFixed(2);

//       const txnid = merchantTransactionId || `TXN${Date.now()}`;
//       const productinfo = 'Service Payment';
//       const firstname = merchantUserId || 'Customer';
//       const userEmail = email || `${merchantUserId}@wavetechservice.in`;
//       const phone = mobileNumber ? mobileNumber.toString() : '';
//       const surl = `https://wavetechservice.in/api/phonepay/payment-success`;
//       const furl = `https://wavetechservice.in/api/phonepay/payment-failed`;

//       const hashString = `${PAYU_CONFIG.key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${userEmail}|||||||||||${PAYU_CONFIG.salt}`;
//       const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//       const paymentData = {
//         key: PAYU_CONFIG.key,
//         txnid: txnid,
//         amount: formattedAmount,
//         productinfo: productinfo,
//         firstname: firstname,
//         email: userEmail,
//         phone: phone,
//         surl: surl,
//         furl: furl,
//         hash: hash
//       };

//       // Create temporary transaction to store payment data
//       const tempTransaction = await transactionModel.create({
//         userId: merchantUserId,
//         username: firstname,
//         Mobile: phone,
//         orderId: txnid,
//         amount: numAmount,
//         paymentGateway: 'PayU',
//         paymentData: JSON.stringify(paymentData)
//       });

//       const redirectUrl = `https://wavetechservice.in/api/phonepay/payu-redirect/${tempTransaction._id}`;

//       return res.status(200).json({
//         url: { url: redirectUrl }
//       });
//     } catch (error) {
//       console.error("Payment Error:", error);
//       return res.status(500).json({ error: error.message });
//     }
//   }
// }

// module.exports = new Transaction();


const transactionModel = require("../models/phonePay")
const MERCHANT_ID = "M22TSD1Q44NGY";
const SECRET_KEY = "883088e0-5c29-40a0-8577-bda713f8da3f";
const CALLBACK_URL = "https://wavetechservice.in";
const axios = require("axios");
const crypto = require('crypto');


class Transaction {
  async addPaymentPhone(req, res) {
    try {
      let { userId, username, Mobile, orderId, amount, config, successUrl, failedUrl } =
        req.body;
      let data = await transactionModel.create({
        userId,
        username,
        Mobile,
        orderId,
        amount,
        config,

        successUrl, failedUrl
      });
      if (!data) return res.status(400).json({ error: "Something went worng" });
      // console.log("Data created:", req.body);
      function generateSignature(payload, saltKey, saltIndex) {
        const encodedPayload = Buffer.from(payload).toString("base64");
        const concatenatedString = encodedPayload + "/pg/v1/pay" + saltKey;
        const hashedValue = crypto
          .createHash("sha256")
          .update(concatenatedString)
          .digest("hex");

        const signature = hashedValue + "###" + saltIndex;
        return signature;
      }

      const paymentDetails = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: data._id,
        merchantUserId: userId,
        amount: amount * 100,
        redirectUrl: `https://wavetechservice.in/payment-success?transactionId=${data._id}&userID=${userId}`,
        redirectMode: "GET",
        callbackUrl: "https://wavetechservice.in/api/phonepay/payment-callback",
        mobileNumber: Mobile.toString(),
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const payload = JSON.stringify(paymentDetails);
      let objJsonB64 = Buffer.from(payload).toString("base64");
      const saltKey = SECRET_KEY; //test key
      const saltIndex = 1;
      const signature = generateSignature(payload, saltKey, saltIndex);

      const response = await axios.post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",

        // "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
        {
          request: objJsonB64,
        },
        {
          headers: {
            "X-VERIFY": signature,
          },
        }
      );

      console.log(
        "Payment Response:",
        response.data,
        response.data?.data.instrumentResponse?.redirectInfo?.url
      );

      return res.status(200).json({
        id: data._id,
        url: response.data?.data.instrumentResponse?.redirectInfo,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateStatuspayment(req, res) {
    try {
      let id = req.params.id;
      let data = await transactionModel.findById(id);
      if (!data) return res.status(400).json({ error: "Data not found" });
      data.status = "Completed";
      data.save();
      return res.status(200).json({ success: "Successfully Completed" });
    } catch (error) {
      console.log(error);
    }
  }

  async checkPayment(req, res) {
    try {

      let id = req.params.id;
      let userId = req.params.userId
      let check = await transactionModel.findOne({ _id: id, userId: userId });
      if (!check) return res.status(400).json({ error: "Payment is not completed" });
      return res.status(200).json({ success: check })

    } catch (error) {
      console.log(error)
      return res.status(400).json({ error: error.message })
    }
  }

  async paymentcallback(req, res) {
    const { response } = req.body;

    const decodedStr = Buffer.from(response, 'base64').toString('utf-8');

    // Parse JSON
    const responseJson = JSON.parse(decodedStr);
    console.log(responseJson?.data);
    const { merchantTransactionId, state } = responseJson?.data;

    // Log the callback data for debugging
    console.log(`Callback received: Transaction ${merchantTransactionId}, Status: ${state}`);
    let data = await transactionModel.findById(merchantTransactionId);
    if (data) {
      data.status = state;
      if (state === 'COMPLETED' && data.config) {
        await axios(JSON.parse(data.config))
        data.config = null
      }
      await data.save()
    }
    // Update transaction status in your database
    if (state === 'COMPLETED') {


      // Mark the transaction as successful
      // Update relevant database records
      console.log(`Transaction ${merchantTransactionId} was successful.`);
    } else {
      // Handle failure or pending status
      console.log(`Transaction ${merchantTransactionId} failed or is pending.`);
    }

    // Send a response back to the payment gateway
    res.status(200).send('Callback processed');
  }



  async getallpayment(req, res) {
    try {
      let data = await transactionModel.find({}).sort({ _id: -1 });
      return res.status(200).json({ success: data });
    } catch (error) {
      console.log(error)
    }
  }

  async makepayment(req, res) {
    let {
      amount,
      merchantTransactionId,
      merchantUserId,
      redirectUrl,
      callbackUrl,
      mobileNumber,
    } = req.body;

    function generateSignature(payload, saltKey, saltIndex) {
      const encodedPayload = Buffer.from(payload).toString("base64");
      const concatenatedString = encodedPayload + "/pg/v1/pay" + saltKey;
      const hashedValue = crypto
        .createHash("sha256")
        .update(concatenatedString)
        .digest("hex");

      const signature = hashedValue + "###" + saltIndex;
      return signature;
    }

    const paymentDetails = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: amount,
      redirectUrl: CALLBACK_URL,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(paymentDetails);
    let objJsonB64 = Buffer.from(payload).toString("base64");
    const saltKey = SECRET_KEY; //test key
    const saltIndex = 1;
    const signature = generateSignature(payload, saltKey, saltIndex);

    try {
      const response = await axios.post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",

        // "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
        {
          request: objJsonB64,
        },
        {
          headers: {
            "X-VERIFY": signature,
          },
        }
      );

      //   console.log(
      //     "Payment Response:",
      //     response.data,
      //     response.data?.data.instrumentResponse?.redirectInfo?.url
      //   );
      return res.status(200).json({
        url: response.data?.data.instrumentResponse?.redirectInfo,
      });
    } catch (error) {
      console.error("Payment Error:", error);
    }
  }
}

module.exports = new Transaction();
