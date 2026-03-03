'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProcessedNumber {
    original: string;
    cleaned: string;
    country: string;
    countryCode: string;
    valid: boolean;
}

const countryData: Record<string, { code: string; pattern: RegExp }> = {
    '880': { code: 'BD', pattern: /^8801[3-9]\d{8}$/ },
    '1': { code: 'US', pattern: /^1[2-9]\d{9}$/ },
    '44': { code: 'UK', pattern: /^447\d{9}$/ },
    '49': { code: 'DE', pattern: /^49[1-9]\d{10}$/ },
    '33': { code: 'FR', pattern: /^33[6-7]\d{8}$/ },
    '39': { code: 'IT', pattern: /^39[3-9]\d{9}$/ },
    '34': { code: 'ES', pattern: /^34[6-9]\d{8}$/ },
    '91': { code: 'IN', pattern: /^91[6-9]\d{9}$/ },
    '92': { code: 'PK', pattern: /^92[3-5]\d{8}$/ },
    '20': { code: 'EG', pattern: /^201[0-2]\d{7}$/ },
    '234': { code: 'NG', pattern: /^234[7-9]\d{8}$/ },
    '254': { code: 'KE', pattern: /^2547\d{8}$/ },
    '27': { code: 'ZA', pattern: /^27[7-9]\d{8}$/ },
    '212': { code: 'MA', pattern: /^212[6-7]\d{7}$/ },
    '216': { code: 'TN', pattern: /^216[2-9]\d{6}$/ },
    '971': { code: 'AE', pattern: /^9715\d{8}$/ },
    '966': { code: 'SA', pattern: /^9665\d{8}$/ },
    '968': { code: 'OM', pattern: /^9689\d{7}$/ },
    '973': { code: 'BH', pattern: /^9733\d{7}$/ },
    '965': { code: 'KW', pattern: /^9655\d{7}$/ },
    '974': { code: 'QA', pattern: /^9743\d{7}$/ },
};

function detectCountry(phone: string): { country: string; countryCode: string } {
    const clean = phone.replace(/\D/g, '');
    
    for (const [prefix, data] of Object.entries(countryData)) {
        if (clean.startsWith(prefix) && data.pattern.test(clean)) {
            return { country: data.code, countryCode: prefix };
        }
    }
    
    if (clean.startsWith('880')) return { country: 'BD', countryCode: '880' };
    if (clean.startsWith('1') && clean.length === 11) return { country: 'US', countryCode: '1' };
    if (clean.startsWith('44')) return { country: 'UK', countryCode: '44' };
    if (clean.startsWith('49') && clean.length === 12) return { country: 'DE', countryCode: '49' };
    if (clean.startsWith('33') && clean.length === 11) return { country: 'FR', countryCode: '33' };
    if (clean.startsWith('91') && clean.length === 12) return { country: 'IN', countryCode: '91' };
    
    return { country: 'Unknown', countryCode: '' };
}

function cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

function findPhoneColumn(headers: string[]): number {
    const phoneKeywords = ['phone', 'number', 'tel', 'mobile', 'cell', 'contact', 'test'];
    
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().replace(/[^a-z]/g, '');
        if (phoneKeywords.some(kw => header.includes(kw))) {
            return i;
        }
    }
    return 0;
}

