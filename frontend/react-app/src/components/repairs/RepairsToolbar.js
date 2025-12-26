import React, { useRef, useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Download,
    RefreshCw,
    Filter,
    ArrowUpDown,
    ChevronDown,
    Wifi,
    WifiOff,
    Check,
    X,
    SlidersHorizontal,
    MoreVertical,
    Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';

const RepairsToolbar = ({
    search,
    setSearch,
    searchField,
    setSearchField,
    searchFieldOptions,
    handleRefresh,
    sortBy,
    setSortBy,
    sortFields,
    showAdvancedFilters,
    setShowAdvancedFilters,
    wsStatus,
    handleExportFiltered,
    handleImportClick
}) => {
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setShowSortMenu(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-xl border border-border shadow-sm">

                {/* Left Side: Search & Filter */}
                <div className="flex flex-1 w-full md:w-auto gap-2 items-center">
                    <div className="relative flex-1 max-w-lg flex items-center gap-2">
                        {/* Search Field Select */}
                        <div className="relative min-w-[140px] hidden sm:block">
                            <select
                                value={searchField}
                                onChange={(e) => setSearchField(e.target.value)}
                                className="w-full h-10 text-sm border-0 bg-muted/50 rounded-lg px-3 pr-8 appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 hover:bg-muted transition-colors"
                            >
                                {searchFieldOptions.map(option => (
                                    <option key={option.key} value={option.key}>{option.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="بحث عن طلب إصلاح..."
                                className="w-full h-10 pr-10 pl-4 bg-muted/30 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <SimpleButton
                            variant={showAdvancedFilters ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setShowAdvancedFilters(v => !v)}
                            className={`h-10 w-10 shrink-0 rounded-lg border border-transparent ${showAdvancedFilters ? 'bg-primary/10 text-primary border-primary/20' : 'hover:bg-muted'}`}
                            title="فلاتر متقدمة"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </SimpleButton>
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex w-full md:w-auto items-center justify-end gap-2">
                    {/* WebSocket Status */}
                    <div className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-full ${wsStatus === 'connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`} title={wsStatus === 'connected' ? 'متصل' : 'غير متصل'}>
                        {wsStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>

                    <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

                    {/* Refresh */}
                    <SimpleButton
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        title="تحديث"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </SimpleButton>

                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortMenuRef}>
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSortMenu(v => !v)}
                            className="h-9 px-3 gap-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline-block">
                                {sortFields.find(f => f.key === sortBy)?.label || 'ترتيب'}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </SimpleButton>

                        {showSortMenu && (
                            <div className="absolute left-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg border border-border shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1 space-y-0.5">
                                    {sortFields.map((f) => (
                                        <button
                                            key={f.key}
                                            onClick={() => { setSortBy(f.key); setShowSortMenu(false); }}
                                            className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                        ${sortBy === f.key
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-muted text-foreground/80'}
                      `}
                                        >
                                            <span>{f.label}</span>
                                            {sortBy === f.key && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* More Actions Dropdown */}
                    <div className="relative" ref={moreMenuRef}>
                        <SimpleButton
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMoreMenu(v => !v)}
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            title="خيارات إضافية"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </SimpleButton>

                        {showMoreMenu && (
                            <div className="absolute left-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg border border-border shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={() => { handleExportFiltered(); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-foreground/80"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>تصدير البيانات</span>
                                    </button>
                                    <button
                                        onClick={() => { handleImportClick(); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-foreground/80"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>استيراد بيانات</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* New Request Button */}
                    <Link to="/repairs/new">
                        <SimpleButton className="h-9 px-4 shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="w-4 h-4 ml-2" />
                            <span className="font-semibold text-sm">طلب جديد</span>
                        </SimpleButton>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default RepairsToolbar;
