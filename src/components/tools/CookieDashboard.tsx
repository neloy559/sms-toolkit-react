'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Copy, Download, Trash2, Filter, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';

const COOKIE_PREFIXES = ['1000', '6154', '6155', '6156', '6157', '6158', 'Other'];

interface CookieRecord { user_id: string; prefix: string; account_info: string; cookie_string: string; }

export default function CookieDashboard() {
    const [parsedData, setParsedData] = useState<CookieRecord[]>([]);
    const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(COOKIE_PREFIXES));
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFiles(files: FileList) {
        if (!files || files.length === 0) return;
        
        const processFile = (file: File): Promise<string> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target?.result as string || '');
                };
                reader.readAsText(file);
            });
        };
        
        Promise.all(Array.from(files).map(processFile)).then(results => {
            const combinedContent = results.join('\n');
            processContent(combinedContent);
        });
    }

    function processContent(content: string) {
        const lines = content.trim().split('\n');
        const newData: CookieRecord[] = [];

        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length >= 3) {
                const userId = parts[0].trim();
                const prefix = userId.substring(0, 4);
                let category = 'Other';
                if (COOKIE_PREFIXES.includes(prefix)) category = prefix;

                newData.push({
                    user_id: userId,
                    prefix: category,
                    account_info: parts[1].trim(),
                    cookie_string: parts[2].trim()
                });
            }
        });

        if (newData.length > 0) {
            setParsedData(newData);
            setSelectedFilters(new Set(COOKIE_PREFIXES));
            setShowDashboard(true);
        } else {
            alert("No valid data found.");
        }
    }

    const filteredData = parsedData.filter(row => selectedFilters.has(row.prefix));

    // Calculate counts for distribution
    const counts: Record<string, number> = {};
    COOKIE_PREFIXES.forEach(p => counts[p] = 0);
    filteredData.forEach(row => {
        if (counts[row.prefix] !== undefined) counts[row.prefix]++;
        else counts['Other']++;
    });

    let maxVal = 0;
    for (const key in counts) if (counts[key] > maxVal) maxVal = counts[key];

    function toggleFilter(prefix: string) {
        const s = new Set(selectedFilters);
        if (s.has(prefix)) s.delete(prefix); else s.add(prefix);
        setSelectedFilters(s);
    }

    function selectAllFilters(select: boolean) {
        if (select) setSelectedFilters(new Set(COOKIE_PREFIXES));
        else setSelectedFilters(new Set());
    }

    function copyForGoogleSheets() {
        if (filteredData.length === 0) return;
        let tsvContent = "User ID\tPassword\tCookie\n";
        filteredData.forEach(row => {
            tsvContent += `${row.user_id}\t${row.account_info}\t${row.cookie_string}\n`;
        });
        navigator.clipboard.writeText(tsvContent);
    }

    function exportToExcel() {
        if (filteredData.length === 0) return;
        const buckets: Record<string, any[]> = {};
        filteredData.forEach(row => {
            if (!buckets[row.prefix]) buckets[row.prefix] = [];
            buckets[row.prefix].push({ "User ID": row.user_id, "Password": row.account_info, "Cookie": row.cookie_string });
        });
        const wb = XLSX.utils.book_new();
        for (const [prefix, data] of Object.entries(buckets)) {
            if (data.length > 0) {
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, prefix);
            }
        }
        XLSX.writeFile(wb, "Filtered_Cookies.xlsx");
    }

    return (
        <div className="space-y-6">
            {/* Upload */}
            <div
                className={`glass-panel p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand-dim' : 'border-border hover:border-border-hover'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
            >
                <UploadCloud size={36} className={`mb-3 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                <p className="text-sm font-semibold uppercase tracking-wider">Upload Cookie Files</p>
                <p className="text-xs text-text-dim mt-1">Format: UserID|Password|Cookie — Multiple files supported</p>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} accept=".txt,.csv" multiple />
            </div>

            {showDashboard && (
                <>
                    {/* Top Bar */}
                    <div className="glass-panel p-3 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                            <div className="text-xs"><span className="text-text-dim">Total:</span> <span className="text-brand font-bold">{parsedData.length}</span></div>
                            <div className="text-xs"><span className="text-text-dim">Filtered:</span> <span className="font-bold">{filteredData.length}</span></div>
                        </div>
                        <button onClick={() => setShowFilterPanel(!showFilterPanel)} className="btn-secondary text-xs flex items-center gap-1"><Filter size={12} /> Filters</button>
                    </div>

                    {/* Filter Panel */}
                    {showFilterPanel && (
                        <div className="glass-panel p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="section-title">Series Filters</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => selectAllFilters(true)} className="btn-secondary text-xs py-1"><CheckSquare size={12} /> All</button>
                                    <button onClick={() => selectAllFilters(false)} className="btn-secondary text-xs py-1"><Square size={12} /> None</button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {COOKIE_PREFIXES.map(prefix => (
                                    <label key={prefix} className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={selectedFilters.has(prefix)} onChange={() => toggleFilter(prefix)} />
                                        {prefix}xxx
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Distribution Chart */}
                    <div className="glass-panel p-4">
                        <h3 className="section-title mb-3">Distribution</h3>
                        <div className="space-y-2">
                            {Object.entries(counts).map(([prefix, count]) => {
                                const existsInDataset = parsedData.some(r => r.prefix === prefix);
                                if (!existsInDataset) return null;
                                const widthPercent = maxVal > 0 ? (count / maxVal) * 100 : 0;
                                const isActive = selectedFilters.has(prefix);

                                return (
                                    <div key={prefix} className="flex items-center gap-3">
                                        <div className="w-16 text-xs text-text-dim font-mono">{prefix}xxx</div>
                                        <div className="flex-1 h-5 rounded bg-surface overflow-hidden">
                                            <div className={`h-full rounded transition-all duration-300 ${isActive ? 'bg-brand' : 'bg-surface-hover'}`} style={{ width: `${widthPercent}%` }} />
                                        </div>
                                        <div className={`w-12 text-right text-xs font-bold ${isActive ? 'text-text' : 'text-text-dim'}`}>{count}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mini stat cards */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {Object.entries(counts).map(([prefix, count]) => {
                                const existsInDataset = parsedData.some(r => r.prefix === prefix);
                                if (!existsInDataset) return null;
                                const isActive = selectedFilters.has(prefix);
                                return (
                                    <div key={prefix} className={`px-3 py-2 rounded text-xs font-mono text-center ${isActive ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-surface text-text-dim border border-border'}`}>
                                        {prefix}<br /><span className="font-bold">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={copyForGoogleSheets} className="btn-secondary text-xs flex items-center gap-2"><Copy size={12} /> Copy for Sheets (TSV)</button>
                        <button onClick={exportToExcel} className="btn-primary text-xs flex items-center gap-2"><Download size={12} /> Export to Excel</button>
                        <button onClick={() => { setParsedData([]); setShowDashboard(false); }} className="btn-secondary text-xs flex items-center gap-2"><Trash2 size={12} /> Reset</button>
                    </div>

                    {/* Table */}
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-xs">
                                <thead className="bg-surface-hover sticky top-0">
                                    <tr>
                                        <th className="text-left p-3 section-title">User ID</th>
                                        <th className="text-left p-3 section-title">Password</th>
                                        <th className="text-left p-3 section-title">Series</th>
                                        <th className="text-left p-3 section-title">Cookie</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, i) => (
                                        <tr key={i} className="border-t border-border hover:bg-surface-hover">
                                            <td className="p-3 font-mono">{row.user_id}</td>
                                            <td className="p-3 font-medium">{row.account_info}</td>
                                            <td className="p-3"><span className="badge bg-surface-hover text-brand">{row.prefix}</span></td>
                                            <td className="p-3 max-w-[200px] truncate text-text-dim font-mono" title={row.cookie_string}>{row.cookie_string}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
