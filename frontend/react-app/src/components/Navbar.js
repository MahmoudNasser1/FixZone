import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold">
          Fix Zone ERP
        </div>
        <div className="flex space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
          <Link to="/repairs" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Repair Requests</Link>
          <Link to="/customers" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Customers</Link>
          <Link to="/inventory" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Inventory</Link>
          <Link to="/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Settings</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
