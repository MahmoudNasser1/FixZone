#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testUsersAPI() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      loginIdentifier: 'admin@fixzone.com',
      password: 'admin123'
    });
    
    console.log('✅ تم تسجيل الدخول:', loginResponse.data);
    console.log('🍪 Cookies:', loginResponse.headers['set-cookie']);
    
    // استخراج cookies
    const cookies = loginResponse.headers['set-cookie']?.find(cookie => cookie.startsWith('token='));
    console.log('🔑 Token cookie:', cookies);
    
    if (cookies) {
      console.log('\n📡 اختبار API المستخدمين...');
      const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
        headers: { Cookie: cookies }
      });
      
      console.log('✅ تم جلب المستخدمين:', usersResponse.data.length, 'مستخدم');
      console.log('📊 البيانات:', usersResponse.data);
      
      console.log('\n📡 اختبار API الأدوار...');
      const rolesResponse = await axios.get(`${BASE_URL}/api/roles`, {
        headers: { Cookie: cookies }
      });
      
      console.log('✅ تم جلب الأدوار:', rolesResponse.data.length, 'دور');
      console.log('📊 البيانات:', rolesResponse.data);
      
    } else {
      console.log('❌ لم يتم الحصول على cookies');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.response?.data || error.message);
  }
}

testUsersAPI();

