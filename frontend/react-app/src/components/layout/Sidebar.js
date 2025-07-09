import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Users, Warehouse, BarChart2, Settings, ChevronDown } from 'lucide-react';
import useUIStore from '../../stores/uiStore';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/repairs', label: 'Repairs', icon: Wrench },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  {
    label: 'Reports',
    icon: BarChart2,
    subItems: [
      { href: '/reports/sales', label: 'Sales Report' },
      { href: '/reports/inventory', label: 'Inventory Report' },
    ]
  },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();
  const { isSidebarOpen } = useUIStore();
  const [openMenu, setOpenMenu] = useState(null);

  const handleMenuToggle = (label) => {
    if (!isSidebarOpen) return;
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <aside
      className={`flex-shrink-0 bg-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700 relative">
        {isSidebarOpen && <span>FixZone</span>}
      </div>
      <nav className="flex-grow px-2 py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => handleMenuToggle(item.label)}
                    className={`w-full flex items-center justify-between py-2 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 ${
                      isSidebarOpen ? 'px-4' : 'justify-center px-2'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`w-6 h-6 ${isSidebarOpen ? 'mr-3' : ''}`} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </div>
                    {isSidebarOpen && (
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          openMenu === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {isSidebarOpen && openMenu === item.label && (
                    <ul className="pl-8 pt-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            to={subItem.href}
                            className={`flex items-center py-2 px-2 my-1 rounded-md text-sm transition-colors duration-200 hover:bg-gray-700 ${
                              location.pathname === subItem.href ? 'bg-blue-600' : ''
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`flex items-center py-2 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 ${
                    isSidebarOpen ? 'px-4' : 'justify-center px-2'
                  } ${
                    location.pathname === item.href ? 'bg-blue-600' : ''
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isSidebarOpen ? 'mr-3' : ''}`} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        {/* User profile section can go here */}
      </div>
    </aside>
  );
};

export default Sidebar;
