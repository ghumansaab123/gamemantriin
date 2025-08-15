const { exec } = require('child_process');

const mobile = '+918903200000';  // Replace with your mobile number
const password = 'your_password';  // Replace with the hashed password
const renderIp = 'your_render_ip';  // Replace with the Render server IP

// curl command with Render IP and login request
const curlCommand = `curl -v -X POST "https://mantrishop.in/lottery-backend/glserver/user/login?mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(password)}" \
-H "Content-Type: application/x-www-form-urlencoded" \
-H "Accept: */*" \
-H "Accept-Encoding: gzip, deflate, br" \
-H "Accept-Language: en-GB,en-US;q=0.9,en;q=0.8" \
-H "Origin: https://mantrishop.in" \
-H "Referer: https://mantrishop.in/" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36" \
-H "Cookie: JSESSIONID=9274776AD33FA41BA2435491A23B57D6; __cf_bm=bAmZhH4iTpK_U8aVB89IXxIOVpCtBsoHjjOCYchDheM-1755275179-1.0.1.1-3BDmcwVkZ6BtGszi.YYoTZroFJh7EX2.M47qCF7L3lp5fBy528uJH_3xzjZHy_VqATBF2d_l8Isox1.KtETC_TgAqj7zSMVQ35AUxNNtJqw; token=104F2DADC7ABEEC4770E3A0F5A18E459" \
-H "Sec-CH-UA: \\"Not;A=Brand\\";v=\\"99\\", \\"Google Chrome\\";v=\\"139\\", \\"Chromium\\";v=\\"139\\"" \
-H "Sec-CH-UA-Mobile: ?0" \
-H "Sec-CH-UA-Platform: \\"macOS\\"" \
-H "Sec-Fetch-Dest: empty" \
-H "Sec-Fetch-Mode: cors" \
-H "Sec-Fetch-Site: same-origin" \
--compressed --output response.txt`;

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  // Read and log the response file 'response.txt'
  require('fs').readFile('response.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading response.txt:', err);
      return;
    }
    console.log('Response from mantrishop:', data);
  });
});
