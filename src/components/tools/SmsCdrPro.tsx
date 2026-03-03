'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, Download, Trash2, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SmsCdrPro() {
    const [isDragging, setIsDragging] = useState(false);
    const [fileData, setFileData] = useState<{ raw: string[], unique: string[], duplicates: number }>({ raw: [], unique: [], duplicates: 0 });
    const [countryStats, setCountryStats] = useState<Record<string, number>>({});
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processTextData = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const unique = Array.from(new Set(lines));
        const duplicates = lines.length - unique.length;

        setFileData({ raw: lines, unique, duplicates });

        // Simple mock detection for demo (assuming phone|otp lines or just phones)
        const stats: Record<string, number> = {};
        unique.forEach(line => {
            const parts = line.split('|');
            const num = parts[0].replace(/\D/g, '');

            let country = 'Unknown';
            if (num.startsWith('880')) country = 'Bangladesh';
            else if (num.startsWith('60')) country = 'Malaysia';
            else if (num.startsWith('966')) country = 'Saudi Arabia';
            else if (num.startsWith('971')) country = 'UAE';

            stats[country] = (stats[country] || 0) + 1;
        });

        setCountryStats(stats);
    };

    const handleFileUpload = (file: File) => {
        setError('');
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const wb = XLSX.read(data, { type: 'array' });
                    const allStrings: string[] = [];

                    wb.SheetNames.forEach(name => {
                        const sheet = wb.Sheets[name];
                        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        rows.forEach(row => {
                            if (row[0]) allStrings.push(String(row[0]));
                        });
                    });
                    processTextData(allStrings.join('\n'));
                } catch (err) {
                    setError('Error reading Excel');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                processTextData(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const downloadUnique = () => {
        const textData = fileData.unique.join('\n');
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CDR_Unique_${fileData.unique.length}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearData = () => {
        setFileData({ raw: [], unique: [], duplicates: 0 });
        setCountryStats({});
    };

    return (
        <div className="space-y-8">
            {!fileData.raw.length ? (
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
                    <PieChart size={48} className={`mb-4 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                    <p className="text-xl font-medium">Drop Phone|OTP Data</p>
                    <p className="text-sm text-text-muted mt-2">Filter duplicates & analyze stats instantly.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                        accept=".txt,.csv,.log,.xlsx,.xls"
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Total Supplied</p>
                            <p className="text-3xl font-bold">{fileData.raw.length}</p>
                        </div>
                        <div className="glass-panel p-6 border-l-4 border-l-brand">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Clean / Unique</p>
                            <p className="text-3xl font-bold">{fileData.unique.length}</p>
                        </div>
                        <div className="glass-panel p-6 border-l-4 border-l-rose-500">
                            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Duplicates Removed</p>
                            <p className="text-3xl font-bold text-rose-500">{fileData.duplicates}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Country Distribution</h2>
                            <div className="flex gap-2">
                                <button onClick={downloadUnique} className="btn-primary flex items-center gap-2 text-sm py-1.5">
                                    <Download size={16} /> Download Unique
                                </button>
                                <button onClick={clearData} className="btn-secondary flex items-center gap-2 text-sm py-1.5 border-rose-500/50 text-rose-500 hover:bg-rose-500/10">
                                    <Trash2 size={16} /> Reset
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(countryStats).sort((a, b) => b[1] - a[1]).map(([country, count]) => {
                                const percentage = Math.round((count / fileData.unique.length) * 100);
                                return (
                                    <div key={country}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{country}</span>
                                            <span className="text-text-muted">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                                            <div className="bg-brand h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="text-red-500">{error}</div>}
        </div>
    );
}
