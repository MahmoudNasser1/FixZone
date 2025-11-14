import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  Search, Plus, User, Mail, Phone, Shield, Edit, Trash2,
  UserCheck, UserX, Eye, Key, Settings, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, RefreshCw, Download, Users as UsersIcon
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner, TableLoadingSkeleton, CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';

const UsersPageEnhanced = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State للبحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // State للإحصائيات
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    technicians: 0,
    managers: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب المستخدمين والأدوار
      // apiService.listUsers() يرجع JSON مباشرة وليس Response object
      let usersData = [];
      let rolesData = [];
      
      try {
        const usersResult = await apiService.listUsers({ includeInactive: 1 });
        
        // Backend يرجع array مباشر (بدون pagination) أو { success: true, data: { items, total } } (مع pagination)
        if (Array.isArray(usersResult)) {
          usersData = usersResult;
        } else if (usersResult?.data?.items) {
          usersData = usersResult.data.items;
        } else if (usersResult?.items) {
          usersData = usersResult.items;
        } else if (usersResult?.success && usersResult?.data) {
          usersData = Array.isArray(usersResult.data) ? usersResult.data : (usersResult.data.items || []);
        } else {
          usersData = [];
        }
      } catch (err) {
        console.error('Error loading users:', err);
        notifications.error('خطأ في تحميل المستخدمين', { message: err.message || 'حدث خطأ غير متوقع' });
        usersData = [];
      }
      
      try {
        const rolesResult = await apiService.listRoles();
        
        // Backend يرجع array مباشر
        if (Array.isArray(rolesResult)) {
          rolesData = rolesResult;
        } else if (rolesResult?.items) {
          rolesData = rolesResult.items;
        } else if (rolesResult?.data) {
          rolesData = Array.isArray(rolesResult.data) ? rolesResult.data : (rolesResult.data.items || []);
        } else {
          rolesData = [];
        }
      } catch (err) {
        console.error('Error loading roles:', err);
        notifications.error('خطأ في تحميل الأدوار', { message: err.message || 'حدث خطأ غير متوقع' });
        rolesData = [];
      }
      
      setUsers(usersData);
      setRoles(rolesData);
      
      // حساب الإحصائيات
      const activeUsers = usersData.filter(u => u?.isActive);
      const inactiveUsers = usersData.filter(u => !u?.isActive);
      
      setStats({
        total: usersData.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        admins: usersData.filter(u => u?.roleId === 1).length,
        technicians: usersData.filter(u => u?.roleId === 3 || u?.roleId === 6).length,
        managers: usersData.filter(u => u?.roleId === 2).length
      });
      
      if (usersData.length === 0) {
        console.warn('No users found. Check database or API response.');
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      notifications.error('حدث خطأ في تحميل البيانات', { message: err.message || 'حدث خطأ غير متوقع' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    const newStatus = !user.isActive;
    
    // Optimistic update
    const prevStatus = user.isActive;
    setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
    
    try {
      // apiService.updateUser() يرجع JSON مباشر وليس Response object
      const result = await apiService.updateUser(user.id, { isActive: newStatus });
      
      // Backend يرجع { success: true, message, data } أو { message }
      if (result?.success || result?.message) {
        notifications.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);
        loadData(); // إعادة تحميل لتحديث الإحصائيات
      } else {
        throw new Error(result?.message || 'فشل تحديث حالة المستخدم');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      // Rollback optimistic update
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: prevStatus } : u));
      notifications.error('حدث خطأ في تحديث حالة المستخدم', { message: err.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleChangeRole = async (user, newRoleId) => {
    const prevRoleId = user.roleId;
    const newRoleIdNum = Number(newRoleId);
    
    // Optimistic update
    setUsers(users.map(u => u.id === user.id ? { ...u, roleId: newRoleIdNum } : u));
    
    try {
      // apiService.updateUser() يرجع JSON مباشر وليس Response object
      const result = await apiService.updateUser(user.id, { roleId: newRoleIdNum });
      
      // Backend يرجع { success: true, message, data } أو { message }
      if (result?.success || result?.message) {
        const roleName = roles.find(r => r.id === newRoleIdNum)?.name || 'غير محدد';
        notifications.success(`تم تغيير دور المستخدم إلى ${roleName}`);
        loadData(); // إعادة تحميل لتحديث الإحصائيات
      } else {
        throw new Error(result?.message || 'فشل تغيير دور المستخدم');
      }
    } catch (err) {
      console.error('Error changing user role:', err);
      // Rollback optimistic update
      setUsers(users.map(u => u.id === user.id ? { ...u, roleId: prevRoleId } : u));
      notifications.error('حدث خطأ في تغيير دور المستخدم', { message: err.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }
    
    // Optimistic update
    const userToDelete = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    
    try {
      // apiService.deleteUser() يرجع JSON مباشر وليس Response object
      const result = await apiService.deleteUser(userId);
      
      // Backend يرجع { success: true, message } أو { message }
      if (result?.success || result?.message) {
        notifications.success('تم حذف المستخدم بنجاح');
        loadData(); // إعادة تحميل لتحديث الإحصائيات
      } else {
        throw new Error(result?.message || 'فشل حذف المستخدم');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      // Rollback optimistic update
      if (userToDelete) {
        setUsers([...users, userToDelete]);
      }
      notifications.error('حدث خطأ في حذف المستخدم', { message: err.message || 'حدث خطأ غير متوقع' });
    }
  };

  // الفلترة والترتيب
  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];
    
    // البحث
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.name || '').toLowerCase().includes(search) ||
        (user.firstName || '').toLowerCase().includes(search) ||
        (user.lastName || '').toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        (user.username || '').toLowerCase().includes(search) ||
        (user.phone || '').includes(searchTerm)
      );
    }
    
    // فلترة حسب الدور
    if (selectedRole) {
      filtered = filtered.filter(user => user.roleId === Number(selectedRole));
    }
    
    // فلترة حسب الحالة
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    }
    
    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'name') {
        aValue = (a.name || `${a.firstName} ${a.lastName}`).toLowerCase();
        bValue = (b.name || `${b.firstName} ${b.lastName}`).toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      } else if (sortField === 'email') {
        aValue = (a.email || '').toLowerCase();
        bValue = (b.email || '').toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (sortField === 'roleId') {
        aValue = a.roleId || 0;
        bValue = b.roleId || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortField === 'isActive') {
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else { // createdAt, updatedAt
        aValue = new Date(a[sortField] || 0);
        bValue = new Date(b[sortField] || 0);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return filtered;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'غير محدد';
  };

  const getRoleBadgeColor = (roleId) => {
    switch (roleId) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      case 4: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = getFilteredAndSortedUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-blue-600" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-600 mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </SimpleButton>
          <SimpleButton
            onClick={() => navigate('/users/new')}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة مستخدم جديد
          </SimpleButton>
        </div>
      </div>

      {/* الإحصائيات */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardLoadingSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">المستخدمون النشطون</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">المدراء</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.admins}</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">الفنيون</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.technicians}</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      )}

      {/* الفلاتر والبحث */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline ml-1" />
                البحث
              </label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، البريد، أو اسم المستخدم..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline ml-1" />
                الدور
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الكل</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline ml-1" />
                الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">الكل</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">غير نشط فقط</option>
              </select>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* جدول المستخدمين */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center justify-between">
            <span>قائمة المستخدمين ({filteredUsers.length})</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent className="p-0">
          {loading ? (
            <TableLoadingSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('id')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        #
                        {renderSortIcon('id')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        الاسم
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        البريد الإلكتروني
                        {renderSortIcon('email')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('roleId')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        الدور
                        {renderSortIcon('roleId')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('isActive')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        الحالة
                        {renderSortIcon('isActive')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>لا يوجد مستخدمين</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {(user.firstName?.[0] || user.name?.[0] || 'U').toUpperCase()}
                              </div>
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || `${user.firstName} ${user.lastName}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-4 h-4 ml-1" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 ml-1" />
                            {user.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.roleId || ''}
                            onChange={(e) => handleChangeRole(user, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user.roleId)}`}
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="w-3 h-3 ml-1" />
                              نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <UserX className="w-3 h-3 ml-1" />
                              غير نشط
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <SimpleButton
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                            </SimpleButton>
                            <SimpleButton
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                            <SimpleButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              className={user.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </SimpleButton>
                            <SimpleButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* معلومات إضافية */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            عرض {filteredUsers.length} من {users.length} مستخدم
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPageEnhanced;

