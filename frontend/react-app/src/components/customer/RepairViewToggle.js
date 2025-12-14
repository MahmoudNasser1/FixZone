import React from 'react';
import { LayoutGrid, List, Clock } from 'lucide-react';

/**
 * RepairViewToggle - Switch between grid, list, and timeline views
 * 
 * Features:
 * - Three view modes
 * - Animated transitions
 * - Saves preference
 */

const viewOptions = [
    { id: 'grid', icon: LayoutGrid, label: 'شبكة' },
    { id: 'list', icon: List, label: 'قائمة' },
    { id: 'timeline', icon: Clock, label: 'زمني' }
];

export default function RepairViewToggle({ activeView, onViewChange }) {
    return (
        <div className="flex items-center bg-muted rounded-xl p-1">
            {viewOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeView === option.id;
                
                return (
                    <button
                        key={option.id}
                        onClick={() => onViewChange(option.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200
                            ${isActive 
                                ? 'bg-card text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }
                        `}
                        title={option.label}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

