import React, { useState } from 'react';
import {
    Search,
    Filter,
    Calendar,
    SortAsc,
    SortDesc,
    X,
    ChevronDown
} from 'lucide-react';

/**
 * RepairFiltersAdvanced - Advanced filtering for repairs list
 * 
 * Features:
 * - Status filter with badges
 * - Date range picker
 * - Sort options
 * - Search input
 * - Mobile-friendly collapsible
 */

const statusOptions = [
    { id: 'all', label: 'الكل', color: '#6B7280' },
    { id: 'pending', label: 'قيد الانتظار', color: '#F59E0B' },
    { id: 'in_progress', label: 'قيد التنفيذ', color: '#3B82F6' },
    { id: 'waiting-parts', label: 'بانتظار قطع غيار', color: '#F97316' },
    { id: 'ready-for-pickup', label: 'جاهز للاستلام', color: '#10B981' },
    { id: 'completed', label: 'مكتمل', color: '#059669' },
    { id: 'delivered', label: 'تم التسليم', color: '#047857' },
    { id: 'cancelled', label: 'ملغي', color: '#EF4444' }
];

const sortOptions = [
    { id: 'newest', label: 'الأحدث أولاً', icon: SortDesc },
    { id: 'oldest', label: 'الأقدم أولاً', icon: SortAsc },
    { id: 'status', label: 'حسب الحالة', icon: Filter }
];

export default function RepairFiltersAdvanced({
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    dateRange,
    onDateRangeChange,
    stats = {}
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Search is already handled by onChange
    };

    const clearFilters = () => {
        onFilterChange('all');
        onSearchChange('');
        onSortChange('newest');
        if (onDateRangeChange) {
            onDateRangeChange({ start: '', end: '' });
        }
    };

    const hasActiveFilters = activeFilter !== 'all' || searchQuery || (dateRange?.start || dateRange?.end);

    return (
        <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="ابحث برقم الطلب أو نوع الجهاز..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </form>

            {/* Filter Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Status Filters (Desktop) */}
                <div className="hidden md:flex flex-wrap items-center gap-2 flex-1">
                    {statusOptions.map((status) => {
                        const count = status.id === 'all' 
                            ? stats.totalRepairs 
                            : stats[`${status.id.replace('-', '')}Repairs`] || 0;
                        const isActive = activeFilter === status.id;
                        
                        return (
                            <button
                                key={status.id}
                                onClick={() => onFilterChange(status.id)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium
                                    transition-all duration-200
                                    ${isActive 
                                        ? 'text-white shadow-md scale-105' 
                                        : 'bg-muted text-foreground hover:bg-muted/80'
                                    }
                                `}
                                style={{
                                    backgroundColor: isActive ? status.color : undefined
                                }}
                            >
                                {status.label}
                                {count > 0 && (
                                    <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                                        isActive ? 'bg-white/30' : 'bg-border'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="md:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl bg-muted text-foreground"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <span>تصفية النتائج</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-brand-blue" />
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                        {sortOptions.find(s => s.id === sortBy)?.icon && (
                            React.createElement(sortOptions.find(s => s.id === sortBy).icon, { className: "w-4 h-4" })
                        )}
                        <span className="hidden sm:inline">
                            {sortOptions.find(s => s.id === sortBy)?.label || 'ترتيب'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showSortDropdown && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                            <div className="absolute left-0 top-full mt-2 w-48 bg-card rounded-xl shadow-xl border border-border z-20 overflow-hidden">
                                {sortOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                onSortChange(option.id);
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-right hover:bg-muted transition-colors ${
                                                sortBy === option.id ? 'bg-brand-blue/10 text-brand-blue' : 'text-foreground'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                        مسح الفلاتر
                    </button>
                )}
            </div>

            {/* Mobile Expanded Filters */}
            {isExpanded && (
                <div className="md:hidden space-y-4 p-4 bg-muted/50 rounded-xl animate-in slide-in-from-top duration-200">
                    {/* Status Filters */}
                    <div>
                        <p className="text-sm font-medium text-foreground mb-2">حالة الطلب</p>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => {
                                const isActive = activeFilter === status.id;
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => onFilterChange(status.id)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-sm font-medium
                                            transition-all duration-200
                                            ${isActive 
                                                ? 'text-white' 
                                                : 'bg-card text-foreground border border-border'
                                            }
                                        `}
                                        style={{
                                            backgroundColor: isActive ? status.color : undefined
                                        }}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    {onDateRangeChange && (
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">نطاق التاريخ</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">من</label>
                                    <input
                                        type="date"
                                        value={dateRange?.start || ''}
                                        onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">إلى</label>
                                    <input
                                        type="date"
                                        value={dateRange?.end || ''}
                                        onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

