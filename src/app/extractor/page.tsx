'use client';

import dynamic from 'next/dynamic';

const ExtractorComponent = dynamic(() => import('@/components/tools/NumberExtractorPro'), { ssr: false });

export default function ExtractorPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Number Extractor Pro
                </h1>
                <p className="text-text-muted">
                    Extract, filter, and country-split phone numbers from .txt, .csv, and .xlsx files.
                </p>
            </div>
            <div className="mt-4">
                <ExtractorComponent />
            </div>
        </div>
    );
}
