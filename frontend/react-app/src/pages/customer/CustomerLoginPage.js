import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [formData, setFormData] = useState({
    loginIdentifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.request('/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (result.success && result.data) {
        // Ensure roleId is set
        const userData = {
          ...result.data,
          roleId: result.data.roleId || result.data.role || 8
        };
        
        // Update auth store
        useAuthStore.setState({
          isAuthenticated: true,
          user: userData,
          token: null
        });
        notifications.success('نجاح', { message: 'تم تسجيل الدخول بنجاح' });
        navigate('/customer/dashboard');
      } else {
        throw new Error(result.message || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('Customer login error:', error);
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <SimpleCard className="w-full max-w-md shadow-xl">
        <SimpleCardHeader>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <SimpleCardTitle>تسجيل دخول العميل</SimpleCardTitle>
            <p className="text-sm text-gray-600 mt-2">
              سجّل الدخول لعرض حالة أجهزتك وفواتيرك
            </p>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={formData.loginIdentifier}
                  onChange={(e) => setFormData({ ...formData, loginIdentifier: e.target.value })}
                  placeholder="أدخل رقم الهاتف أو البريد الإلكتروني"
                  className="pr-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  lang="en"
                  autoComplete="current-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <SimpleButton
              type="submit"
              variant="default"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              تسجيل الدخول
            </SimpleButton>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <a href="mailto:support@fixzone.com" className="text-blue-600 hover:underline">
                تواصل معنا
              </a>
            </p>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
}

