'use client';

import CookieDashboard from '@/components/tools/CookieDashboard';

export default function CookieDashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Cookie Dashboard
                </h1>
                <p className="text-text-muted">
                    Parse pipe-delimited cookie files, filter by ID series (e.g., 1000xxx, 6154xxx), and export to Excel.
                </p>
            </div>
            <div className="mt-4">
                <CookieDashboard />
            </div>
        </div>
    );
}
