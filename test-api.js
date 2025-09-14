const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/payments',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Not valid JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

console.log('Testing payments API...');
testAPI();

