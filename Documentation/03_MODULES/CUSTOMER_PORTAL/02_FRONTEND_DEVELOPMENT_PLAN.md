# خطة تطوير Frontend - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي جميع تحسينات وتطويرات Frontend لبورتال العملاء، بما في ذلك المكونات الجديدة، تحسينات UX/UI، الأداء، والوظائف الجديدة.

## 2. البنية الحالية

### 2.1 الملفات الموجودة

```
frontend/react-app/src/
├── pages/customer/
│   ├── CustomerDashboard.js
│   ├── CustomerLoginPage.js
│   ├── CustomerProfilePage.js
│   ├── CustomerRepairsPage.js
│   ├── CustomerRepairDetailsPage.js
│   ├── CustomerInvoicesPage.js
│   ├── CustomerInvoiceDetailsPage.js
│   ├── CustomerDevicesPage.js
│   ├── CustomerNotificationsPage.js
│   └── CustomerSettingsPage.js
├── components/customer/
│   └── CustomerHeader.js
└── services/
    └── api.js
```

## 3. التحسينات المطلوبة

### 3.1 تحسينات البنية (Architecture)

#### 3.1.1 إنشاء Customer API Service منفصل

**الملف الجديد**: `frontend/react-app/src/services/customerApi.js`

```javascript
// Customer-specific API calls
class CustomerApiService {
  // Dashboard
  async getDashboardStats() { }
  async getRecentRepairs(limit = 5) { }
  async getRecentInvoices(limit = 5) { }
  
  // Repairs
  async getRepairs(params) { }
  async getRepairDetails(id) { }
  async addRepairComment(id, comment) { }
  async requestRepairUpdate(id) { }
  
  // Invoices
  async getInvoices(params) { }
  async getInvoiceDetails(id) { }
  async downloadInvoicePDF(id) { }
  async payInvoice(id, paymentData) { }
  
  // Devices
  async getDevices() { }
  async addDevice(deviceData) { }
  async updateDevice(id, deviceData) { }
  async deleteDevice(id) { }
  
  // Profile
  async getProfile() { }
  async updateProfile(data) { }
  async changePassword(oldPassword, newPassword) { }
  
  // Notifications
  async getNotifications(params) { }
  async markNotificationRead(id) { }
  async markAllNotificationsRead() { }
  async deleteNotification(id) { }
}
```

#### 3.1.2 إنشاء Customer Store (State Management)

**الملف الجديد**: `frontend/react-app/src/stores/customerStore.js`

```javascript
// Zustand store للبيانات الخاصة بالعميل
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useCustomerStore = create(
  persist(
    (set, get) => ({
      // Profile
      profile: null,
      setProfile: (profile) => set({ profile }),
      
      // Repairs
      repairs: [],
      setRepairs: (repairs) => set({ repairs }),
      
      // Invoices
      invoices: [],
      setInvoices: (invoices) => set({ invoices }),
      
      // Devices
      devices: [],
      setDevices: (devices) => set({ devices }),
      
      // Notifications
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      // Cache
      lastFetch: {},
      setLastFetch: (key, timestamp) => set((state) => ({
        lastFetch: { ...state.lastFetch, [key]: timestamp }
      })),
      
      // Clear all
      clearAll: () => set({
        profile: null,
        repairs: [],
        invoices: [],
        devices: [],
        notifications: [],
        unreadCount: 0,
        lastFetch: {}
      })
    }),
    {
      name: 'customer-store',
      partialize: (state) => ({
        profile: state.profile,
        devices: state.devices
      })
    }
  )
);
```

#### 3.1.3 إنشاء Custom Hooks

**المجلد الجديد**: `frontend/react-app/src/hooks/customer/`

```javascript
// hooks/customer/useCustomerRepairs.js
export function useCustomerRepairs() {
  // Fetch, cache, and manage repairs data
}

// hooks/customer/useCustomerInvoices.js
export function useCustomerInvoices() {
  // Fetch, cache, and manage invoices data
}

// hooks/customer/useCustomerDevices.js
export function useCustomerDevices() {
  // Fetch, cache, and manage devices data
}

// hooks/customer/useCustomerNotifications.js
export function useCustomerNotifications() {
  // Real-time notifications with WebSocket
}

// hooks/customer/useCustomerProfile.js
export function useCustomerProfile() {
  // Profile management
}
```

### 3.2 تحسينات المكونات (Components)

#### 3.2.1 مكونات جديدة

**المجلد**: `frontend/react-app/src/components/customer/`

##### 1. EnhancedStatsCard.js
```javascript
// بطاقة إحصائيات محسنة مع Charts
- Total Repairs
- Active Repairs
- Completed Repairs
- Total Spent
- Charts (Line, Bar)
```

