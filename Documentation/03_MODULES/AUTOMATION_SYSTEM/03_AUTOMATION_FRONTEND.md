# نظام الأوتوميشن - Frontend Components
## Automation System - Frontend Components

**التاريخ:** 2025-01-27  
**الحالة:** Production System

---

## 📋 جدول المحتويات

1. [Automation Dashboard](#automation-dashboard)
2. [Rules Management](#rules-management)
3. [Templates Management](#templates-management)
4. [Logs & Monitoring](#logs--monitoring)
5. [Settings & Configuration](#settings--configuration)

---

## 📊 Automation Dashboard

### 1.1 المكون: `AutomationDashboard.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Tabs } from 'antd';
import { 
    PlayCircleOutlined, 
    PauseCircleOutlined,
    BarChartOutlined,
    NotificationOutlined 
} from '@ant-design/icons';
import api from '../../services/api';

const AutomationDashboard = () => {
    const [stats, setStats] = useState({
        totalRules: 0,
        activeRules: 0,
        executionsToday: 0,
        notificationsSent: 0
    });
    
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchDashboardData();
    }, []);
    
    const fetchDashboardData = async () => {
        try {
            const [statsRes, executionsRes] = await Promise.all([
                api.get('/automation/dashboard/stats'),
                api.get('/automation/executions?limit=10')
            ]);
            
            setStats(statsRes.data.data);
            setRecentExecutions(executionsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const executionColumns = [
        {
            title: 'القاعدة',
            dataIndex: 'ruleName',
            key: 'ruleName'
        },
        {
            title: 'النوع',
            dataIndex: 'executionType',
            key: 'executionType',
            render: (type) => {
                const types = {
                    automatic: 'تلقائي',
                    manual: 'يدوي',
                    scheduled: 'مجدول'
                };
                return types[type] || type;
            }
        },
        {
            title: 'الحالة',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    completed: 'success',
                    running: 'processing',
                    failed: 'error',
                    pending: 'default'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            }
        },
        {
            title: 'الوقت',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        }
    ];
    
    return (
        <div className="automation-dashboard">
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="إجمالي القواعد"
                            value={stats.totalRules}
                            prefix={<BarChartOutlined />}
                        />
                    </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="القواعد النشطة"
                            value={stats.activeRules}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="التنفيذات اليوم"
                            value={stats.executionsToday}
                            prefix={<PlayCircleOutlined />}
                        />
                    </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="الإشعارات المرسلة"
                            value={stats.notificationsSent}
                            prefix={<NotificationOutlined />}
                        />
                    </Card>
                </Col>
            </Row>
            
            <Card title="التنفيذات الأخيرة" style={{ marginTop: 16 }}>
                <Table
                    columns={executionColumns}
                    dataSource={recentExecutions}
                    loading={loading}
                    pagination={false}
                    size="small"
                />
            </Card>
        </div>
    );
};

export default AutomationDashboard;
```

---

## 🔧 Rules Management

### 2.1 صفحة إدارة القواعد: `AutomationRulesPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select,
    Switch, Tag, Space, Popconfirm, message
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    PlayCircleOutlined, PauseCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import RuleFormModal from './components/RuleFormModal';

const AutomationRulesPage = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    
    useEffect(() => {
        fetchRules();
    }, []);
    
    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await api.get('/automation/rules');
            setRules(response.data.data);
        } catch (error) {
            message.error('فشل تحميل القواعد');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreate = () => {
        setEditingRule(null);
        setFormModalVisible(true);
    };
    
    const handleEdit = (rule) => {
        setEditingRule(rule);
        setFormModalVisible(true);
    };
    
    const handleDelete = async (id) => {
        try {
            await api.delete(`/automation/rules/${id}`);
            message.success('تم حذف القاعدة بنجاح');
            fetchRules();
        } catch (error) {
            message.error('فشل حذف القاعدة');
        }
    };
    
    const handleToggleActive = async (rule) => {
        try {
            await api.put(`/automation/rules/${rule.id}`, {
                ...rule,
                isActive: !rule.isActive
            });
            message.success(`تم ${rule.isActive ? 'تعطيل' : 'تفعيل'} القاعدة`);
            fetchRules();
        } catch (error) {
            message.error('فشل تحديث القاعدة');
        }
    };
    
    const handleExecute = async (rule) => {
        try {
            await api.post(`/automation/rules/${rule.id}/execute`);
            message.success('تم تنفيذ القاعدة بنجاح');
        } catch (error) {
            message.error('فشل تنفيذ القاعدة');
        }
    };
    
    const columns = [
        {
            title: 'الاسم',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'النوع',
            dataIndex: 'ruleType',
            key: 'ruleType',
            render: (type) => {
                const types = {
                    event_based: 'بناءً على الأحداث',
                    time_based: 'بناءً على الوقت',
                    condition_based: 'بناءً على الشروط',
                    workflow_based: 'بناءً على سير العمل'
                };
                return <Tag>{types[type] || type}</Tag>;
            }
        },
        {
            title: 'الحدث المشغل',
            dataIndex: 'triggerEvent',
            key: 'triggerEvent'
        },
        {
            title: 'الحالة',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'نشط' : 'معطل'}
                </Tag>
            )
        },
        {
            title: 'الإجراءات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        تعديل
                    </Button>
                    
                    <Button
                        type="link"
                        icon={record.isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => handleToggleActive(record)}
                    >
                        {record.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    
                    <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleExecute(record)}
                    >
                        تنفيذ
                    </Button>
                    
                    <Popconfirm
                        title="هل أنت متأكد من الحذف؟"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            حذف
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];
    
    return (
        <div className="automation-rules-page">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>قواعد الأوتوميشن</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                >
                    قاعدة جديدة
                </Button>
            </div>
            
            <Table
                columns={columns}
                dataSource={rules}
                loading={loading}
                rowKey="id"
            />
            
            <RuleFormModal
                visible={formModalVisible}
                rule={editingRule}
                onCancel={() => setFormModalVisible(false)}
                onSuccess={() => {
                    setFormModalVisible(false);
                    fetchRules();
                }}
            />
        </div>
    );
};

export default AutomationRulesPage;
```

### 2.2 نموذج القاعدة: `RuleFormModal.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
    Modal, Form, Input, Select, Switch, Button,
    Space, Card, Tabs
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import ActionBuilder from './components/ActionBuilder';
import ConditionBuilder from './components/ConditionBuilder';

const RuleFormModal = ({ visible, rule, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (rule) {
            form.setFieldsValue({
                ...rule,
                actions: rule.actions ? JSON.parse(rule.actions) : [],
                conditions: rule.conditions ? JSON.parse(rule.conditions) : {}
            });
        } else {
            form.resetFields();
        }
    }, [rule, visible]);
    
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            setLoading(true);
            
            const payload = {
                ...values,
                actions: JSON.stringify(values.actions || []),
                conditions: JSON.stringify(values.conditions || {}),
                triggerConditions: JSON.stringify(values.triggerConditions || {}),
                scheduleConfig: JSON.stringify(values.scheduleConfig || {})
            };
            
            if (rule) {
                await api.put(`/automation/rules/${rule.id}`, payload);
            } else {
                await api.post('/automation/rules', payload);
            }
            
            onSuccess();
        } catch (error) {
            console.error('Form validation failed:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal
            title={rule ? 'تعديل القاعدة' : 'قاعدة جديدة'}
            visible={visible}
            onCancel={onCancel}
            width={900}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    إلغاء
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
                    حفظ
                </Button>
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="اسم القاعدة"
                    rules={[{ required: true, message: 'يرجى إدخال اسم القاعدة' }]}
                >
                    <Input placeholder="مثال: إشعار إتمام الإصلاح" />
                </Form.Item>
                
                <Form.Item name="description" label="الوصف">
                    <Input.TextArea rows={2} />
                </Form.Item>
                
                <Form.Item
                    name="ruleType"
                    label="نوع القاعدة"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="event_based">بناءً على الأحداث</Select.Option>
                        <Select.Option value="time_based">بناءً على الوقت</Select.Option>
                        <Select.Option value="condition_based">بناءً على الشروط</Select.Option>
                        <Select.Option value="workflow_based">بناءً على سير العمل</Select.Option>
                    </Select>
                </Form.Item>
                
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                        prevValues.ruleType !== currentValues.ruleType
                    }
                >
                    {({ getFieldValue }) => {
                        const ruleType = getFieldValue('ruleType');
                        
                        if (ruleType === 'event_based') {
                            return (
                                <>
                                    <Form.Item name="triggerEvent" label="الحدث المشغل">
                                        <Select>
                                            <Select.Option value="repair_completed">إتمام الإصلاح</Select.Option>
                                            <Select.Option value="payment_received">استلام الدفع</Select.Option>
                                            <Select.Option value="invoice_created">إنشاء فاتورة</Select.Option>
                                            {/* المزيد من الأحداث */}
                                        </Select>
                                    </Form.Item>
                                    
                                    <Form.Item name="triggerModule" label="الموديول">
                                        <Select>
                                            <Select.Option value="repairs">الإصلاحات</Select.Option>
                                            <Select.Option value="finance">المالية</Select.Option>
                                            <Select.Option value="inventory">المخزون</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </>
                            );
                        }
                        
                        if (ruleType === 'time_based') {
                            return (
                                <>
                                    <Form.Item name="scheduleType" label="نوع الجدولة">
                                        <Select>
                                            <Select.Option value="daily">يومي</Select.Option>
                                            <Select.Option value="weekly">أسبوعي</Select.Option>
                                            <Select.Option value="monthly">شهري</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    
                                    <Form.Item name={['scheduleConfig', 'time']} label="الوقت">
                                        <Input type="time" />
                                    </Form.Item>
                                </>
                            );
                        }
                        
                        return null;
                    }}
                </Form.Item>
                
                <Tabs>
                    <Tabs.TabPane tab="الشروط" key="conditions">
                        <ConditionBuilder form={form} />
                    </Tabs.TabPane>
                    
                    <Tabs.TabPane tab="الإجراءات" key="actions">
                        <ActionBuilder form={form} />
                    </Tabs.TabPane>
                </Tabs>
                
                <Form.Item name="priority" label="الأولوية">
                    <Input type="number" min={0} max={100} defaultValue={0} />
                </Form.Item>
                
                <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="نشط" unCheckedChildren="معطل" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RuleFormModal;
```

### 2.3 Action Builder Component

```javascript
// components/ActionBuilder.js
import React from 'react';
import { Form, Button, Select, Input, InputNumber, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const ActionBuilder = ({ form }) => {
    const actions = Form.useWatch('actions', form) || [];
    
    const addAction = () => {
        const currentActions = form.getFieldValue('actions') || [];
        form.setFieldsValue({
            actions: [...currentActions, {
                type: 'send_notification',
                channel: 'whatsapp',
                template: '',
                delay: 0
            }]
        });
    };
    
    const removeAction = (index) => {
        const currentActions = form.getFieldValue('actions') || [];
        currentActions.splice(index, 1);
        form.setFieldsValue({ actions: currentActions });
    };
    
    return (
        <div>
            {actions.map((action, index) => (
                <Card key={index} style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            name={[index, 'type']}
                            label="نوع الإجراء"
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Select.Option value="send_notification">إرسال إشعار</Select.Option>
                                <Select.Option value="create_task">إنشاء مهمة</Select.Option>
                                <Select.Option value="update_status">تحديث الحالة</Select.Option>
                                <Select.Option value="create_interaction">إنشاء تفاعل</Select.Option>
                            </Select>
                        </Form.Item>
                        
                        {action.type === 'send_notification' && (
                            <>
                                <Form.Item
                                    name={[index, 'channel']}
                                    label="القناة"
                                    rules={[{ required: true }]}
                                >
                                    <Select>
                                        <Select.Option value="whatsapp">WhatsApp</Select.Option>
                                        <Select.Option value="email">Email</Select.Option>
                                        <Select.Option value="sms">SMS</Select.Option>
                                    </Select>
                                </Form.Item>
                                
                                <Form.Item
                                    name={[index, 'template']}
                                    label="القالب"
                                    rules={[{ required: true }]}
                                >
                                    <Select placeholder="اختر القالب">
                                        {/* سيتم تحميل القوالب من API */}
                                    </Select>
                                </Form.Item>
                            </>
                        )}
                        
                        <Form.Item
                            name={[index, 'delay']}
                            label="التأخير (بالثواني)"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeAction(index)}
                        >
                            حذف الإجراء
                        </Button>
                    </Space>
                </Card>
            ))}
            
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addAction}
                block
            >
                إضافة إجراء
            </Button>
        </div>
    );
};

export default ActionBuilder;
```

---

## 📝 Templates Management

### 3.1 صفحة إدارة القوالب: `TemplatesPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select,
    Tag, Space, message, Tabs
} from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';

const TemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    
    useEffect(() => {
        fetchTemplates();
    }, []);
    
    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/automation/templates');
            setTemplates(response.data.data);
        } catch (error) {
            message.error('فشل تحميل القوالب');
        } finally {
            setLoading(false);
        }
    };
    
    const handlePreview = async (template) => {
        try {
            const response = await api.post(`/automation/templates/${template.id}/preview`, {
                variables: {
                    customerName: 'أحمد محمد',
                    repairId: '12345',
                    deviceModel: 'iPhone 13'
                }
            });
            setPreviewData(response.data.data);
            setPreviewVisible(true);
        } catch (error) {
            message.error('فشل معاينة القالب');
        }
    };
    
    const columns = [
        {
            title: 'الاسم',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'الكود',
            dataIndex: 'code',
            key: 'code'
        },
        {
            title: 'الفئة',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <Tag>{category}</Tag>
        },
        {
            title: 'القنوات',
            dataIndex: 'channels',
            key: 'channels',
            render: (channels) => {
                const channelList = JSON.parse(channels || '[]');
                return (
                    <Space>
                        {channelList.map(ch => (
                            <Tag key={ch}>{ch}</Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'الإجراءات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                    >
                        معاينة
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                    >
                        تعديل
                    </Button>
                </Space>
            )
        }
    ];
    
    return (
        <div className="templates-page">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>قوالب الإشعارات</h2>
                <Button type="primary" icon={<PlusOutlined />}>
                    قالب جديد
                </Button>
            </div>
            
            <Table
                columns={columns}
                dataSource={templates}
                loading={loading}
                rowKey="id"
            />
            
            <Modal
                title="معاينة القالب"
                visible={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={600}
            >
                {previewData && (
                    <div>
                        <h4>الموضوع:</h4>
                        <p>{previewData.subject}</p>
                        <h4>المحتوى:</h4>
                        <div dangerouslySetInnerHTML={{ __html: previewData.message }} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TemplatesPage;
```

---

## 📊 Logs & Monitoring

### 4.1 صفحة السجلات: `AutomationLogsPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
    Table, Card, Statistic, Row, Col,
    DatePicker, Select, Tag, Space
} from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const AutomationLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: [moment().subtract(7, 'days'), moment()],
        status: null,
        channel: null
    });
    
    useEffect(() => {
        fetchLogs();
    }, [filters]);
    
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: filters.dateRange[0].format('YYYY-MM-DD'),
                endDate: filters.dateRange[1].format('YYYY-MM-DD'),
                status: filters.status,
                channel: filters.channel
            };
            
            const response = await api.get('/automation/notifications', { params });
            setLogs(response.data.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const columns = [
        {
            title: 'التاريخ',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'القناة',
            dataIndex: 'channel',
            key: 'channel',
            render: (channel) => {
                const colors = {
                    whatsapp: 'green',
                    email: 'blue',
                    sms: 'orange',
                    push: 'purple'
                };
                return <Tag color={colors[channel]}>{channel}</Tag>;
            }
        },
        {
            title: 'المستلم',
            dataIndex: 'recipientContact',
            key: 'recipientContact'
        },
        {
            title: 'الحالة',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    sent: 'success',
                    delivered: 'processing',
                    failed: 'error',
                    pending: 'default'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            }
        },
        {
            title: 'الرسالة',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true
        }
    ];
    
    return (
        <div className="automation-logs-page">
            <Card>
                <Row gutter={16}>
                    <Col span={6}>
                        <Statistic title="إجمالي الإشعارات" value={logs.length} />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="المرسلة"
                            value={logs.filter(l => l.status === 'sent').length}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="الفاشلة"
                            value={logs.filter(l => l.status === 'failed').length}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="معدل النجاح"
                            value={((logs.filter(l => l.status === 'sent').length / logs.length) * 100).toFixed(1)}
                            suffix="%"
                        />
                    </Col>
                </Row>
            </Card>
            
            <Card
                title="سجل الإشعارات"
                extra={
                    <Space>
                        <DatePicker.RangePicker
                            value={filters.dateRange}
                            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                        />
                        <Select
                            placeholder="الحالة"
                            allowClear
                            style={{ width: 120 }}
                            onChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <Select.Option value="sent">مرسلة</Select.Option>
                            <Select.Option value="failed">فاشلة</Select.Option>
                            <Select.Option value="pending">معلقة</Select.Option>
                        </Select>
                    </Space>
                }
                style={{ marginTop: 16 }}
            >
                <Table
                    columns={columns}
                    dataSource={logs}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                />
            </Card>
        </div>
    );
};

export default AutomationLogsPage;
```

---

## ⚙️ Settings & Configuration

### 5.1 صفحة الإعدادات: `AutomationSettingsPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
    Card, Form, Switch, Input, Button,
    Tabs, message, Divider
} from 'antd';
import api from '../../services/api';

const AutomationSettingsPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    
    useEffect(() => {
        fetchSettings();
    }, []);
    
    const fetchSettings = async () => {
        try {
            const response = await api.get('/automation/settings');
            setSettings(response.data.data);
            form.setFieldsValue(response.data.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };
    
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await api.put('/automation/settings', values);
            message.success('تم حفظ الإعدادات بنجاح');
        } catch (error) {
            message.error('فشل حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="automation-settings-page">
            <Card
                title="إعدادات الأوتوميشن"
                extra={
                    <Button type="primary" loading={loading} onClick={handleSave}>
                        حفظ
                    </Button>
                }
            >
                <Form form={form} layout="vertical">
                    <Tabs>
                        <Tabs.TabPane tab="عام" key="general">
                            <Form.Item
                                name="automationEnabled"
                                valuePropName="checked"
                                label="تفعيل الأوتوميشن"
                            >
                                <Switch />
                            </Form.Item>
                            
                            <Form.Item
                                name="maxRetries"
                                label="عدد المحاولات الأقصى"
                            >
                                <Input type="number" min={1} max={10} />
                            </Form.Item>
                            
                            <Form.Item
                                name="retryDelay"
                                label="التأخير بين المحاولات (بالثواني)"
                            >
                                <Input type="number" min={1} />
                            </Form.Item>
                        </Tabs.TabPane>
                        
                        <Tabs.TabPane tab="WhatsApp" key="whatsapp">
                            <Form.Item
                                name="whatsappEnabled"
                                valuePropName="checked"
                                label="تفعيل WhatsApp"
                            >
                                <Switch />
                            </Form.Item>
                            
                            <Form.Item
                                name="whatsappApiUrl"
                                label="API URL"
                            >
                                <Input placeholder="https://api.whatsapp.com" />
                            </Form.Item>
                            
                            <Form.Item
                                name="whatsappApiKey"
                                label="API Key"
                            >
                                <Input.Password />
                            </Form.Item>
                        </Tabs.TabPane>
                        
                        <Tabs.TabPane tab="Email" key="email">
                            <Form.Item
                                name="emailEnabled"
                                valuePropName="checked"
                                label="تفعيل Email"
                            >
                                <Switch />
                            </Form.Item>
                            
                            <Form.Item
                                name="smtpHost"
                                label="SMTP Host"
                            >
                                <Input />
                            </Form.Item>
                            
                            <Form.Item
                                name="smtpPort"
                                label="SMTP Port"
                            >
                                <Input type="number" />
                            </Form.Item>
                            
                            <Form.Item
                                name="smtpUser"
                                label="SMTP User"
                            >
                                <Input />
                            </Form.Item>
                            
                            <Form.Item
                                name="smtpPassword"
                                label="SMTP Password"
                            >
                                <Input.Password />
                            </Form.Item>
                        </Tabs.TabPane>
                    </Tabs>
                </Form>
            </Card>
        </div>
    );
};

export default AutomationSettingsPage;
```

---

**الجزء التالي:** [التكامل مع الموديولات](./04_AUTOMATION_INTEGRATION.md)


