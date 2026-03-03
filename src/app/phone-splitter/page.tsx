'use client';

import PhoneSplitter from '@/components/tools/PhoneSplitter';

export default function PhoneSplitterPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Phone Splitter
                </h1>
                <p className="text-text-muted">
                    Detect country codes and split phone numbers into separate files by country.
                </p>
            </div>
            <div className="mt-4">
                <PhoneSplitter />
            </div>
        </div>
    );
}
