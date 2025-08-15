const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulate a login request to mantrishop.in and log the response
app.post('/login', async (req, res) => {
  try {
    const mobile = req.body.mobile || '+918903200000'; // Example mobile number
    const password = req.body.password || 'c4ca4238a0b923820dcc509a6f75849b'; // Example password hash

    const response = await axios.post('https://mantrishop.in/lottery-backend/glserver/user/login', null, {
      params: {
        mobile: mobile,
        password: password
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Origin': 'https://mantrishop.in',
        'Referer': 'https://mantrishop.in/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cookie': 'JSESSIONID=9274776AD33FA41BA2435491A23B57D6; __cf_bm=bAmZhH4iTpK_U8aVB89IXxIOVpCtBsoHjjOCYchDheM-1755275179-1.0.1.1-3BDmcwVkZ6BtGszi.YYoTZroFJh7EX2.M47qCF7L3lp5fBy528uJH_3xzjZHy_VqATBF2d_l8Isox1.KtETC_TgAqj7zSMVQ35AUxNNtJqw; token=104F2DADC7ABEEC4770E3A0F5A18E459'
      }
    });

    // Log the response details
    console.log('Cloudflare Response Headers:', response.headers);
    console.log('Cloudflare Response Body:', response.data);

    // Send the response back to the client (browser or postman)
    res.json({
      status: 'success',
      responseHeaders: response.headers,
      responseBody: response.data
    });
  } catch (error) {
    console.error('Error making request:', error);

    // Handle errors and return the response to the client
    res.status(500).json({
      status: 'error',
      message: error.message,
      responseHeaders: error.response ? error.response.headers : null,
      responseBody: error.response ? error.response.data : null
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
