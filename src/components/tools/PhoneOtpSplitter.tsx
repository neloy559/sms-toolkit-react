'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, FileText, FolderOpen, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';

interface OtpEntry {
    phone: string;
    otp: string;
    country: string;
    countryCode: string;
}

interface SplitResult {
    country: string;
    countryCode: string;
    entries: OtpEntry[];
    count: number;
}

const countryData: Record<string, { code: string; name: string }> = {
    '880': { code: 'BD', name: 'Bangladesh' },
    '1': { code: 'US', name: 'USA' },
    '44': { code: 'UK', name: 'UK' },
    '49': { code: 'DE', name: 'Germany' },
    '33': { code: 'FR', name: 'France' },
    '39': { code: 'IT', name: 'Italy' },
    '34': { code: 'ES', name: 'Spain' },
    '91': { code: 'IN', name: 'India' },
    '92': { code: 'PK', name: 'Pakistan' },
    '20': { code: 'EG', name: 'Egypt' },
    '234': { code: 'NG', name: 'Nigeria' },
    '254': { code: 'KE', name: 'Kenya' },
    '27': { code: 'ZA', name: 'South Africa' },
    '212': { code: 'MA', name: 'Morocco' },
    '216': { code: 'TN', name: 'Tunisia' },
    '971': { code: 'AE', name: 'UAE' },
    '966': { code: 'SA', name: 'Saudi Arabia' },
    '968': { code: 'OM', name: 'Oman' },
    '973': { code: 'BH', name: 'Bahrain' },
    '965': { code: 'KW', name: 'Kuwait' },
    '974': { code: 'QA', name: 'Qatar' },
};

function detectCountryCode(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    
    const prefixes = ['880', '234', '254', '212', '216', '971', '966', '968', '973', '965', '974', '92', '91', '44', '49', '33', '39', '34', '20', '27'];
    
    for (const prefix of prefixes) {
        if (clean.startsWith(prefix)) {
            return prefix;
        }
    }
    
    if (clean.startsWith('1') && clean.length >= 11) return '1';
    
    return 'unknown';
}

function parseOtpLine(line: string): OtpEntry | null {
    const trimmed = line.trim();
    if (!trimmed) return null;
    
    const parts = trimmed.split(/[|,;:\t]+/);
    
    if (parts.length >= 2) {
        const phone = parts[0].replace(/\D/g, '');
        const otp = parts[1].replace(/\D/g, '');
        
        if (phone.length >= 8 && otp.length >= 3 && otp.length <= 10) {
            const code = detectCountryCode(phone);
            const countryInfo = countryData[code] || { code: 'XX', name: 'Unknown' };
            
            return {
                phone,
                otp,
                country: countryInfo.name,
                countryCode: code
            };
        }
    }
    
    return null;
}

export default function PhoneOtpSplitter() {
    const [isDragging, setIsDragging] = useState(false);
    const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        const text = await file.text();
        const lines = text.split('\n');
        
        const entries: OtpEntry[] = [];
        
        for (const line of lines) {
            const entry = parseOtpLine(line);
            if (entry) {
                entries.push(entry);
            }
        }
        
        setTotalEntries(entries.length);
        
        const countryMap = new Map<string, OtpEntry[]>();
        
        for (const entry of entries) {
            const key = entry.countryCode;
            if (!countryMap.has(key)) {
                countryMap.set(key, []);
            }
            countryMap.get(key)!.push(entry);
        }
        
        const results: SplitResult[] = [];
        
        countryMap.forEach((countryEntries, code) => {
            const countryInfo = countryData[code] || { code: 'XX', name: 'Unknown' };
            results.push({
                country: countryInfo.name,
                countryCode: code,
                entries: countryEntries,
                count: countryEntries.length
            });
        });
        
        results.sort((a, b) => b.count - a.count);
        setSplitResults(results);
    };

    const handleFileUpload = (file: File) => {
        processFile(file);
    };

    const downloadFile = (result: SplitResult) => {
        const content = result.entries
            .map(e => `${e.phone}|${e.otp}`)
            .join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.countryCode}_${result.country.replace(/\s/g, '_')}_otp.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAllAsZip = async () => {
        const zip = new JSZip();
        
        for (const result of splitResults) {
            const content = result.entries
                .map(e => `${e.phone}|${e.otp}`)
                .join('\n');
            
            zip.file(`${result.countryCode}_${result.country.replace(/\s/g, '_')}_otp.txt`, content);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'otp_split_by_country.zip';
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetTool = () => {
        setSplitResults([]);
        setTotalEntries(0);
    };

    return (
        <div className="space-y-8">
            {!splitResults.length ? (
                <div
                    className={`glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand/5' : 'border-border hover:border-text-muted hover:bg-surface-hover'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.length > 0) handleFileUpload(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FolderOpen size={48} className={`mb-4 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                    <p className="text-xl font-medium">Drop Phone|OTP File</p>
                    <p className="text-sm text-text-muted mt-2">Format: phone|otp (one per line)</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                        accept=".txt,.csv"
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="glass-panel px-6 py-3">
                            <p className="text-text-muted text-xs uppercase tracking-wider">Total OTP Entries</p>
                            <p className="font-bold text-2xl">{totalEntries}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={downloadAllAsZip} className="btn-primary flex items-center gap-2">
                                <Download size={16} /> Download All (ZIP)
                            </button>
                            <button onClick={resetTool} className="btn-secondary">
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {splitResults.map((result, i) => (
                            <div key={i} className="glass-panel p-5 hover:border-brand/50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg">{result.country}</h3>
                                        <p className="text-text-muted text-sm">Code: +{result.countryCode}</p>
                                    </div>
                                    <div className="bg-brand/10 px-3 py-1 rounded-full">
                                        <span className="text-brand font-bold">{result.count}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 mb-4 max-h-24 overflow-y-auto">
                                    {result.entries.slice(0, 3).map((entry, j) => (
                                        <div key={j} className="text-xs text-text-muted font-mono bg-surface-hover px-2 py-1 rounded flex justify-between">
                                            <span>{entry.phone.substring(0, 10)}...</span>
                                            <span className="text-brand">{entry.otp}</span>
                                        </div>
                                    ))}
                                    {result.entries.length > 3 && (
                                        <span className="text-xs text-text-muted">+{result.entries.length - 3} more</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => downloadFile(result)}
                                    className="w-full btn-secondary flex items-center justify-center gap-2"
                                >
                                    <FileText size={14} /> Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
