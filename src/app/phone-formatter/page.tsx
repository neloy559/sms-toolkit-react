'use client';

import PhoneFormatter from '@/components/tools/PhoneFormatter';

export default function PhoneFormatterPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Phone Formatter
                </h1>
                <p className="text-text-muted">
                    Extract clean phone numbers from Excel/TXT files with smart column detection. Supports "Test Number" and other variations.
                </p>
            </div>
            <div className="mt-4">
                <PhoneFormatter />
            </div>
        </div>
    );
}
