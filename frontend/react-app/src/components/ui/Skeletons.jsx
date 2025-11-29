import React from 'react';
import { Skeleton } from "./skeleton";

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between py-4">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
            <div className="rounded-md border">
                <div className="h-12 border-b px-4 flex items-center gap-4">
                    {Array(columns).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                    ))}
                </div>
                {Array(rows).fill(0).map((_, i) => (
                    <div key={i} className="h-16 border-b px-4 flex items-center gap-4 last:border-0">
                        {Array(columns).fill(0).map((_, j) => (
                            <Skeleton key={j} className="h-4 w-full" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-col space-y-3">
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
