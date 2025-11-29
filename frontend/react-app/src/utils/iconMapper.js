/**
 * Icon Mapper - تحويل icon strings إلى Lucide React components
 */
import {
  Home, Wrench, Users, Warehouse, BarChart2, Settings, ChevronDown, ChevronRight,
  DollarSign, FileText, Package, UserCheck, Calendar, MessageSquare,
  TrendingUp, PieChart, Activity, Shield, Database, HelpCircle,
  Smartphone, Printer, Monitor, Cpu, HardDrive, Battery, Wifi,
  CreditCard, Receipt, Banknote, Calculator, Building2, MapPin, ShoppingCart,
  LogOut, User, Sun, Moon, Bell, Search, Plus, Clock, AlertCircle, CheckCircle, Zap
} from 'lucide-react';

const iconMap = {
  Home,
  Wrench,
  Users,
  Warehouse,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  Package,
  UserCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  PieChart,
  Activity,
  Shield,
  Database,
  HelpCircle,
  Smartphone,
  Printer,
  Monitor,
  Cpu,
  HardDrive,
  Battery,
  Wifi,
  CreditCard,
  Receipt,
  Banknote,
  Calculator,
  Building2,
  MapPin,
  ShoppingCart,
  LogOut,
  User: User,
  Sun,
  Moon,
  Bell,
  Search,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap
};

/**
 * Get icon component from string name
 * @param {string|React.Component} iconName - Icon name or component
 * @returns {React.Component} Icon component
 */
export const getIconComponent = (iconName) => {
  if (!iconName) return null;
  
  // If it's already a component, return it
  if (typeof iconName === 'function' || typeof iconName === 'object') {
    return iconName;
  }
  
  // If it's a string, look it up in the map
  if (typeof iconName === 'string') {
    return iconMap[iconName] || iconMap['HelpCircle']; // Default to HelpCircle if not found
  }
  
  return iconMap['HelpCircle'];
};

/**
 * Map navigation items and convert icon strings to components
 */
export const mapNavItems = (items) => {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(section => ({
    ...section,
    items: section.items?.map(item => ({
      ...item,
      icon: getIconComponent(item.icon),
      subItems: item.subItems?.map(subItem => ({
        ...subItem,
        icon: getIconComponent(subItem.icon)
      }))
    }))
  }));
};

