import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';

const TestPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching customers...');
      const data = await apiService.getCustomers();
      console.log('Customers received:', data);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">اختبار العملاء</h1>
      <p className="mb-4">عدد العملاء: {customers.length}</p>
      
      <div className="space-y-4">
        {customers.map((customer) => (
          <div key={customer.id} className="p-4 border rounded hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{customer.name}</h3>
                <p className="text-gray-600">الهاتف: {customer.phone}</p>
                <p className="text-gray-600">البريد: {customer.email}</p>
                <p className="text-gray-600">العنوان: {customer.address}</p>
              </div>
              <Link 
                to={`/customers/${customer.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                عرض التفاصيل
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPage;
