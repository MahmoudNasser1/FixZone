/**
 * 🧪 اختبارات موديول المدفوعات - الواجهة الأمامية
 * 
 * اختبارات شاملة لمكونات المدفوعات في React
 * يشمل: اختبارات الوحدة، التكامل، والأداء
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock components
import PaymentsPage from '../pages/payments/PaymentsPage';
import CreatePaymentPage from '../pages/payments/CreatePaymentPage';
import PaymentDetailsPage from '../pages/payments/PaymentDetailsPage';
import PaymentForm from '../components/payments/PaymentForm';
import PaymentCard from '../components/payments/PaymentCard';
import PaymentStats from '../components/payments/PaymentStats';

// Mock data
const mockPayments = [
  {
    id: 1,
    amount: 1000,
    paymentMethod: 'cash',
    paymentDate: '2024-12-20',
    status: 'completed',
    invoiceId: 1,
    customerFirstName: 'أحمد',
    customerLastName: 'محمد',
    customerPhone: '01234567890',
    notes: 'مدفوعة نقدية'
  },
  {
    id: 2,
    amount: 2000,
    paymentMethod: 'card',
    paymentDate: '2024-12-19',
    status: 'pending',
    invoiceId: 2,
    customerFirstName: 'فاطمة',
    customerLastName: 'علي',
    customerPhone: '01234567891',
    notes: 'مدفوعة بالبطاقة'
  }
];

const mockInvoices = [
  {
    id: 1,
    totalAmount: 5000,
    status: 'pending',
    customerFirstName: 'أحمد',
    customerLastName: 'محمد'
  },
  {
    id: 2,
    totalAmount: 3000,
    status: 'pending',
    customerFirstName: 'فاطمة',
    customerLastName: 'علي'
  }
];

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('🧪 اختبارات موديول المدفوعات', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('📄 اختبارات الصفحة الرئيسية للمدفوعات', () => {
    
    test('يجب أن تعرض الصفحة الرئيسية للمدفوعات', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        }
      });

      renderWithRouter(<PaymentsPage />);

      // انتظار تحميل البيانات
      await waitFor(() => {
        expect(screen.getByText('إدارة المدفوعات')).toBeInTheDocument();
      });

      // التحقق من وجود عناصر الصفحة
      expect(screen.getByText('إضافة مدفوعة جديدة')).toBeInTheDocument();
      expect(screen.getByText('البحث والفلترة')).toBeInTheDocument();
    });

    test('يجب أن تعرض قائمة المدفوعات', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
      });
    });

    test('يجب أن تعرض رسالة عند عدم وجود مدفوعات', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('لا توجد مدفوعات')).toBeInTheDocument();
      });
    });
  });

  describe('➕ اختبارات إنشاء مدفوعة جديدة', () => {
    
    test('يجب أن تعرض نموذج إنشاء مدفوعة', () => {
      renderWithRouter(<CreatePaymentPage />);

      expect(screen.getByText('إنشاء مدفوعة جديدة')).toBeInTheDocument();
      expect(screen.getByLabelText('رقم الفاتورة')).toBeInTheDocument();
      expect(screen.getByLabelText('المبلغ')).toBeInTheDocument();
      expect(screen.getByLabelText('طريقة الدفع')).toBeInTheDocument();
    });

    test('يجب أن تتحقق من صحة البيانات المدخلة', async () => {
      renderWithRouter(<CreatePaymentPage />);

      const amountInput = screen.getByLabelText('المبلغ');
      const submitButton = screen.getByText('حفظ المدفوعة');

      // إدخال مبلغ سالب
      fireEvent.change(amountInput, { target: { value: '-100' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('المبلغ يجب أن يكون أكبر من صفر')).toBeInTheDocument();
      });
    });

    test('يجب أن تنشئ مدفوعة جديدة عند إدخال بيانات صحيحة', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          payment: { id: 3, ...mockPayments[0] }
        }
      });

      renderWithRouter(<CreatePaymentPage />);

      // ملء النموذج
      fireEvent.change(screen.getByLabelText('رقم الفاتورة'), { 
        target: { value: '1' } 
      });
      fireEvent.change(screen.getByLabelText('المبلغ'), { 
        target: { value: '1000' } 
      });
      fireEvent.change(screen.getByLabelText('طريقة الدفع'), { 
        target: { value: 'cash' } 
      });

      // إرسال النموذج
      fireEvent.click(screen.getByText('حفظ المدفوعة'));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/payments', {
          invoiceId: 1,
          amount: 1000,
          paymentMethod: 'cash',
          paymentDate: expect.any(String)
        });
      });
    });
  });

  describe('📋 اختبارات تفاصيل المدفوعة', () => {
    
    test('يجب أن تعرض تفاصيل المدفوعة', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payment: mockPayments[0],
          invoice: mockInvoices[0]
        }
      });

      renderWithRouter(<PaymentDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('تفاصيل المدفوعة')).toBeInTheDocument();
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        expect(screen.getByText('1000 جنيه')).toBeInTheDocument();
      });
    });

    test('يجب أن تعرض أزرار الإجراءات', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payment: mockPayments[0],
          invoice: mockInvoices[0]
        }
      });

      renderWithRouter(<PaymentDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('تعديل')).toBeInTheDocument();
        expect(screen.getByText('حذف')).toBeInTheDocument();
        expect(screen.getByText('طباعة')).toBeInTheDocument();
      });
    });
  });

  describe('🎨 اختبارات مكونات المدفوعات', () => {
    
    test('يجب أن يعرض PaymentCard بيانات المدفوعة', () => {
      renderWithRouter(
        <PaymentCard 
          payment={mockPayments[0]} 
          onEdit={() => {}} 
          onDelete={() => {}} 
        />
      );

      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('1000 جنيه')).toBeInTheDocument();
      expect(screen.getByText('نقد')).toBeInTheDocument();
    });

    test('يجب أن يعرض PaymentStats الإحصائيات', () => {
      const mockStats = {
        totalPayments: 10,
        totalAmount: 50000,
        pendingPayments: 3,
        completedPayments: 7
      };

      renderWithRouter(<PaymentStats stats={mockStats} />);

      expect(screen.getByText('إجمالي المدفوعات')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('50,000 جنيه')).toBeInTheDocument();
    });

    test('يجب أن يعرض PaymentForm حقول النموذج', () => {
      renderWithRouter(
        <PaymentForm 
          onSubmit={() => {}} 
          onCancel={() => {}} 
        />
      );

      expect(screen.getByLabelText('رقم الفاتورة')).toBeInTheDocument();
      expect(screen.getByLabelText('المبلغ')).toBeInTheDocument();
      expect(screen.getByLabelText('طريقة الدفع')).toBeInTheDocument();
      expect(screen.getByLabelText('تاريخ الدفع')).toBeInTheDocument();
    });
  });

  describe('🔍 اختبارات البحث والفلترة', () => {
    
    test('يجب أن تعمل فلترة المدفوعات حسب التاريخ', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: [mockPayments[0]],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        const dateFromInput = screen.getByLabelText('من تاريخ');
        fireEvent.change(dateFromInput, { target: { value: '2024-12-20' } });
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/payments', {
          params: expect.objectContaining({
            dateFrom: '2024-12-20'
          })
        });
      });
    });

    test('يجب أن تعمل فلترة المدفوعات حسب طريقة الدفع', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: [mockPayments[0]],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        const paymentMethodSelect = screen.getByLabelText('طريقة الدفع');
        fireEvent.change(paymentMethodSelect, { target: { value: 'cash' } });
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/payments', {
          params: expect.objectContaining({
            paymentMethod: 'cash'
          })
        });
      });
    });

    test('يجب أن تعمل البحث النصي', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: [mockPayments[0]],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في المدفوعات...');
        fireEvent.change(searchInput, { target: { value: 'أحمد' } });
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/payments', {
          params: expect.objectContaining({
            search: 'أحمد'
          })
        });
      });
    });
  });

  describe('📊 اختبارات التقارير والإحصائيات', () => {
    
    test('يجب أن تعرض الرسوم البيانية', async () => {
      const mockChartData = {
        paymentMethods: {
          cash: 5,
          card: 3,
          transfer: 2
        },
        monthlyTrends: [
          { month: 'يناير', amount: 10000 },
          { month: 'فبراير', amount: 15000 }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { stats: mockChartData }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('توزيع طرق الدفع')).toBeInTheDocument();
        expect(screen.getByText('الاتجاهات الشهرية')).toBeInTheDocument();
      });
    });

    test('يجب أن تعرض إحصائيات المدفوعات المتأخرة', async () => {
      const mockOverdueStats = {
        overdueCount: 5,
        overdueAmount: 25000,
        overdueDays: [30, 60, 90]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { overdueStats: mockOverdueStats }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('المدفوعات المتأخرة')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('25,000 جنيه')).toBeInTheDocument();
      });
    });
  });

  describe('⚡ اختبارات الأداء', () => {
    
    test('يجب أن تحمل الصفحة بسرعة', async () => {
      const startTime = performance.now();
      
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('إدارة المدفوعات')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(1000); // أقل من ثانية واحدة
    });

    test('يجب أن تعمل العمليات المجمعة بكفاءة', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      // اختبار اختيار متعدد
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('حذف المحدد')).toBeInTheDocument();
        expect(screen.getByText('تصدير المحدد')).toBeInTheDocument();
      });
    });
  });

  describe('🔒 اختبارات الأمان', () => {
    
    test('يجب أن تتحقق من الصلاحيات قبل عرض البيانات', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { error: 'غير مصرح' } }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('غير مصرح بالوصول')).toBeInTheDocument();
      });
    });

    test('يجب أن تمنع إدخال بيانات ضارة', async () => {
      renderWithRouter(<CreatePaymentPage />);

      const notesInput = screen.getByLabelText('ملاحظات');
      const maliciousInput = '<script>alert("XSS")</script>';

      fireEvent.change(notesInput, { target: { value: maliciousInput } });

      // التحقق من أن السكريبت لم يتم تنفيذه
      expect(notesInput.value).not.toContain('<script>');
    });
  });

  describe('📱 اختبارات التصميم المتجاوب', () => {
    
    test('يجب أن تعمل على الشاشات الصغيرة', () => {
      // محاكاة شاشة صغيرة
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      // التحقق من وجود عناصر التصميم المتجاوب
      expect(screen.getByText('إدارة المدفوعات')).toBeInTheDocument();
    });

    test('يجب أن تعمل على الشاشات الكبيرة', () => {
      // محاكاة شاشة كبيرة
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          payments: mockPayments,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      });

      renderWithRouter(<PaymentsPage />);

      // التحقق من وجود جميع العناصر
      expect(screen.getByText('إدارة المدفوعات')).toBeInTheDocument();
      expect(screen.getByText('البحث والفلترة')).toBeInTheDocument();
    });
  });

  describe('🚨 اختبارات التعامل مع الأخطاء', () => {
    
    test('يجب أن تعرض رسالة خطأ عند فشل تحميل البيانات', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'خطأ في الخادم' } }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('خطأ في تحميل البيانات')).toBeInTheDocument();
      });
    });

    test('يجب أن تعرض رسالة خطأ عند فشل إنشاء مدفوعة', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'بيانات غير صحيحة' } }
      });

      renderWithRouter(<CreatePaymentPage />);

      // ملء النموذج وإرساله
      fireEvent.change(screen.getByLabelText('المبلغ'), { 
        target: { value: '1000' } 
      });
      fireEvent.click(screen.getByText('حفظ المدفوعة'));

      await waitFor(() => {
        expect(screen.getByText('بيانات غير صحيحة')).toBeInTheDocument();
      });
    });

    test('يجب أن تعرض رسالة خطأ عند فشل حذف مدفوعة', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: { status: 403, data: { error: 'غير مصرح بالحذف' } }
      });

      renderWithRouter(<PaymentDetailsPage />);

      fireEvent.click(screen.getByText('حذف'));

      await waitFor(() => {
        expect(screen.getByText('غير مصرح بالحذف')).toBeInTheDocument();
      });
    });
  });

  describe('📤 اختبارات التصدير', () => {
    
    test('يجب أن تعمل تصدير PDF', async () => {
      // Mock PDF generation
      const mockPDF = new Blob(['PDF content'], { type: 'application/pdf' });
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      mockedAxios.get.mockResolvedValueOnce({
        data: { payments: mockPayments }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('تصدير PDF'));
      });

      // التحقق من أن التصدير تم
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('يجب أن تعمل تصدير Excel', async () => {
      // Mock Excel generation
      const mockExcel = new Blob(['Excel content'], { type: 'application/vnd.ms-excel' });
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      mockedAxios.get.mockResolvedValueOnce({
        data: { payments: mockPayments }
      });

      renderWithRouter(<PaymentsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('تصدير Excel'));
      });

      // التحقق من أن التصدير تم
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});

// اختبارات الأداء المتقدمة
describe('⚡ اختبارات الأداء المتقدمة', () => {
  
  test('يجب أن تعمل العمليات المجمعة بكفاءة', async () => {
    const startTime = performance.now();
    
    // محاكاة 100 مدفوعة
    const largeMockPayments = Array.from({ length: 100 }, (_, i) => ({
      ...mockPayments[0],
      id: i + 1,
      amount: Math.random() * 10000
    }));

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        payments: largeMockPayments,
        pagination: { page: 1, limit: 100, total: 100, totalPages: 1 }
      }
    });

    renderWithRouter(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('إدارة المدفوعات')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(2000); // أقل من ثانيتين
  });

  test('يجب أن تعمل الفلترة بسرعة', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        payments: mockPayments,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }
    });

    renderWithRouter(<PaymentsPage />);

    const startTime = performance.now();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('البحث في المدفوعات...');
      fireEvent.change(searchInput, { target: { value: 'أحمد' } });
    });

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    expect(searchTime).toBeLessThan(500); // أقل من نصف ثانية
  });
});

// اختبارات التكامل
describe('🔗 اختبارات التكامل', () => {
  
  test('يجب أن تتكامل مع نظام الفواتير', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { invoices: mockInvoices }
    });

    renderWithRouter(<CreatePaymentPage />);

    await waitFor(() => {
      const invoiceSelect = screen.getByLabelText('رقم الفاتورة');
      expect(invoiceSelect).toBeInTheDocument();
    });
  });

  test('يجب أن تتكامل مع نظام العملاء', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { customers: mockPayments.map(p => ({
        id: p.id,
        firstName: p.customerFirstName,
        lastName: p.customerLastName
      })) }
    });

    renderWithRouter(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
    });
  });
});

export default {
  mockPayments,
  mockInvoices,
  renderWithRouter
};


