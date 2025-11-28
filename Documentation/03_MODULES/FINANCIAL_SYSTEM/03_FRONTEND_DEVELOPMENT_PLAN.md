# خطة تطوير Frontend - نظام المالية
## Financial System - Frontend Development Plan

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - خطة تطوير شاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [الهيكل المقترح](#1-الهيكل-المقترح)
2. [Pages Structure](#2-pages-structure)
3. [Components Structure](#3-components-structure)
4. [State Management](#4-state-management)
5. [Services و API Integration](#5-services-و-api-integration)
6. [Forms و Validation](#6-forms-و-validation)
7. [UI/UX Improvements](#7-uiux-improvements)
8. [Real-time Updates](#8-real-time-updates)
9. [Performance Optimization](#9-performance-optimization)

---

## 1. الهيكل المقترح

### 1.1 الهيكل الحالي

```
frontend/react-app/src/
├── pages/
│   ├── expenses/
│   │   ├── ExpensesPage.js (32175 سطر) ⚠️ كبير جداً
│   │   └── ExpenseForm.js (16888 سطر) ⚠️ كبير جداً
│   ├── payments/
│   │   ├── CreatePaymentPage.js
│   │   ├── EditPaymentPage.js
│   │   └── PaymentDetailsPage.js
│   └── invoices/
│       ├── InvoicesPage.js
│       ├── InvoicesPageNew.js ⚠️ مكرر
│       ├── CreateInvoicePage.js (37209 سطر) ⚠️ كبير جداً
│       └── InvoiceDetailsPage.js
└── services/
    ├── paymentService.js
    └── paymentsService.js ⚠️ مكرر
```

### 1.2 الهيكل المقترح

```
frontend/react-app/src/
├── pages/
│   └── financial/
│       ├── expenses/
│       │   ├── ExpensesListPage.js
│       │   ├── ExpenseCreatePage.js
│       │   ├── ExpenseEditPage.js
│       │   └── ExpenseDetailsPage.js
│       ├── payments/
│       │   ├── PaymentsListPage.js
│       │   ├── PaymentCreatePage.js
│       │   ├── PaymentEditPage.js
│       │   ├── PaymentDetailsPage.js
│       │   └── OverduePaymentsPage.js
│       ├── invoices/
│       │   ├── InvoicesListPage.js
│       │   ├── InvoiceCreatePage.js
│       │   ├── InvoiceEditPage.js
│       │   ├── InvoiceDetailsPage.js
│       │   └── InvoiceTemplatesPage.js
│       └── reports/
│           ├── FinancialDashboardPage.js
│           ├── ExpensesReportPage.js
│           ├── PaymentsReportPage.js
│           └── InvoicesReportPage.js
├── components/
│   └── financial/
│       ├── expenses/
│       │   ├── ExpenseForm.js
│       │   ├── ExpenseList.js
│       │   ├── ExpenseCard.js
│       │   └── ExpenseFilters.js
│       ├── payments/
│       │   ├── PaymentForm.js
│       │   ├── PaymentList.js
│       │   ├── PaymentCard.js
│       │   └── PaymentStatusBadge.js
│       ├── invoices/
│       │   ├── InvoiceForm.js
│       │   ├── InvoiceItemsForm.js
│       │   ├── InvoiceList.js
│       │   ├── InvoiceCard.js
│       │   ├── InvoicePDFViewer.js
│       │   └── InvoiceStatusBadge.js
│       └── shared/
│           ├── FinancialSummaryCard.js
│           ├── FinancialChart.js
│           └── FinancialFilters.js
├── services/
│   └── financial/
│       ├── expensesService.js
│       ├── paymentsService.js
│       ├── invoicesService.js
│       └── financialReportsService.js
├── hooks/
│   └── financial/
│       ├── useExpenses.js
│       ├── usePayments.js
│       ├── useInvoices.js
│       └── useFinancialStats.js
├── store/
│   └── financial/
│       ├── expensesSlice.js
│       ├── paymentsSlice.js
│       └── invoicesSlice.js
└── utils/
    └── financial/
        ├── formatters.js
        ├── validators.js
        └── calculations.js
```

---

## 2. Pages Structure

### 2.1 Expenses Pages

#### 2.1.1 ExpensesListPage

```javascript
// frontend/react-app/src/pages/financial/expenses/ExpensesListPage.js
import React, { useState, useEffect } from 'react';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import ExpenseList from '../../../components/financial/expenses/ExpenseList';
import ExpenseFilters from '../../../components/financial/expenses/ExpenseFilters';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ExpensesListPage = () => {
  const navigate = useNavigate();
  const { expenses, loading, error, filters, setFilters, refetch } = useExpenses();
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  const handleCreate = () => {
    navigate('/financial/expenses/create');
  };

  const handleBulkDelete = async () => {
    // Bulk delete logic
  };

  return (
    <div className="expenses-list-page">
      <div className="page-header">
        <h1>النفقات</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          إضافة نفقة جديدة
        </Button>
      </div>

      <FinancialSummaryCard
        title="ملخص النفقات"
        data={expenses?.summary}
        loading={loading}
      />

      <ExpenseFilters
        filters={filters}
        onChange={setFilters}
      />

      <ExpenseList
        expenses={expenses?.data || []}
        loading={loading}
        error={error}
        selectedItems={selectedExpenses}
        onSelect={setSelectedExpenses}
        onRefresh={refetch}
      />

      {selectedExpenses.length > 0 && (
        <div className="bulk-actions">
          <Button
            variant="outlined"
            color="error"
            onClick={handleBulkDelete}
          >
            حذف المحدد ({selectedExpenses.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpensesListPage;
```

#### 2.1.2 ExpenseCreatePage

```javascript
// frontend/react-app/src/pages/financial/expenses/ExpenseCreatePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '../../../components/financial/expenses/ExpenseForm';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import { toast } from 'react-toastify';

const ExpenseCreatePage = () => {
  const navigate = useNavigate();
  const { createExpense, loading } = useExpenses();

  const handleSubmit = async (data) => {
    try {
      const result = await createExpense(data);
      toast.success('تم إنشاء النفقة بنجاح');
      navigate(`/financial/expenses/${result.id}`);
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء النفقة');
    }
  };

  return (
    <div className="expense-create-page">
      <h1>إضافة نفقة جديدة</h1>
      <ExpenseForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default ExpenseCreatePage;
```

### 2.2 Payments Pages

#### 2.2.1 PaymentsListPage

```javascript
// frontend/react-app/src/pages/financial/payments/PaymentsListPage.js
import React, { useState } from 'react';
import { usePayments } from '../../../hooks/financial/usePayments';
import PaymentList from '../../../components/financial/payments/PaymentList';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';

const PaymentsListPage = () => {
  const { payments, loading, error, filters, setFilters } = usePayments();

  return (
    <div className="payments-list-page">
      <div className="page-header">
        <h1>المدفوعات</h1>
      </div>

      <FinancialSummaryCard
        title="ملخص المدفوعات"
        data={payments?.summary}
        loading={loading}
      />

      <PaymentList
        payments={payments?.data || []}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default PaymentsListPage;
```

### 2.3 Invoices Pages

#### 2.3.1 InvoicesListPage

```javascript
// frontend/react-app/src/pages/financial/invoices/InvoicesListPage.js
import React, { useState } from 'react';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import InvoiceList from '../../../components/financial/invoices/InvoiceList';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';
import FinancialChart from '../../../components/financial/shared/FinancialChart';

const InvoicesListPage = () => {
  const { invoices, loading, error, filters, setFilters, stats } = useInvoices();

  return (
    <div className="invoices-list-page">
      <div className="page-header">
        <h1>الفواتير</h1>
      </div>

      <FinancialSummaryCard
        title="ملخص الفواتير"
        data={invoices?.summary}
        loading={loading}
      />

      <FinancialChart
        data={stats?.chartData}
        type="line"
        title="إيرادات الفواتير"
      />

      <InvoiceList
        invoices={invoices?.data || []}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default InvoicesListPage;
```

#### 2.3.2 InvoiceDetailsPage

```javascript
// frontend/react-app/src/pages/financial/invoices/InvoiceDetailsPage.js
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import InvoicePDFViewer from '../../../components/financial/invoices/InvoicePDFViewer';
import PaymentList from '../../../components/financial/payments/PaymentList';
import { Button } from '@mui/material';
import { Print as PrintIcon, Send as SendIcon } from '@mui/icons-material';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoice, loading, error, generatePDF, sendInvoice } = useInvoices();

  useEffect(() => {
    // Fetch invoice details
  }, [id]);

  const handlePrint = async () => {
    const pdf = await generatePDF(id);
    // Open PDF in new window
  };

  const handleSend = async () => {
    await sendInvoice(id);
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error}</div>;

  return (
    <div className="invoice-details-page">
      <div className="page-header">
        <h1>فاتورة #{invoice?.invoiceNumber}</h1>
        <div className="actions">
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            طباعة
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
          >
            إرسال
          </Button>
        </div>
      </div>

      <div className="invoice-content">
        <InvoicePDFViewer invoice={invoice} />
        
        <div className="payments-section">
          <h2>المدفوعات</h2>
          <PaymentList payments={invoice?.payments || []} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
```

---

## 3. Components Structure

### 3.1 ExpenseForm Component

```javascript
// frontend/react-app/src/components/financial/expenses/ExpenseForm.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Grid,
  FormControl,
  InputLabel
} from '@mui/material';

const expenseSchema = yup.object({
  categoryId: yup.number().required('التصنيف مطلوب'),
  amount: yup.number().positive('المبلغ يجب أن يكون موجب').required('المبلغ مطلوب'),
  description: yup.string().required('الوصف مطلوب'),
  date: yup.date().required('التاريخ مطلوب'),
  branchId: yup.number().optional()
});

const ExpenseForm = ({ onSubmit, loading, initialData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(expenseSchema),
    defaultValues: initialData
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>التصنيف</InputLabel>
            <Select
              {...register('categoryId')}
              error={!!errors.categoryId}
            >
              {/* Categories options */}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="المبلغ"
            type="number"
            {...register('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="الوصف"
            multiline
            rows={4}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="التاريخ"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register('date')}
            error={!!errors.date}
            helperText={errors.date?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default ExpenseForm;
```

### 3.2 InvoiceItemsForm Component

```javascript
// frontend/react-app/src/components/financial/invoices/InvoiceItemsForm.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const InvoiceItemsForm = ({ items, onChange }) => {
  const [localItems, setLocalItems] = useState(items || []);

  const handleAddItem = () => {
    const newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onChange(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    onChange(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = localItems.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          newItem.totalPrice = newItem.quantity * newItem.unitPrice;
        }
        return newItem;
      }
      return item;
    });
    setLocalItems(updated);
    onChange(updated);
  };

  const calculateTotal = () => {
    return localItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  return (
    <div className="invoice-items-form">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>الوصف</TableCell>
            <TableCell>الكمية</TableCell>
            <TableCell>سعر الوحدة</TableCell>
            <TableCell>الإجمالي</TableCell>
            <TableCell>إجراءات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {localItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <TextField
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                />
              </TableCell>
              <TableCell>{item.totalPrice}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleRemoveItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddItem}
        variant="outlined"
      >
        إضافة عنصر
      </Button>

      <div className="total">
        <strong>الإجمالي: {calculateTotal()}</strong>
      </div>
    </div>
  );
};

export default InvoiceItemsForm;
```

---

## 4. State Management

### 4.1 Redux Store Structure

```javascript
// frontend/react-app/src/store/financial/expensesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import expensesService from '../../services/financial/expensesService';

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (filters) => {
    return await expensesService.getAll(filters);
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (data) => {
    return await expensesService.create(data);
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    items: [],
    loading: false,
    error: null,
    filters: {},
    pagination: {}
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { setFilters } = expensesSlice.actions;
export default expensesSlice.reducer;
```

### 4.2 Custom Hooks

```javascript
// frontend/react-app/src/hooks/financial/useExpenses.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses, createExpense, setFilters } from '../../store/financial/expensesSlice';

export const useExpenses = () => {
  const dispatch = useDispatch();
  const { items, loading, error, filters, pagination } = useSelector(
    (state) => state.expenses
  );

  useEffect(() => {
    dispatch(fetchExpenses(filters));
  }, [dispatch, filters]);

  const handleCreate = async (data) => {
    return await dispatch(createExpense(data)).unwrap();
  };

  const handleFiltersChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const refetch = () => {
    dispatch(fetchExpenses(filters));
  };

  return {
    expenses: { data: items, pagination },
    loading,
    error,
    filters,
    setFilters: handleFiltersChange,
    createExpense: handleCreate,
    refetch
  };
};
```

---

## 5. Services و API Integration

### 5.1 Expenses Service

```javascript
// frontend/react-app/src/services/financial/expensesService.js
import apiService from '../apiService';

const expensesService = {
  async getAll(filters = {}) {
    return await apiService.get('/api/expenses', { params: filters });
  },

  async getById(id) {
    return await apiService.get(`/api/expenses/${id}`);
  },

  async create(data) {
    return await apiService.post('/api/expenses', data);
  },

  async update(id, data) {
    return await apiService.put(`/api/expenses/${id}`, data);
  },

  async delete(id) {
    return await apiService.delete(`/api/expenses/${id}`);
  },

  async getStats(filters = {}) {
    return await apiService.get('/api/expenses/stats', { params: filters });
  },

  async exportToExcel(filters = {}) {
    return await apiService.get('/api/expenses/export/excel', {
      params: filters,
      responseType: 'blob'
    });
  }
};

export default expensesService;
```

---

## 6. Forms و Validation

### 6.1 Validation Schemas

```javascript
// frontend/react-app/src/utils/financial/validators.js
import * as yup from 'yup';

export const expenseSchema = yup.object({
  categoryId: yup.number().required('التصنيف مطلوب'),
  amount: yup.number().positive('المبلغ يجب أن يكون موجب').required('المبلغ مطلوب'),
  description: yup.string().required('الوصف مطلوب'),
  date: yup.date().required('التاريخ مطلوب')
});

export const paymentSchema = yup.object({
  invoiceId: yup.number().required('الفاتورة مطلوبة'),
  amount: yup.number().positive('المبلغ يجب أن يكون موجب').required('المبلغ مطلوب'),
  paymentMethod: yup.string().required('طريقة الدفع مطلوبة'),
  paymentDate: yup.date().required('تاريخ الدفع مطلوب')
});

export const invoiceSchema = yup.object({
  customerId: yup.number().optional(),
  repairRequestId: yup.number().optional(),
  items: yup.array().min(1, 'يجب إضافة عنصر واحد على الأقل').required(),
  dueDate: yup.date().optional(),
  notes: yup.string().optional()
});
```

---

## 7. UI/UX Improvements

### 7.1 Loading States

- Skeleton Loaders
- Progress Indicators
- Optimistic Updates

### 7.2 Error Handling

- Error Boundaries
- Toast Notifications
- Retry Mechanisms

### 7.3 Responsive Design

- Mobile-First Approach
- Breakpoints Optimization
- Touch-Friendly Controls

---

## 8. Real-time Updates

### 8.1 WebSocket Integration

```javascript
// frontend/react-app/src/hooks/financial/useFinancialWebSocket.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { fetchExpenses } from '../../store/financial/expensesSlice';

export const useFinancialWebSocket = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_WS_URL);

    socket.on('financial:expense_created', () => {
      dispatch(fetchExpenses());
    });

    socket.on('financial:payment_created', () => {
      // Refresh payments
    });

    socket.on('financial:invoice_created', () => {
      // Refresh invoices
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);
};
```

---

## 9. Performance Optimization

### 9.1 Code Splitting

```javascript
// Lazy loading for pages
const ExpensesListPage = React.lazy(() => import('./pages/financial/expenses/ExpensesListPage'));
const PaymentsListPage = React.lazy(() => import('./pages/financial/payments/PaymentsListPage'));
```

### 9.2 Memoization

```javascript
import { memo, useMemo } from 'react';

const ExpenseCard = memo(({ expense }) => {
  const formattedAmount = useMemo(() => {
    return formatCurrency(expense.amount);
  }, [expense.amount]);

  return <div>{formattedAmount}</div>;
});
```

### 9.3 Virtual Scrolling

- استخدام react-window أو react-virtualized للقوائم الطويلة

---

## 📚 المراجع

- [الوضع الحالي](./01_OVERVIEW_AND_CURRENT_STATE.md)
- [خطة Backend](./02_BACKEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

