const express = require('express');
const { exec } = require('child_process');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;  // Use environment port or default to 3000

// Middleware to parse JSON requests (if any)
app.use(express.json());

// Route to trigger the curl command
app.get('/trigger-curl', (req, res) => {
  // Corrected curl command with properly escaped special characters
  const curlCommand = `curl -X POST "https://mantrishop.in/lottery-backend/glserver/user/login?mobile=%2B918847460027&password=c4ca4238a0b923820dcc509a6f75849b" \
-H "Content-Type: application/x-www-form-urlencoded" \
-H "Origin: https://mantrishop.in" \
-H "Referer: https://mantrishop.in/" \
-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" \
-H "Accept: */*" \
-H "Cookie: __cf_bm=VlFHOF1LIuAq8DIQ4JQSfCnSqwtrKSckuN_METOQ.KY-1755243437-1.0.1.1-WevhWpWpSiBTC1xrpmnvep5R.pHElh8wXucu72vBZhbmHkH7jwJavRspoQXJwYI86f6Nr_9WzjH8H1BZKif1qiwcWPw6KBzbYAOx.b42.d8" \
-H "Sec-Ch-Ua-Platform: \\"macOS\\"" \
-H "Sec-Ch-Ua: \\"Chromium\\";v=\\"137\\", \\"Not/A\\)Brand\\";v=\\"24\\"" \
-H "Sec-Ch-Ua-Mobile: ?0" \
-H "Sec-Fetch-Site: same-origin" \
-H "Sec-Fetch-Mode: cors" \
-H "Sec-Fetch-Dest: empty" \
-H "Accept-Encoding: gzip, deflate, br" \
--compressed --output response.txt`;

  // Execute the curl command
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: `exec error: ${error}` });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: `stderr: ${stderr}` });
    }

    // Log the stdout (response of the curl command)
    console.log(`stdout: ${stdout}`);
    return res.send({ message: 'Curl command executed successfully', stdout });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
