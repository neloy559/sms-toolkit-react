'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, AlertTriangle, FileCode2, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CookieEntry {
    raw: string;
    domain: string;
    series: string;
    seriesType: string;
    valid: boolean;
}

export default function CookieDashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [entries, setEntries] = useState<CookieEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<CookieEntry[]>([]);
    const [seriesFilter, setSeriesFilter] = useState<string>('all');
    const [domainStats, setDomainStats] = useState<Record<string, number>>({});
    const [seriesStats, setSeriesStats] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const seriesPatterns: Record<string, RegExp> = {
        '1000xxx': /^1000\d{3}$/,
        '6154xxx': /^6154\d{3}$/,
        '2000xxx': /^2000\d{3}$/,
        '3000xxx': /^3000\d{3}$/,
        '4000xxx': /^4000\d{3}$/,
        '5000xxx': /^5000\d{3}$/,
        '7000xxx': /^7000\d{3}$/,
        '8000xxx': /^8000\d{3}$/,
    };

    const processCookieData = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const parsedEntries: CookieEntry[] = [];
        const domainMap: Record<string, number> = {};
        const seriesMap: Record<string, number> = {};
        
        for (const line of lines) {
            if (line.startsWith('#') || line.startsWith('http')) continue;
            
            const parts = line.split('\t');
            let domain = '';
            let cookieId = '';
            let seriesType = 'Unknown';
            
            if (parts.length >= 2) {
                domain = parts[0].replace(/^\./, '');
                const value = parts[parts.length - 1];
                cookieId = value.replace(/\D/g, '').slice(-7);
                
                for (const [name, pattern] of Object.entries(seriesPatterns)) {
                    if (pattern.test(cookieId)) {
                        seriesType = name;
                        break;
                    }
                }
                
                parsedEntries.push({
                    raw: line,
                    domain,
                    series: cookieId,
                    seriesType,
                    valid: parts.length >= 7
                });
                
                domainMap[domain] = (domainMap[domain] || 0) + 1;
                seriesMap[seriesType] = (seriesMap[seriesType] || 0) + 1;
            }
        }
        
        setEntries(parsedEntries);
        setFilteredEntries(parsedEntries);
        setDomainStats(domainMap);
        setSeriesStats(seriesMap);
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            processCookieData(e.target?.result as string);
        };
        reader.readAsText(file);
    };

    const handleSeriesFilter = (series: string) => {
        setSeriesFilter(series);
        if (series === 'all') {
            setFilteredEntries(entries);
        } else {
            setFilteredEntries(entries.filter(e => e.seriesType === series));
        }
    };

    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
            Domain: e.domain,
            Series: e.series,
            SeriesType: e.seriesType,
            Valid: e.valid
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cookies');
        XLSX.writeFile(wb, 'cookie_analysis.xlsx');
    };

    const downloadCSV = () => {
        const csv = 'Domain,Series,SeriesType,Valid\n' + 
            filteredEntries.map(e => `${e.domain},${e.series},${e.seriesType},${e.valid}`).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cookie_analysis.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetTool = () => {
        setEntries([]);
        setFilteredEntries([]);
        setDomainStats({});
        setSeriesStats({});
        setSeriesFilter('all');
    };

    const validCount = entries.filter(e => e.valid).length;
    const availableSeries = Object.keys(seriesStats).filter(s => s !== 'Unknown');

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
                    <FileCode2 size={48} className={`mb-4 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                    <p className="text-xl font-medium">Drop Cookie File (Netscape Format)</p>
                    <p className="text-sm text-text-muted mt-2">Parse & filter by ID series (1000xxx, 6154xxx)</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 border-l-4 border-l-blue-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Cookies</p>
                            <p className="text-2xl font-bold">{entries.length}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-green-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Valid Format</p>
                            <p className="text-2xl font-bold">{validCount}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-yellow-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Filtered</p>
                            <p className="text-2xl font-bold">{filteredEntries.length}</p>
                        </div>
                        <div className="glass-panel p-4 border-l-4 border-l-purple-500">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Domains</p>
                            <p className="text-2xl font-bold">{Object.keys(domainStats).length}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <Filter size={18} className="text-text-muted" />
                            <span className="text-text-muted">Filter by Series:</span>
                            <select 
                                value={seriesFilter} 
                                onChange={(e) => handleSeriesFilter(e.target.value)}
                                className="input-field w-auto"
                            >
                                <option value="all">All Series</option>
                                {availableSeries.map(s => (
                                    <option key={s} value={s}>{s} ({seriesStats[s]})</option>
                                ))}
                            </select>
                            <button onClick={() => handleSeriesFilter('all')} className="btn-secondary text-sm">
                                Clear Filter
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-panel p-6">
                            <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Series Distribution</h2>
                            <div className="space-y-4">
                                {Object.entries(seriesStats).sort((a, b) => b[1] - a[1]).map(([series, count]) => {
                                    const percentage = Math.round((count / entries.length) * 100);
                                    return (
                                        <div key={series}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-mono">{series}</span>
                                                <span className="text-text-muted">{count} ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                                                <div className="bg-brand h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="glass-panel p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                                <h2 className="text-xl font-bold">Domain Spread</h2>
                                <button onClick={resetTool} className="text-text-muted hover:text-white transition-colors text-sm">
                                    Reset Tool
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                {Object.entries(domainStats)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 20)
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

                    <div className="glass-panel p-4 flex justify-between items-center">
                        <span className="text-text-muted">Export filtered data</span>
                        <div className="flex gap-2">
                            <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
                                <Download size={16} /> CSV
                            </button>
                            <button onClick={downloadExcel} className="btn-primary flex items-center gap-2">
                                <Download size={16} /> Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