export default function PhoneFormatter() {
    const [isDragging, setIsDragging] = useState(false);
    const [processedData, setProcessedData] = useState<ProcessedNumber[]>([]);
    const [stats, setStats] = useState<{ total: number; valid: number; unique: number } | null>(null);
    const [columnName, setColumnName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
            
            if (jsonData.length > 0) {
                const headers = jsonData[0].map(String);
                const phoneColIndex = findPhoneColumn(headers);
                setColumnName(headers[phoneColIndex] || 'Column 1');
                
                const phoneNumbers: ProcessedNumber[] = [];
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row[phoneColIndex]) {
                        const original = String(row[phoneColIndex]);
                        const cleaned = cleanPhoneNumber(original);
                        if (cleaned.length >= 8) {
                            const { country, countryCode } = detectCountry(cleaned);
                            phoneNumbers.push({
                                original,
                                cleaned,
                                country,
                                countryCode,
                                valid: cleaned.length >= 10
                            });
                        }
                    }
                }
                
                processResults(phoneNumbers);
            }
        } else {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            const phoneNumbers: ProcessedNumber[] = [];
            
            for (const line of lines) {
                const cleaned = cleanPhoneNumber(line);
                if (cleaned.length >= 8) {
                    const { country, countryCode } = detectCountry(cleaned);
                    phoneNumbers.push({
                        original: line.trim(),
                        cleaned,
                        country,
                        countryCode,
                        valid: cleaned.length >= 10
                    });
                }
            }
            
            processResults(phoneNumbers);
        }
    };

    const processResults = (numbers: ProcessedNumber[]) => {
        const uniqueMap = new Map<string, ProcessedNumber>();
        numbers.forEach(n => {
            if (!uniqueMap.has(n.cleaned)) {
                uniqueMap.set(n.cleaned, n);
            }
        });
        
        const unique = Array.from(uniqueMap.values());
        setProcessedData(unique);
        setStats({
            total: numbers.length,
            valid: unique.filter(n => n.valid).length,
            unique: unique.length
        });
    };

    const handleFileUpload = (file: File) => {
        processFile(file);
    };

    const downloadCSV = () => {
        const csv = 'Original,Cleaned,Country,Country Code,Valid\n' + 
            processedData.map(n => `${n.original},${n.cleaned},${n.country},${n.countryCode},${n.valid}`).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_numbers.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(processedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Phone Numbers');
        XLSX.writeFile(wb, 'formatted_numbers.xlsx');
    };

    const resetTool = () => {
        setProcessedData([]);
        setStats(null);
        setColumnName('');
    };

    return (
        <div className="space-y-8">
            {!stats ? (
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
                    <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                    <p className="text-xl font-medium">Drop Excel or Text File</p>
                    <p className="text-sm text-text-muted mt-2">Smart column detection for "Test Number" and variations</p>
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
                        <div className="flex gap-4">
                            <div className="glass-panel px-6 py-3">
                                <p className="text-text-muted text-xs uppercase tracking-wider">Source Column</p>
                                <p className="font-bold">{columnName}</p>
                            </div>
                            <div className="glass-panel px-6 py-3">
                                <p className="text-text-muted text-xs uppercase tracking-wider">Total Found</p>
                                <p className="font-bold">{stats.total}</p>
                            </div>
                            <div className="glass-panel px-6 py-3">
                                <p className="text-text-muted text-xs uppercase tracking-wider">Valid Numbers</p>
                                <p className="font-bold text-green-400">{stats.valid}</p>
                            </div>
                            <div className="glass-panel px-6 py-3">
                                <p className="text-text-muted text-xs uppercase tracking-wider">Unique</p>
                                <p className="font-bold text-brand">{stats.unique}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
                                <FileText size={16} /> CSV
                            </button>
                            <button onClick={downloadExcel} className="btn-primary flex items-center gap-2">
                                <Download size={16} /> Excel
                            </button>
                            <button onClick={resetTool} className="btn-secondary">
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full">
                                <thead className="bg-surface-hover sticky top-0">
                                    <tr>
                                        <th className="text-left p-4 text-text-muted font-medium">Original</th>
                                        <th className="text-left p-4 text-text-muted font-medium">Cleaned</th>
                                        <th className="text-left p-4 text-text-muted font-medium">Country</th>
                                        <th className="text-left p-4 text-text-muted font-medium">Code</th>
                                        <th className="text-left p-4 text-text-muted font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedData.slice(0, 100).map((row, i) => (
                                        <tr key={i} className="border-t border-border hover:bg-surface-hover/50">
                                            <td className="p-4 font-mono text-sm">{row.original}</td>
                                            <td className="p-4 font-mono text-sm">{row.cleaned}</td>
                                            <td className="p-4">{row.country}</td>
                                            <td className="p-4 font-mono text-sm">{row.countryCode}</td>
                                            <td className="p-4">
                                                {row.valid ? (
                                                    <span className="flex items-center gap-1 text-green-400 text-sm">
                                                        <CheckCircle size={14} /> Valid
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-400 text-sm">Short</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {processedData.length > 100 && (
                            <div className="p-4 text-center text-text-muted border-t border-border">
                                Showing first 100 of {processedData.length} numbers
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
