import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // تحديث الحالة لإظهار واجهة الخطأ
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // تسجيل تفاصيل الخطأ
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // إرسال الخطأ إلى خدمة مراقبة الأخطاء (إذا كانت متاحة)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // واجهة الخطأ المخصصة
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              حدث خطأ غير متوقع
            </h1>
            
            <p className="text-gray-600 mb-6">
              نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">تفاصيل الخطأ:</h3>
                <pre className="text-sm text-gray-600 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-sm text-gray-600 overflow-auto max-h-32 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex space-x-3 space-x-reverse justify-center">
              <SimpleButton
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </SimpleButton>
              
              <SimpleButton
                onClick={this.handleGoHome}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Home className="w-4 h-4 ml-2" />
                الصفحة الرئيسية
              </SimpleButton>
            </div>

            {this.props.fallback && (
              <div className="mt-6">
                {this.props.fallback}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// مكون خطأ مبسط للاستخدام السريع
export const SimpleErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// مكون خطأ مع إعادة تحميل تلقائي
export const AutoRetryErrorBoundary = ({ children, retryDelay = 5000 }) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback(() => {
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, retryDelay);
  }, [retryDelay]);

  return (
    <ErrorBoundary 
      key={retryCount}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

// مكون خطأ مع تسجيل الأخطاء
export const LoggingErrorBoundary = ({ children, onLogError }) => {
  const handleError = React.useCallback((error, errorInfo) => {
    // تسجيل الخطأ محلياً
    console.error('Application Error:', error, errorInfo);
    
    // إرسال الخطأ إلى خدمة خارجية
    if (onLogError) {
      onLogError(error, errorInfo);
    }
    
    // يمكن إضافة المزيد من منطق التسجيل هنا
  }, [onLogError]);

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;


