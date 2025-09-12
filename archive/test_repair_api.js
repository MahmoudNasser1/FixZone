const fetch = require('node-fetch');

async function testCreateRepair() {
  try {
    const repairData = {
      customerName: 'أحمد تست',
      customerPhone: '01012345678',
      customerEmail: 'test@test.com',
      deviceType: 'لابتوب',
      deviceBrand: 'Dell',
      deviceModel: 'Test Model',
      problemDescription: 'مشكلة تجريبية للاختبار',
      priority: 'medium'
    };

    console.log('Sending data:', JSON.stringify(repairData, null, 2));

    const response = await fetch('http://localhost:3000/api/repairs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(repairData)
    });

    console.log('Response status:', response.status);
    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ Success! Repair created successfully');
    } else {
      console.log('❌ Error creating repair');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testCreateRepair();