##### 2. RepairStatusTimeline.js
```javascript
// Timeline لتتبع حالة طلب الإصلاح
- Status changes
- Technician updates
- Estimated completion
- Visual timeline
```

##### 3. InvoicePaymentCard.js
```javascript
// بطاقة الدفع للفواتير
- Payment methods
- Payment gateway integration
- Payment history
```

##### 4. DeviceCard.js
```javascript
// بطاقة الجهاز
- Device info
- Repair history
- Quick actions
```

##### 5. NotificationBell.js
```javascript
// زر الإشعارات مع Badge
- Unread count
- Dropdown menu
- Real-time updates
```

##### 6. CustomerSidebar.js
```javascript
// Sidebar navigation
- Menu items
- Active state
- Collapsible
```

##### 7. CustomerFooter.js
```javascript
// Footer للبورتال
- Contact info
- Links
- Social media
```

##### 8. SearchBar.js
```javascript
// شريط البحث
- Search repairs
- Search invoices
- Search devices
- Autocomplete
```

##### 9. FilterPanel.js
```javascript
// لوحة التصفية
- Date range
- Status filters
- Sort options
```

##### 10. Pagination.js
```javascript
// Pagination component
- Page numbers
- Items per page
- Total count
```

#### 3.2.2 تحسين المكونات الموجودة

##### CustomerDashboard.js
**التحسينات:**
- [ ] إضافة Charts للإحصائيات
- [ ] إضافة Quick Actions
- [ ] تحسين Loading States
- [ ] إضافة Error Boundaries
- [ ] إضافة Empty States
- [ ] تحسين Responsive Design
- [ ] إضافة Skeleton Loading

##### CustomerRepairsPage.js
**التحسينات:**
- [ ] إضافة Advanced Filtering
- [ ] إضافة Sorting
- [ ] إضافة Search
- [ ] تحسين Card Design
- [ ] إضافة Bulk Actions
- [ ] إضافة Export to PDF/Excel
- [ ] تحسين Pagination

##### CustomerRepairDetailsPage.js
**التحسينات:**
- [ ] إضافة Timeline
- [ ] إضافة Comments Section
- [ ] إضافة File Attachments
- [ ] إضافة Real-time Updates
- [ ] إضافة Print View
- [ ] إضافة Share Functionality

##### CustomerInvoicesPage.js
**التحسينات:**
- [ ] إضافة Payment Integration
- [ ] إضافة Payment History
- [ ] تحسين Invoice Card
- [ ] إضافة Download PDF
- [ ] إضافة Email Invoice
- [ ] إضافة Payment Reminders

### 3.3 تحسينات UX/UI

#### 3.3.1 Design System

**إنشاء**: `frontend/react-app/src/theme/customerTheme.js`

```javascript
// Customer Portal Theme
export const customerTheme = {
  colors: {
    primary: '#10b981', // Green
    secondary: '#3b82f6', // Blue
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: 'Cairo, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
};
```

#### 3.3.2 Dark Mode Support

**إنشاء**: `frontend/react-app/src/contexts/ThemeContext.js`

```javascript
// Theme Context for Dark Mode
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

#### 3.3.3 Multi-language Support

**إنشاء**: `frontend/react-app/src/i18n/customer/`

```javascript
// i18n/customer/ar.json
{
  "dashboard": {
    "title": "لوحة التحكم",
    "welcome": "مرحباً"
  },
  "repairs": {
    "title": "طلبات الإصلاح",
    "status": "الحالة"
  }
}

// i18n/customer/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome"
  },
  "repairs": {
    "title": "Repairs",
    "status": "Status"
  }
}
```

#### 3.3.4 Responsive Design Improvements

**التحسينات:**
- [ ] Mobile-first Approach
- [ ] Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- [ ] Touch-friendly Buttons (min 44x44px)
- [ ] Swipe Gestures
- [ ] Collapsible Sidebar on Mobile
- [ ] Bottom Navigation on Mobile
- [ ] Optimized Images (WebP, Lazy Loading)

#### 3.3.5 Accessibility (A11y)

**التحسينات:**
- [ ] ARIA Labels
- [ ] Keyboard Navigation
- [ ] Focus Management
- [ ] Screen Reader Support
- [ ] Color Contrast (WCAG AA)
- [ ] Alt Text for Images
- [ ] Skip Links

### 3.4 تحسينات الأداء (Performance)

#### 3.4.1 Code Splitting

```javascript
// Lazy Loading للصفحات
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerRepairsPage = lazy(() => import('./pages/customer/CustomerRepairsPage'));
const CustomerInvoicesPage = lazy(() => import('./pages/customer/CustomerInvoicesPage'));
```

#### 3.4.2 Image Optimization

```javascript
// استخدام Next.js Image أو React Lazy Image
import { LazyImage } from 'react-lazy-images';

