'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, Download, Trash2, PieChart, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CdrEntry {
    raw: string;
    phone: string;
    otp: string | null;
    otpLength: number;
    cli: string;
    country: string;
    countryCode: string;
}

export default function SmsCdrPro() {
    const [isDragging, setIsDragging] = useState(false);
    const [entries, setEntries] = useState<CdrEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<CdrEntry[]>([]);
    const [countryStats, setCountryStats] = useState<Record<string, number>>({});
    const [otpLengthFilter, setOtpLengthFilter] = useState<string>('all');
    const [countryFilter, setCountryFilter] = useState<string>('all');
    const [cliFilter, setCliFilter] = useState<string>('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (clean.startsWith(prefix)) return prefix;
        }
        if (clean.startsWith('1') && clean.length >= 11) return '1';
        return 'unknown';
    }

    const processTextData = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const parsedEntries: CdrEntry[] = [];
        
        for (const line of lines) {
            const parts = line.split(/[|,;:\t]+/);
            const phone = parts[0]?.replace(/\D/g, '') || '';
            const otp = parts[1]?.replace(/\D/g, '') || null;
            
            if (phone.length >= 8) {
                const code = detectCountryCode(phone);
                parsedEntries.push({
                    raw: line,
                    phone,
                    otp,
                    otpLength: otp ? otp.length : 0,
                    cli: parts[2] || '',
                    country: countryData[code]?.name || 'Unknown',
                    countryCode: code
                });
            }
        }
        
        setEntries(parsedEntries);
        applyFilters(parsedEntries, otpLengthFilter, countryFilter, cliFilter);
        
        const stats: Record<string, number> = {};
        parsedEntries.forEach(entry => {
            stats[entry.country] = (stats[entry.country] || 0) + 1;
        });
        setCountryStats(stats);
    };

    const applyFilters = (data: CdrEntry[], otpLen: string, country: string, cli: string) => {
        let filtered = [...data];
        
        if (otpLen !== 'all') {
            filtered = filtered.filter(e => e.otpLength === parseInt(otpLen));
        }
        
        if (country !== 'all') {
            filtered = filtered.filter(e => e.country === country);
        }
        
        if (cli.trim()) {
            filtered = filtered.filter(e => e.cli.toLowerCase().includes(cli.toLowerCase()));
        }
        
        setFilteredEntries(filtered);
    };

    const handleFilterChange = (otpLen?: string, country?: string, cli?: string) => {
        const newOtpLen = otpLen !== undefined ? otpLen : otpLengthFilter;
        const newCountry = country !== undefined ? country : countryFilter;
        const newCli = cli !== undefined ? cli : cliFilter;
        
        setOtpLengthFilter(newOtpLen);
        setCountryFilter(newCountry);
        setCliFilter(newCli);
        
        applyFilters(entries, newOtpLen, newCountry, newCli);
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

    const downloadFiltered = () => {
        const textData = filteredEntries.map(e => e.raw).join('\n');
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CDR_Filtered_${filteredEntries.length}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearData = () => {
        setEntries([]);
        setFilteredEntries([]);
        setCountryStats({});
        setOtpLengthFilter('all');
        setCountryFilter('all');
        setCliFilter('');
    };

    const uniqueCountries = Object.keys(countryStats);
    const otpLengths = [...new Set(entries.map(e => e.otpLength).filter(l => l > 0))].sort();

    return (
        <div className="space-y-8">
            {!entries.length ? (
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
                    <p className="text-xl font-medium">Drop SMS CDR Data</p>
                    <p className="text-sm text-text-muted mt-2">Filter by country, OTP length & CLI. Visualize trends.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 border-l-4 border-l-blue-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Records</p>
                            <p className="text-2xl font-bold">{entries.length}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-brand">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Filtered</p>
                            <p className="text-2xl font-bold">{filteredEntries.length}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-green-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">With OTP</p>
                            <p className="text-2xl font-bold">{entries.filter(e => e.otp).length}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-purple-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Countries</p>
                            <p className="text-2xl font-bold">{uniqueCountries.length}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <Filter size={18} className="text-text-muted" />
                            <select 
                                value={otpLengthFilter} 
                                onChange={(e) => handleFilterChange(e.target.value, undefined, undefined)}
                                className="input-field w-auto"
                            >
                                <option value="all">All OTP Lengths</option>
                                {otpLengths.map(len => (
                                    <option key={len} value={len}>{len} digits</option>
                                ))}
                            </select>
                            <select 
                                value={countryFilter} 
                                onChange={(e) => handleFilterChange(undefined, e.target.value, undefined)}
                                className="input-field w-auto"
                            >
                                <option value="all">All Countries</option>
                                {uniqueCountries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Filter by CLI..."
                                value={cliFilter}
                                onChange={(e) => handleFilterChange(undefined, undefined, e.target.value)}
                                className="input-field w-40"
                            />
                            <button onClick={() => handleFilterChange('all', 'all', '')} className="btn-secondary text-sm">
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Country Distribution</h2>
                            <div className="flex gap-2">
                                <button onClick={downloadFiltered} className="btn-primary flex items-center gap-2 text-sm py-1.5">
                                    <Download size={16} /> Download Filtered
                                </button>
                                <button onClick={clearData} className="btn-secondary flex items-center gap-2 text-sm py-1.5 text-rose-500 hover:bg-rose-500/10">
                                    <Trash2 size={16} /> Reset
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(countryStats).sort((a, b) => b[1] - a[1]).map(([country, count]) => {
                                const percentage = Math.round((count / entries.length) * 100);
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

                    {filteredEntries.length > 0 && (
                        <div className="glass-panel p-4">
                            <h3 className="font-bold mb-4">Sample Data (First 10)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-surface-hover">
                                        <tr>
                                            <th className="text-left p-2">Phone</th>
                                            <th className="text-left p-2">OTP</th>
                                            <th className="text-left p-2">Country</th>
                                            <th className="text-left p-2">CLI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.slice(0, 10).map((e, i) => (
                                            <tr key={i} className="border-t border-border">
                                                <td className="p-2 font-mono">{e.phone}</td>
                                                <td className="p-2 font-mono text-brand">{e.otp || '-'}</td>
                                                <td className="p-2">{e.country}</td>
                                                <td className="p-2 text-text-muted">{e.cli || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="text-red-500">{error}</div>}
        </div>
    );
}
