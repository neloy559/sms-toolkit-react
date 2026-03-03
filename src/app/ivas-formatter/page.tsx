'use client';

import IvasFormatter from '@/components/tools/IvasFormatter';

export default function IvasFormatterPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    iVAS Formatter
                </h1>
                <p className="text-text-muted">
                    Process, sort, and export phone numbers by country code instantly. Generate routing parameters and API endpoint configurations for premium rate endpoints.
                </p>
            </div>
            <div className="mt-4">
                <IvasFormatter />
            </div>
        </div>
    );
}
