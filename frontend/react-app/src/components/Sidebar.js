import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, Warehouse, Settings, Moon, Sun, Pilcrow, LogOut } from 'lucide-react';
import { useTheme } from "./ThemeProvider";
import useAuthStore from "../stores/authStore";
import { Button } from './ui/Button';

const Sidebar = () => {
  const { theme, setTheme, dir, setDir } = useTheme();
  const logout = useAuthStore((state) => state.logout);

  const navLinks = [
    { to: '/', text: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/repairs', text: 'Repair Tickets', icon: <Wrench size={20} /> },
    { to: '/customers', text: 'Customers (CRM)', icon: <Users size={20} /> },
    { to: '/inventory', text: 'Inventory', icon: <Warehouse size={20} /> },
    { to: '/settings', text: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen p-4 flex flex-col">
      <div className="text-2xl font-bold mb-10">FixZone ERP</div>
      <nav>
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className="mb-2">
              <Link
                to={link.to}
                className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                {link.icon}
                <span className="ml-3">{link.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDir(dir === 'rtl' ? 'ltr' : 'rtl')}>
            <Pilcrow className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Toggle Direction</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} className="rtl:mr-auto ltr:ml-auto">
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
