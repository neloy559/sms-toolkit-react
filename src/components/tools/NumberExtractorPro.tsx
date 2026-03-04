'use client';

import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, Download, Copy, AlertCircle } from 'lucide-react';

const COUNTRY_PREFIXES: Record<string, { code: string; name: string }> = {
    '880': { code: 'BD', name: 'Bangladesh' },
    '60': { code: 'MY', name: 'Malaysia' },
    '63': { code: 'PH', name: 'Philippines' },
    '966': { code: 'SA', name: 'Saudi Arabia' },
    '971': { code: 'AE', name: 'United Arab Emirates' },
    '65': { code: 'SG', name: 'Singapore' },
    '91': { code: 'IN', name: 'India' },
    '92': { code: 'PK', name: 'Pakistan' },
    '94': { code: 'LK', name: 'Sri Lanka' },
    '44': { code: 'GB', name: 'United Kingdom' },
    '1': { code: 'US', name: 'United States' },
};

export default function NumberExtractorPro() {
    const [isDragging, setIsDragging] = useState(false);
    const [extractedNumbers, setExtractedNumbers] = useState<string[]>([]);
    const [groupedNumbers, setGroupedNumbers] = useState<Record<string, string[]>>({});
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processTextData = (text: string) => {
        // Regex matches global format considering optional '+' and capturing the digits
        const pattern = /(?:\+?)[1-9]\d{6,14}/g;
        const matches = text.match(pattern) || [];
        // Clean to strict digits
        const pureNumbers = matches.map(n => n.replace(/\D/g, ''));
        processPureNumbers(Array.from(new Set(pureNumbers)));
    };

    const processPureNumbers = (numbers: string[]) => {
        setExtractedNumbers(numbers);

        // Group country wise
        const groups: Record<string, string[]> = { Unknown: [] };

        numbers.forEach((num) => {
            let matched = false;
            // Sort prefixes length descending to match country codes properly (e.g. 966 vs 9)
            const prefixes = Object.keys(COUNTRY_PREFIXES).sort((a, b) => b.length - a.length);

            for (const prefix of prefixes) {
                if (num.startsWith(prefix)) {
                    const cName = COUNTRY_PREFIXES[prefix].name;
                    if (!groups[cName]) groups[cName] = [];
                    groups[cName].push(num);
                    matched = true;
                    break;
                }
            }
            if (!matched) groups.Unknown.push(num);
        });

        if (groups.Unknown.length === 0) delete groups.Unknown;
        setGroupedNumbers(groups);
        setSuccessMsg(`Successfully extracted ${numbers.length} unique numbers.`);
        setTimeout(() => setSuccessMsg(''), 5000);
    };

    const handleFileUpload = (files: FileList) => {
        if (!files || files.length === 0) return;
        setError('');
        
        const processFile = (file: File): Promise<string[]> => {
            return new Promise((resolve) => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                
                if (ext === 'xlsx' || ext === 'xls') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = new Uint8Array(e.target?.result as ArrayBuffer);
                            const wb = XLSX.read(data, { type: 'array' });
                            const allNumbers: string[] = [];

                            wb.SheetNames.forEach(name => {
                                const sheet = wb.Sheets[name];
                                // @ts-ignore
                                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                                let numColIdx = -1;
                                for (let i = 0; i < Math.min(rows.length, 20); i++) {
                                    const row = rows[i];
                                    if (!row) continue;

                                    const idx = row.findIndex((cell: any) =>
                                        cell && String(cell).trim().toLowerCase().includes('number')
                                    );

                                    if (idx !== -1) {
                                        numColIdx = idx;
                                        for (let j = i + 1; j < rows.length; j++) {
                                            const r = rows[j];
                                            if (r && r[numColIdx]) {
                                                const rawStr = String(r[numColIdx]).trim();
                                                const cleanNum = rawStr.replace(/\D/g, '');
                                                if (cleanNum.length > 5) allNumbers.push(cleanNum);
                                            }
                                        }
                                        break;
                                    }
                                }
                            });
                            resolve(allNumbers);
                        } catch { resolve([]); }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const text = e.target?.result as string;
                        const pattern = /(?:\+?)[1-9]\d{6,14}/g;
                        const matches = text.match(pattern) || [];
                        const pureNumbers = matches.map(n => n.replace(/\D/g, ''));
                        resolve(pureNumbers);
                    };
                    reader.readAsText(file);
                }
            });
        };
        
        Promise.all(Array.from(files).map(processFile)).then(results => {
            const allNumbers = Array.from(new Set(results.flat()));
            if (allNumbers.length === 0) {
                setError('No valid phone numbers found in any of the uploaded files.');
            } else {
                processPureNumbers(allNumbers);
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccessMsg('Copied to clipboard!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const downloadGroup = (countryName: string, numbers: string[]) => {
        const textData = numbers.join('\n');
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${countryName}_${numbers.length}_Numbers.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            {/* Upload Zone */}
            <div
                className={`glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand/5' : 'border-border hover:border-text-muted hover:bg-surface-hover'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles?.length > 0) handleFileUpload(droppedFiles);
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                <p className="text-xl font-medium">Drag & Drop Multiple Files</p>
                <p className="text-sm text-text-muted mt-2">Supports .xlsx, .xls, .csv, .txt, .log — Multiple files allowed</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.length) handleFileUpload(e.target.files);
                    }}
                    accept=".txt,.csv,.log,.xlsx,.xls"
                    multiple
                />
            </div>

            {error && (
                <div className="p-4 bg-red-900/30 border border-red-500 rounded-xl flex items-center gap-3 text-red-200">
                    <AlertCircle size={20} className="text-red-500" /> {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-900/30 border border-green-500 rounded-xl flex items-center gap-3 text-green-200">
                    <CheckCircle size={20} className="text-green-500" /> {successMsg}
                </div>
            )}

            {/* Results View */}
            {extractedNumbers.length > 0 && (
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                        <h2 className="text-xl font-bold">Extraction Results</h2>
                        <div className="text-brand font-medium">Total Unique: {extractedNumbers.length}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(groupedNumbers).map(([country, numbers]) => (
                            <div key={country} className="bg-background rounded-xl p-4 border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">{country}</span>
                                        <span className="text-xs bg-surface-hover px-2 py-1 rounded-md text-text-muted">{numbers.length} qty</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyToClipboard(numbers.join('\n'))} className="p-2 hover:bg-surface hover:text-brand rounded-lg transition-colors" title="Copy">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={() => downloadGroup(country, numbers)} className="p-2 hover:bg-surface hover:text-brand rounded-lg transition-colors" title="Download TXT">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="input-field h-32 font-mono text-sm resize-none bg-surface"
                                    readOnly
                                    value={numbers.join('\n')}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