<LazyImage
  src={imageUrl}
  placeholder={({ imageProps, ref }) => (
    <div ref={ref} className="placeholder" />
  )}
  actual={({ imageProps }) => <img {...imageProps} />}
/>
```

#### 3.4.3 Caching Strategy

```javascript
// Service Worker للـ Caching
// Cache API responses
// Cache static assets
// Offline support
```

#### 3.4.4 Memoization

```javascript
// استخدام React.memo, useMemo, useCallback
const MemoizedComponent = React.memo(Component);
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b]);
```

#### 3.4.5 Virtual Scrolling

```javascript
// للقوائم الطويلة
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

### 3.5 ميزات جديدة

#### 3.5.1 Real-time Updates

**الملف**: `frontend/react-app/src/services/websocketService.js`

```javascript
// WebSocket connection للـ Real-time updates
class WebSocketService {
  connect() {
    this.ws = new WebSocket(WS_URL);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  handleMessage(data) {
    switch(data.type) {
      case 'repair_updated':
        // Update repair status
        break;
      case 'invoice_created':
        // Show notification
        break;
      case 'notification':
        // Add notification
        break;
    }
  }
}
```

#### 3.5.2 Offline Support

**الملف**: `frontend/react-app/src/services/offlineService.js`

```javascript
// Service Worker + IndexedDB
// Cache API responses
// Queue requests when offline
// Sync when online
```

#### 3.5.3 Push Notifications

**الملف**: `frontend/react-app/src/services/pushNotificationService.js`

```javascript
// Web Push API
// Request permission
// Subscribe to push service
// Handle notifications
```

#### 3.5.4 File Upload

**الملف**: `frontend/react-app/src/components/customer/FileUpload.js`

```javascript
// Upload images/files
// Progress indicator
// Preview
// Drag & drop
```

#### 3.5.5 Print Functionality

**الملف**: `frontend/react-app/src/utils/print.js`

```javascript
// Print repair details
// Print invoice
// Print device info
```

### 3.6 Testing

#### 3.6.1 Unit Tests

**المجلد**: `frontend/react-app/src/__tests__/customer/`

```javascript
// CustomerDashboard.test.js
// CustomerRepairsPage.test.js
// CustomerApiService.test.js
// useCustomerRepairs.test.js
```

#### 3.6.2 Integration Tests

```javascript
// Customer flow tests
// API integration tests
```

#### 3.6.3 E2E Tests

```javascript
// Playwright/Cypress tests
// User journey tests
```

### 3.7 خطة التنفيذ

#### Phase 1: Core Improvements (Week 1-2)
1. إنشاء Customer API Service
2. إنشاء Customer Store
3. إنشاء Custom Hooks
4. تحسين المكونات الموجودة

#### Phase 2: New Components (Week 3-4)
1. إنشاء المكونات الجديدة
2. تحسين UX/UI
3. إضافة Dark Mode
4. إضافة Multi-language

#### Phase 3: Advanced Features (Week 5-6)
1. Real-time Updates
2. Offline Support
3. Push Notifications
4. File Upload

#### Phase 4: Testing & Optimization (Week 7-8)
1. Unit Tests
2. Integration Tests
3. E2E Tests
4. Performance Optimization

## 4. Checklist

### 4.1 Architecture
- [ ] Customer API Service
- [ ] Customer Store
- [ ] Custom Hooks
- [ ] Error Boundaries
- [ ] Loading States
- [ ] Empty States

### 4.2 Components
- [ ] Enhanced Stats Card
- [ ] Repair Status Timeline
- [ ] Invoice Payment Card
- [ ] Device Card
- [ ] Notification Bell
- [ ] Customer Sidebar
- [ ] Search Bar
- [ ] Filter Panel
- [ ] Pagination

### 4.3 UX/UI
- [ ] Design System
- [ ] Dark Mode
- [ ] Multi-language
- [ ] Responsive Design
- [ ] Accessibility

### 4.4 Performance
- [ ] Code Splitting
- [ ] Image Optimization
- [ ] Caching
- [ ] Memoization
- [ ] Virtual Scrolling

### 4.5 Features
- [ ] Real-time Updates
- [ ] Offline Support
- [ ] Push Notifications
- [ ] File Upload
- [ ] Print Functionality

### 4.6 Testing
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests

---

**الملف التالي**: [خطة تطوير Backend](./03_BACKEND_DEVELOPMENT_PLAN.md)


