'use client';

import dynamic from 'next/dynamic';

const CookieComponent = dynamic(() => import('@/components/tools/CookieDashboard'), { ssr: false });

export default function CookiePage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Cookie Dashboard
                </h1>
                <p className="text-text-muted">
                    Parse and visualize 1000xxx, 6154xxx cookie files with interactive charts.
                </p>
            </div>
            <div className="mt-4">
                <CookieComponent />
            </div>
        </div>
    );
}
