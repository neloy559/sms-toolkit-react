'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, FileText, FolderOpen, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface SplitResult {
    country: string;
    countryCode: string;
    numbers: string[];
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

function findPhoneColumn(headers: string[]): number {
    const phoneKeywords = ['phone', 'number', 'tel', 'mobile', 'cell', 'contact'];
    
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().replace(/[^a-z]/g, '');
        if (phoneKeywords.some(kw => header.includes(kw))) {
            return i;
        }
    }
    return 0;
}

export default function PhoneSplitter() {
    const [isDragging, setIsDragging] = useState(false);
    const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
    const [totalNumbers, setTotalNumbers] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let phoneNumbers: string[] = [];
        
        if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
            
            if (jsonData.length > 0) {
                const headers = jsonData[0].map(String);
                const phoneColIndex = findPhoneColumn(headers);
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row[phoneColIndex]) {
                        const cleaned = String(row[phoneColIndex]).replace(/\D/g, '');
                        if (cleaned.length >= 8) {
                            phoneNumbers.push(cleaned);
                        }
                    }
                }
            }
        } else {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            
            for (const line of lines) {
                const cleaned = line.trim().replace(/\D/g, '');
                if (cleaned.length >= 8) {
                    phoneNumbers.push(cleaned);
                }
            }
        }
        
        const uniqueNumbers = [...new Set(phoneNumbers)];
        setTotalNumbers(uniqueNumbers.length);
        
        const countryMap = new Map<string, string[]>();
        
        for (const num of uniqueNumbers) {
            const code = detectCountryCode(num);
            if (!countryMap.has(code)) {
                countryMap.set(code, []);
            }
            countryMap.get(code)!.push(num);
        }
        
        const results: SplitResult[] = [];
        
        countryMap.forEach((numbers, code) => {
            const countryInfo = countryData[code] || { code: 'XX', name: 'Unknown' };
            results.push({
                country: countryInfo.name,
                countryCode: code,
                numbers,
                count: numbers.length
            });
        });
        
        results.sort((a, b) => b.count - a.count);
        setSplitResults(results);
    };

    const handleFileUpload = (file: File) => {
        processFile(file);
    };

    const downloadFile = (result: SplitResult) => {
        const content = result.numbers.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.countryCode}_${result.country.replace(/\s/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAllAsZip = async () => {
        const zip = new JSZip();
        
        for (const result of splitResults) {
            const content = result.numbers.join('\n');
            zip.file(`${result.countryCode}_${result.country.replace(/\s/g, '_')}.txt`, content);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'split_by_country.zip';
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetTool = () => {
        setSplitResults([]);
        setTotalNumbers(0);
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
                    <p className="text-xl font-medium">Drop File to Split by Country</p>
                    <p className="text-sm text-text-muted mt-2">Detects country codes and splits into separate files</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                        accept=".xlsx,.xls,.txt,.csv"
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="glass-panel px-6 py-3">
                            <p className="text-text-muted text-xs uppercase tracking-wider">Total Numbers</p>
                            <p className="font-bold text-2xl">{totalNumbers}</p>
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
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {result.numbers.slice(0, 3).map((num, j) => (
                                        <span key={j} className="text-xs text-text-muted font-mono bg-surface-hover px-2 py-1 rounded">
                                            {num.substring(0, 12)}...
                                        </span>
                                    ))}
                                    {result.numbers.length > 3 && (
                                        <span className="text-xs text-text-muted">+{result.numbers.length - 3} more</span>
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
