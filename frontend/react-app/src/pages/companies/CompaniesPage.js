import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Input } from '../../components/ui/Input';
import { 
  Plus, Search, Filter, Download, RefreshCw, Building2,
  Phone, Mail, MapPin, Calendar, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, Globe,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  
  // Sorting state
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // جلب البيانات من Backend
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCompanies();
      console.log('Companies response:', response);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Companies raw response:', result);
        
        // التحقق من شكل البيانات وإصلاحها
        let companiesData = [];
        if (Array.isArray(result)) {
          // إذا كانت البيانات array مباشرة
          companiesData = result;
        } else if (result.companies && Array.isArray(result.companies)) {
          // إذا كانت البيانات في object.companies
          companiesData = result.companies;
        } else if (result.data && Array.isArray(result.data)) {
          // إذا كانت البيانات في object.data
          companiesData = result.data;
        }
        
        // إصلاح إضافي: إذا كانت البيانات في شكل غير متوقع
        if (companiesData.length > 0 && Array.isArray(companiesData[0])) {
          console.log('Data is in nested array format, flattening...');
          companiesData = companiesData.flat();
        }
        
        // إصلاح إضافي: إذا كانت البيانات في شكل nested array من nested arrays
        if (companiesData.length > 0 && Array.isArray(companiesData[0]) && Array.isArray(companiesData[0][0])) {
          console.log('Data is in deeply nested array format, flattening deeply...');
          companiesData = companiesData.flat(2);
        }
        
        console.log('Companies processed:', companiesData);
        
        // إصلاح إضافي: تنظيف البيانات من العناصر الفارغة
        companiesData = companiesData.filter(company => 
          company && 
          company.id && 
          company.name && 
          typeof company.id !== 'undefined' && 
          company.id !== null
        );
        
        console.log('Companies after cleanup:', companiesData);
        
        // إصلاح إضافي: التأكد من أن البيانات صحيحة
        if (companiesData.length === 0) {
          console.log('No companies found, using fallback data');
          // استخدام البيانات التجريبية إذا لم توجد بيانات
          setCompanies([
            {
              id: 1,
              name: 'شركة التقنيات المتقدمة',
              email: 'info@advanced-tech.com',
              phone: '0112345678',
              address: 'الرياض، حي العليا',
              website: 'www.advanced-tech.com',
              industry: 'تقنية المعلومات',
              description: 'شركة متخصصة في حلول تقنية المعلومات',
              status: 'active',
              taxNumber: '123456789',
              createdAt: '2023-01-15',
              customersCount: 5
            },
            {
              id: 2,
              name: 'مؤسسة الإنشاءات الحديثة',
              email: 'contact@modern-construction.com',
              phone: '0123456789',
              address: 'جدة، حي الروضة',
              website: 'www.modern-construction.com',
              industry: 'الإنشاءات',
              description: 'مؤسسة متخصصة في الإنشاءات والتطوير العقاري',
              status: 'active',
              taxNumber: '987654321',
              createdAt: '2023-02-20',
              customersCount: 3
            }
          ]);
        } else {
          // تنظيف البيانات التجريبية أيضاً
          const cleanData = companiesData.filter(company => 
            company && 
            company.id && 
            company.name && 
            typeof company.id !== 'undefined' && 
            company.id !== null
          );
          setCompanies(cleanData);
        }
      } else {
        throw new Error('Failed to fetch companies');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('حدث خطأ في تحميل بيانات الشركات');
      // بيانات تجريبية في حالة الخطأ
      setCompanies([
        {
          id: 1,
          name: 'شركة التقنيات المتقدمة',
          email: 'info@advanced-tech.com',
          phone: '0112345678',
          address: 'الرياض، حي العليا',
          website: 'www.advanced-tech.com',
          industry: 'تقنية المعلومات',
          description: 'شركة متخصصة في حلول تقنية المعلومات',
          status: 'active',
          taxNumber: '123456789',
          createdAt: '2023-01-15',
          customersCount: 5
        },
        {
          id: 2,
          name: 'مؤسسة الإنشاءات الحديثة',
          email: 'contact@modern-construction.com',
          phone: '0123456789',
          address: 'جدة، حي الروضة',
          website: 'www.modern-construction.com',
          industry: 'الإنشاءات',
          description: 'مؤسسة متخصصة في الإنشاءات والتطوير العقاري',
          status: 'active',
          taxNumber: '987654321',
          createdAt: '2023-02-20',
          customersCount: 3
        },
        {
          id: 3,
          name: 'شركة النقل السريع',
          email: 'info@fast-transport.com',
          phone: '0134567890',
          address: 'الدمام، حي الفيصلية',
          website: 'www.fast-transport.com',
          industry: 'النقل',
          description: 'شركة متخصصة في خدمات النقل والشحن',
          status: 'inactive',
          taxNumber: '456789123',
          createdAt: '2023-03-10',
          customersCount: 2
        }
      ]);
    } finally {
      setLoading(false);
    }
    
    // تنظيف البيانات النهائية
    setCompanies(prevCompanies => 
      prevCompanies.filter(company => 
        company && 
        company.id && 
        company.name && 
        typeof company.id !== 'undefined' && 
        company.id !== null
      )
    );
  };

  const handleDeleteCompany = async (companyId) => {
    console.log('Delete company called with ID:', companyId, 'Type:', typeof companyId);
    
    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      alert('خطأ: معرف الشركة غير صحيح');
      return;
    }
    
    const company = companies.find(c => c.id === companyId);
    
    // إذا الشركة غير موجودة في الـ state (محذوفة من الـ DB بالفعل)
    if (!company) {
      alert('⚠️ هذه الشركة محذوفة بالفعل من قاعدة البيانات!\n\nسيتم تحديث القائمة...');
      fetchCompanies(); // إعادة تحميل البيانات من الـ DB
      return;
    }
    
    const hasCustomers = company && company.customersCount > 0;
    
    // إذا كان هناك عملاء مرتبطين، اعرض خيارات
    if (hasCustomers) {
      const customersList = company.customersCount === 1 ? 'عميل واحد' : `${company.customersCount} عميل`;
      const forceDelete = window.confirm(
        `⚠️ تنبيه: يوجد ${customersList} مرتبط بهذه الشركة!\n\n` +
        `هل تريد حذف الشركة مع إلغاء ربط العملاء؟\n\n` +
        `• اضغط "موافق" لحذف الشركة وإلغاء ربط العملاء\n` +
        `• اضغط "إلغاء" لإلغاء العملية`
      );
      
      if (!forceDelete) {
        return;
      }
      
      // حذف مع force
      try {
        const response = await apiService.deleteCompany(companyId, true); // force = true
        if (response.ok) {
          const result = await response.json();
          setCompanies(companies.filter(company => company.id !== companyId));
          alert(`✅ ${result.message}\n\nتم إلغاء ربط ${result.unlinkedCustomers || 0} عميل من الشركة.`);
          fetchCompanies(); // إعادة تحميل البيانات
        } else if (response.status === 404) {
          // الشركة غير موجودة في الـ DB
          alert('⚠️ هذه الشركة محذوفة بالفعل من قاعدة البيانات!\n\nسيتم تحديث القائمة...');
          setCompanies(companies.filter(company => company.id !== companyId));
          fetchCompanies();
        } else {
          const errorData = await response.json();
          alert(`❌ خطأ: ${errorData.message || errorData.error}`);
        }
      } catch (err) {
        console.error('Error force deleting company:', err);
        alert('حدث خطأ في حذف الشركة: ' + err.message);
        fetchCompanies(); // إعادة تحميل البيانات في حالة الخطأ
      }
      return;
    }
    
    // إذا لم يكن هناك عملاء، حذف عادي
    const confirmMessage = 'هل أنت متأكد من حذف هذه الشركة؟';
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await apiService.deleteCompany(companyId, false);
        if (response.ok) {
          const result = await response.json();
          setCompanies(companies.filter(company => company.id !== companyId));
          alert(result.message || 'تم حذف الشركة بنجاح');
          fetchCompanies(); // إعادة تحميل البيانات
        } else if (response.status === 404) {
          // الشركة غير موجودة في الـ DB
          alert('⚠️ هذه الشركة محذوفة بالفعل من قاعدة البيانات!\n\nسيتم تحديث القائمة...');
          setCompanies(companies.filter(company => company.id !== companyId));
          fetchCompanies();
        } else {
          const errorData = await response.json();
          if (errorData.customersCount && errorData.customers) {
            const customerNames = errorData.customers.map(c => `• ${c.name} (ID: ${c.id})`).join('\n');
            alert(`❌ لا يمكن حذف هذه الشركة!\n\nالعملاء المرتبطون:\n${customerNames}\n\n${errorData.message}`);
          } else {
            alert(`❌ خطأ: ${errorData.message || errorData.error}`);
          }
          fetchCompanies(); // إعادة تحميل البيانات في حالة الخطأ
        }
      } catch (err) {
        console.error('Error deleting company:', err);
        alert('حدث خطأ في حذف الشركة: ' + err.message);
        fetchCompanies(); // إعادة تحميل البيانات في حالة الخطأ
      }
    }
  };

  const handleRefresh = () => {
    fetchCompanies();
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      // إذا كان نفس الحقل، غير الاتجاه
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // إذا كان حقل جديد، ابدأ بـ asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // فلترة وترتيب الشركات
  const getFilteredAndSortedCompanies = () => {
    let filtered = companies.filter(company => {
      console.log('Filtering company:', company, 'ID:', company.id, 'Type:', typeof company.id);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (company.name || '').toLowerCase().includes(searchLower) ||
        (company.phone || '').includes(searchTerm) ||
        (company.email || '').toLowerCase().includes(searchLower) ||
        (company.industry || '').toLowerCase().includes(searchLower) ||
        (company.address || '').toLowerCase().includes(searchLower);
      
      if (selectedFilter === 'all') return matchesSearch;
      if (selectedFilter === 'active') return matchesSearch && company.status === 'active';
      if (selectedFilter === 'inactive') return matchesSearch && company.status === 'inactive';
      
      return matchesSearch;
    });

    // تطبيق الترتيب
    if (sortField && filtered.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // معالجة الأرقام
        if (sortField === 'id') {
          aValue = parseInt(aValue) || 0;
          bValue = parseInt(bValue) || 0;
        }

        // معالجة النصوص
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredCompanies = getFilteredAndSortedCompanies();
  
  console.log('Filtered companies:', filteredCompanies);

  // حساب الإحصائيات
  const stats = {
    total: companies.length,
    active: companies.filter(company => company.status === 'active').length,
    inactive: companies.filter(company => company.status === 'inactive').length,
    totalCustomers: companies.reduce((sum, company) => sum + (company.customersCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الشركات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الشركات</h1>
        <Link to="/companies/new">
          <SimpleButton className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>شركة جديدة</span>
          </SimpleButton>
        </Link>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <SimpleButton 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="mr-2"
          >
            إعادة المحاولة
          </SimpleButton>
        </div>
      )}

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الشركات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">نشطة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">غير نشطة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* أدوات البحث والفلترة */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الشركات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الشركات</option>
                <option value="active">نشطة</option>
                <option value="inactive">غير نشطة</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <SimpleButton variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </SimpleButton>
              <SimpleButton variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* جدول الشركات */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة الشركات ({filteredCompanies.length})</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد شركات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('id')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        ID
                        {renderSortIcon('id')}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        الشركة
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('phone')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        معلومات الاتصال
                        {renderSortIcon('phone')}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('industry')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        القطاع
                        {renderSortIcon('industry')}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">العملاء</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        الحالة
                        {renderSortIcon('status')}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.filter(company => company.id).map((company, index) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          #{company.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="mr-3">
                            <p className="font-medium text-gray-900">{company.name}</p>
                            {company.website && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Globe className="w-3 h-3 ml-1" />
                                <span className="en-text">{company.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 ml-2" />
                            <span className="en-text">{company.phone}</span>
                          </div>
                          {company.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 ml-2" />
                              <span className="en-text">{company.email}</span>
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-3 h-3 ml-2" />
                              <span>{company.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{company.industry || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 ml-1" />
                          <span className="text-sm font-medium">{company.customersCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <SimpleBadge 
                          variant={company.status === 'active' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {company.status === 'active' ? 'نشطة' : 'غير نشطة'}
                        </SimpleBadge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Link to={`/companies/${company.id}`}>
                            <SimpleButton variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <Link to={`/companies/${company.id}/edit`}>
                            <SimpleButton variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <SimpleButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default CompaniesPage;
