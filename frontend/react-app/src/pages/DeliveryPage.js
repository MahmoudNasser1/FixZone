import React from 'react';

const DeliveryPage = () => {
  React.useEffect(() => {
    // Redirect to the HTML page
    window.location.href = '/pages/delivery.html';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل نظام التسليم...</p>
      </div>
    </div>
  );
};

export default DeliveryPage;