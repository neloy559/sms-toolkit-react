'use client';

import PhoneOtpSplitter from '@/components/tools/PhoneOtpSplitter';

export default function PhoneOtpSplitterPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Phone OTP Splitter
                </h1>
                <p className="text-text-muted">
                    Split phone|OTP combination files by country. Download individual country files or export all as a ZIP archive.
                </p>
            </div>
            <div className="mt-4">
                <PhoneOtpSplitter />
            </div>
        </div>
    );
}
