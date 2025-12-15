import React from 'react';
import { Search, Filter } from 'lucide-react';

/**
 * 🔍 Repair Filters Component
 * 
 * المميزات:
 * - Tabs للحالات
 * - Search bar
 * - Active indicator
 */

export default function RepairFilters({
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
    stats
}) {
    const filters = [
        { id: 'all', label: 'الكل', count: stats?.totalRepairs || 0 },
        { id: 'pending', label: 'قيد الانتظار', count: stats?.pendingRepairs || 0 },
        { id: 'in_progress', label: 'قيد التنفيذ', count: stats?.activeRepairs || 0 },
        { id: 'completed', label: 'مكتمل', count: stats?.completedRepairs || 0 },
        { id: 'cancelled', label: 'ملغي', count: stats?.cancelledRepairs || 0 }
    ];

    return (
        <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="ابحث برقم الطلب أو نوع الجهاز..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 transition-all"
                    style={{
                        borderColor: searchQuery ? '#053887' : '#D1D5DB'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#053887'}
                    onBlur={(e) => e.target.style.borderColor = searchQuery ? '#053887' : '#D1D5DB'}
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200"
                            style={{
                                background: activeFilter === filter.id
                                    ? 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
                                    : '#F3F4F6',
                                color: activeFilter === filter.id ? 'white' : '#374151',
                                transform: activeFilter === filter.id ? 'scale(1.05)' : 'scale(1)'
                            }}
                            onMouseEnter={(e) => {
                                if (activeFilter !== filter.id) {
                                    e.currentTarget.style.background = '#E5E7EB';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter !== filter.id) {
                                    e.currentTarget.style.background = '#F3F4F6';
                                }
                            }}
                        >
                            {filter.label}
                            {filter.count > 0 && (
                                <span
                                    className="mr-2 px-2 py-0.5 rounded-full text-xs font-bold"
                                    style={{
                                        background: activeFilter === filter.id ? 'rgba(255,255,255,0.3)' : '#D1D5DB',
                                        color: activeFilter === filter.id ? 'white' : '#374151'
                                    }}
                                >
                                    {filter.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
