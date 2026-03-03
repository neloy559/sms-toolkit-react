'use client';

import dynamic from 'next/dynamic';

const SmsCdrComponent = dynamic(() => import('@/components/tools/SmsCdrPro'), { ssr: false });

export default function SmsCdrPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    SMS CDR Pro
                </h1>
                <p className="text-text-muted">
                    Process Phone|OTP combinations, identify counts, and detect top country stats.
                </p>
            </div>
            <div className="mt-4">
                <SmsCdrComponent />
            </div>
        </div>
    );
}
