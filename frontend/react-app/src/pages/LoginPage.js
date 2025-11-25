import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { isCustomerRole, isTechnicianRole } from '../constants/roles';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const LoginPage = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'loginIdentifier':
        if (!value) {
          errors.loginIdentifier = 'البريد الإلكتروني أو رقم الهاتف مطلوب';
        } else if (value.length < 3) {
          errors.loginIdentifier = 'البريد الإلكتروني أو رقم الهاتف قصير جداً';
        } else {
          delete errors.loginIdentifier;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'كلمة المرور مطلوبة';
        } else if (value.length < 8) {
          errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        } else {
          delete errors.password;
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  // Validate on change (after first blur)
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'loginIdentifier') {
      setLoginIdentifier(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    
    // Validate only if field was touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [loginIdentifier, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Mark all fields as touched
    const allTouched = { loginIdentifier: true, password: true };
    setTouched(allTouched);

    // Validate all fields
    const isLoginValid = validateField('loginIdentifier', loginIdentifier);
    const isPasswordValid = validateField('password', password);

    if (!isLoginValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      await login(loginIdentifier, password);
      
      // Get user data after login to determine redirect
      const user = useAuthStore.getState().user;
      const roleId = user?.roleId || user?.role;
      const numericRoleId = Number(roleId);

      // Redirect based on user role
      if (isTechnicianRole(numericRoleId)) {
        // Technician → Technician Dashboard
        navigate('/tech/dashboard');
      } else if (isCustomerRole(numericRoleId) || user?.type === 'customer') {
        // Customer → Customer Dashboard
        navigate('/customer/dashboard');
      } else {
        // Admin/Staff → Main Dashboard
        navigate('/');
      }
    } catch (err) {
      // Map error messages to Arabic
      let errorMessage = err.message || 'حدث خطأ غير متوقع';
      
      // Translate common error messages
      const errorTranslations = {
        'User not found': 'المستخدم غير موجود',
        'Incorrect password': 'كلمة المرور غير صحيحة',
        'Invalid credentials': 'بيانات تسجيل الدخول غير صحيحة',
        'Too many login attempts': 'عدد كبير جداً من محاولات تسجيل الدخول، يرجى المحاولة مرة أخرى بعد 15 دقيقة',
        'Please provide login identifier and password': 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور',
        'Network Error': 'خطأ في الاتصال بالخادم',
        'Server error': 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
      };

      // Check if error message matches any translation
      Object.keys(errorTranslations).forEach(key => {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          errorMessage = errorTranslations[key];
        }
      });

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
          <CardDescription className="text-center">
            أدخل بياناتك للدخول إلى حسابك
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative rtl" 
                role="alert"
                dir="rtl"
              >
                <strong className="font-bold">خطأ: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="loginIdentifier" dir="rtl">البريد الإلكتروني أو رقم الهاتف</Label>
              <Input
                id="loginIdentifier"
                name="loginIdentifier"
                type="text"
                placeholder="مثال: user@example.com أو 0123456789"
                value={loginIdentifier}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isLoading}
                dir="ltr"
                className={touched.loginIdentifier && validationErrors.loginIdentifier ? 'border-red-500' : ''}
              />
              {touched.loginIdentifier && validationErrors.loginIdentifier && (
                <p className="text-sm text-red-600 rtl" dir="rtl">{validationErrors.loginIdentifier}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" dir="rtl">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                lang="en"
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                required
                value={password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={touched.password && validationErrors.password ? 'border-red-500' : ''}
              />
              {touched.password && validationErrors.password && (
                <p className="text-sm text-red-600 rtl" dir="rtl">{validationErrors.password}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 rtl"
                  dir="rtl"
                >
                  تذكرني
                </label>
              </div>
              <a 
                href="#" 
                className="text-sm text-primary hover:underline rtl"
                dir="rtl"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement forgot password (connects to manager)
                  alert('يرجى الاتصال بالمدير المسؤول لإعادة تعيين كلمة المرور');
                }}
              >
                نسيت كلمة المرور؟
              </a>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
