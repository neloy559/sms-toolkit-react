'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, AlertTriangle, FileCode2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CookieDashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<{ total: number, good: number, bad: number, domains: Record<string, number> } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processCookieData = (text: string) => {
        // Very simple mockup of Cookie file regex/split logic based on common formatting.
        // E.g., tab separated: domain \t flags \t path \t secure \t expiration \t name \t value
        const lines = text.split('\n').filter(l => l.trim().length > 10);
        const domains: Record<string, number> = {};
        let good = 0;

        lines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 7) {
                good++;
                let domain = parts[0].replace(/^\./, '');
                domains[domain] = (domains[domain] || 0) + 1;
            }
        });

        setAnalyzedData({
            total: lines.length,
            good,
            bad: lines.length - good,
            domains: domains
        });
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            processCookieData(e.target?.result as string);
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8">
            {!analyzedData ? (
                <div
                    className={`glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-[#00ccff] bg-[#00ccff]/5' : 'border-border hover:border-text-muted hover:bg-surface-hover'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.length > 0) handleFileUpload(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileCode2 size={48} className={`mb-4 ${isDragging ? 'text-[#00ccff]' : 'text-text-muted'}`} />
                    <p className="text-xl font-medium">Drop Cookie File Structure (Netscape format)</p>
                    <p className="text-sm text-text-muted mt-2">Analyzes domain distribution and validity.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                        accept=".txt"
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Total Cookies</p>
                            <p className="text-3xl font-bold">{analyzedData.total}</p>
                        </div>
                        <div className="glass-panel p-6 border-l-4 border-l-green-500">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Valid Format</p>
                            <p className="text-3xl font-bold">{analyzedData.good}</p>
                        </div>
                        <div className="glass-panel p-6 border-l-4 border-l-yellow-500">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                                <AlertTriangle size={14} /> Corrupted Lines
                            </p>
                            <p className="text-3xl font-bold">{analyzedData.bad}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                            <h2 className="text-xl font-bold">Domain Spread</h2>
                            <button onClick={() => setAnalyzedData(null)} className="text-text-muted hover:text-white transition-colors text-sm">
                                Reset Tool
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                            {Object.entries(analyzedData.domains)
                                .sort((a, b) => b[1] - a[1])
                                .map(([domain, count]) => (
                                    <div key={domain} className="bg-background rounded-lg p-3 border border-border flex justify-between items-center">
                                        <span className="font-mono text-sm truncate max-w-[70%]">{domain}</span>
                                        <span className="bg-surface-hover px-2 py-0.5 rounded text-xs text-brand font-bold">{count}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
