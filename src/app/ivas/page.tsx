'use client';

import dynamic from 'next/dynamic';

const IvasComponent = dynamic(() => import('@/components/tools/IvasFormatter'), { ssr: false });

export default function IvasPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    iVAS Formatter
                </h1>
                <p className="text-text-muted">
                    Premium rate SMS generation and routing parameters formatting.
                </p>
            </div>
            <div className="mt-4">
                <IvasComponent />
            </div>
        </div>
    );
}
