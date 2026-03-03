'use client';

import SmsCdrPro from '@/components/tools/SmsCdrPro';

export default function SmsCdrProPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    SMS CDR Pro
                </h1>
                <p className="text-text-muted">
                    Advanced analytics for SMS data. Filter by country, CLI, OTP length and visualize trends.
                </p>
            </div>
            <div className="mt-4">
                <SmsCdrPro />
            </div>
        </div>
    );
}
