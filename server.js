const axios = require('axios');

async function getPublicIp() {
  try {
    // Fetch the public IP of the Render server using a service like 'ifconfig.me'
    const response = await axios.get('https://ifconfig.me');
    
    console.log('Render Server IP Address:', response.data);
  } catch (error) {
    console.error('Error fetching IP address:', error);
  }
}

// Call the function to fetch the IP address
getPublicIp();
