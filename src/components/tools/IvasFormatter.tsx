'use client';

import { useState, useRef } from 'react';
import { Terminal, Copy, Download, Trash2, UploadCloud, Search, CheckSquare, Square } from 'lucide-react';
import { ivasCountryDict, sortedCountryCodes } from '@/lib/countryDict';
import * as XLSX from 'xlsx';

interface IvasEntry { orig: string; num: string; code: string; country: string; }
interface GroupedData { [country: string]: { code: string; count: number; nums: IvasEntry[] } }

export default function IvasFormatter() {
    const [inputVal, setInputVal] = useState('');
    const [processedData, setProcessedData] = useState<IvasEntry[]>([]);
    const [groupedData, setGroupedData] = useState<GroupedData>({});
    const [showDashboard, setShowDashboard] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
    const [previewCountry, setPreviewCountry] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFiles(files: FileList) {
        if (!files || files.length === 0) return;
        let allNumbers: string[] = [];
        
        const processFile = (file: File): Promise<string[]> => {
            return new Promise((resolve) => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                const r = new FileReader();
                
                if (ext === 'xlsx' || ext === 'xls') {
                    r.onload = (e) => {
                        try {
                            const data = new Uint8Array(e.target?.result as ArrayBuffer);
                            const wb = XLSX.read(data, { type: 'array' });
                            const numbers: string[] = [];

                            wb.SheetNames.forEach(name => {
                                const sheet = wb.Sheets[name];
                                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                                for (let i = 0; i < Math.min(rows.length, 20); i++) {
                                    const row = rows[i];
                                    if (!row) continue;
                                    const idx = row.findIndex((cell: any) => cell && String(cell).trim().toLowerCase().includes('number'));
                                    if (idx !== -1) {
                                        for (let j = i + 1; j < rows.length; j++) {
                                            const r2 = rows[j];
                                            if (r2 && r2[idx]) numbers.push(String(r2[idx]).trim());
                                        }
                                        break;
                                    }
                                }
                            });
                            resolve(numbers);
                        } catch { resolve([]); }
                    };
                    r.readAsArrayBuffer(file);
                } else {
                    r.onload = (e) => { resolve((e.target?.result as string || '').split(/\r?\n/)); };
                    r.readAsText(file);
                }
            });
        };
        
        Promise.all(Array.from(files).map(processFile)).then(results => {
            allNumbers = results.flat();
            if (allNumbers.length === 0) alert('No "Number" column found or it is empty');
            else setInputVal(allNumbers.join('\n'));
        });
    }

    function processNumbers() {
        if (!inputVal.trim()) return;
        const processed: IvasEntry[] = [];
        const grouped: GroupedData = {};

        inputVal.split(/\r?\n/).filter(l => l.trim() !== '').forEach(l => {
            const n = l.replace(/\D/g, '');
            if (n.length < 3) return;
            let code = '', country = 'UNKNOWN';
            for (const c of sortedCountryCodes) {
                if (n.startsWith(c)) { code = c; country = ivasCountryDict[c]; break; }
            }
            const entry: IvasEntry = { orig: l, num: n, code, country };
            processed.push(entry);
            if (!grouped[country]) grouped[country] = { code, count: 0, nums: [] };
            grouped[country].count++;
            grouped[country].nums.push(entry);
        });

        if (!processed.length) { alert('No valid numbers found'); return; }
        setProcessedData(processed);
        setGroupedData(grouped);
        setSelectedCountries(new Set(Object.keys(grouped)));
        setShowDashboard(true);
    }

    function exportData() {
        if (selectedCountries.size === 0) return;
        let delay = 0;
        selectedCountries.forEach(c => {
            const g = groupedData[c];
            if (!g) return;
            const rows: (string | number)[][] = [["HEAD", "iVAS Premium rate SMS My Numbers", "*", "*", "*", "*"], ["0", "Range", "Number", "A2P", "P2P"]];
            let idx = 1;
            g.nums.forEach(n => rows.push([idx++, `${n.code} ${c}`, n.num, "$0.00", ""]));
            const ts = new Date().getDate() + new Date().toLocaleString('default', { month: 'short' }) + '_' + new Date().toTimeString().slice(0, 5).replace(':', '');
            const fn = `${c.replace(/[^a-zA-Z0-9]/g, "_")}_${g.count >= 1000 ? (g.count / 1000).toFixed(1) + 'k' : g.count}_${ts}`;

            setTimeout(() => {
                if (exportFormat === 'xlsx') {
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                    XLSX.writeFile(wb, fn + '.xlsx');
                } else if (exportFormat === 'csv') {
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                    XLSX.writeFile(wb, fn + '.csv', { bookType: 'csv' });
                } else {
                    const b = new Blob([rows.map(r => r.join(" | ")).join("\n")], { type: "text/plain" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(b);
                    a.download = fn + '.txt';
                    a.click();
                    URL.revokeObjectURL(a.href);
                }
            }, delay);
            delay += 300;
        });
    }

    function downloadSingleCountry(country: string) {
        const g = groupedData[country];
        if (!g || !g.nums.length) return;
        
        const ts = new Date().getDate() + new Date().toLocaleString('default', { month: 'short' }) + '_' + new Date().toTimeString().slice(0, 5).replace(':', '');
        const fn = `${country.replace(/[^a-zA-Z0-9]/g, "_")}_${g.count >= 1000 ? (g.count / 1000).toFixed(1) + 'k' : g.count}_${ts}`;
        
        const rows: (string | number)[][] = [["HEAD", "iVAS Premium rate SMS My Numbers", "*", "*", "*", "*"], ["0", "Range", "Number", "A2P", "P2P"]];
        let idx = 1;
        g.nums.forEach(n => rows.push([idx++, `${n.code} ${country}`, n.num, "$0.00", ""]));
        
        if (exportFormat === 'xlsx') {
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, fn + '.xlsx');
        } else if (exportFormat === 'csv') {
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, fn + '.csv', { bookType: 'csv' });
        } else {
            const b = new Blob([rows.map(r => r.join(" | ")).join("\n")], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = fn + '.txt';
            a.click();
            URL.revokeObjectURL(a.href);
        }
    }

    function copyAllSelected() {
        if (selectedCountries.size === 0) return;
        let combined = "";
        selectedCountries.forEach(c => {
            const g = groupedData[c];
            if (!g) return;
            combined += `--- ${c} (${g.count}) ---\n`;
            combined += g.nums.map(n => n.num).join('\n') + '\n\n';
        });
        navigator.clipboard.writeText(combined);
    }

    function toggleCountry(c: string) {
        const s = new Set(selectedCountries);
        if (s.has(c)) s.delete(c); else s.add(c);
        setSelectedCountries(s);
    }

    function resetTool() {
        setInputVal('');
        setProcessedData([]);
        setGroupedData({});
        setShowDashboard(false);
        setSearchQuery('');
        setSelectedCountries(new Set());
        setPreviewCountry(null);
    }

    const filteredCountries = Object.keys(groupedData).sort().filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            {!showDashboard ? (
                <div className="space-y-4">
                    <div
                        className={`glass-panel p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand-dim' : 'border-border hover:border-border-hover'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadCloud size={36} className={`mb-3 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                        <p className="text-sm font-semibold uppercase tracking-wider">Click or Drop Files</p>
                        <p className="text-xs text-text-dim mt-1">.txt, .csv, .xlsx, .xls — Multiple files supported</p>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} accept=".txt,.csv,.xlsx,.xls" multiple />
                    </div>

                    <textarea
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        className="input-field h-48 font-mono text-xs resize-none"
                        placeholder={"Paste phone numbers here (one per line)\n8801700000000\n8801800000000"}
                    />

                    <div className="flex gap-2 justify-end">
                        <button onClick={resetTool} className="btn-secondary flex items-center gap-2"><Trash2 size={14} /> Reset</button>
                        <button onClick={processNumbers} className="btn-primary flex items-center gap-2"><Terminal size={14} /> Process Numbers →</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="glass-panel p-3 flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-8 text-xs" placeholder="Search countries..." />
                        </div>
                        <button onClick={() => setSelectedCountries(new Set(Object.keys(groupedData)))} className="btn-secondary text-xs py-1.5"><CheckSquare size={12} /> All</button>
                        <button onClick={() => setSelectedCountries(new Set())} className="btn-secondary text-xs py-1.5"><Square size={12} /> None</button>
                    </div>

                    {/* Table */}
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-xs">
                                <thead className="bg-surface-hover sticky top-0">
                                    <tr>
                                        <th className="text-left p-3 w-10"><input type="checkbox" checked={selectedCountries.size === Object.keys(groupedData).length} onChange={(e) => e.target.checked ? setSelectedCountries(new Set(Object.keys(groupedData))) : setSelectedCountries(new Set())} /></th>
                                        <th className="text-left p-3 section-title">Country</th>
                                        <th className="text-left p-3 section-title">Code</th>
                                        <th className="text-left p-3 section-title">Count</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCountries.map(c => (
                                        <tr key={c} className="border-t border-border hover:bg-surface-hover cursor-pointer" onClick={() => setPreviewCountry(c)}>
                                            <td className="p-3" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedCountries.has(c)} onChange={() => toggleCountry(c)} />
                                            </td>
                                            <td className="p-3 font-medium">{c}</td>
                                            <td className="p-3 text-text-muted">{groupedData[c].code}</td>
                                            <td className="p-3"><span className="badge bg-surface-hover text-brand">{groupedData[c].count}</span></td>
                                            <td className="p-3" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => downloadSingleCountry(c)} className="text-xs text-text-dim hover:text-brand" title="Download">
                                                    <Download size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Preview Modal */}
                    {previewCountry && groupedData[previewCountry] && (
                        <div className="glass-panel p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider">{previewCountry} ({groupedData[previewCountry].count})</h3>
                                <button onClick={() => setPreviewCountry(null)} className="text-text-dim hover:text-text text-xs">Close</button>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto font-mono text-xs space-y-0.5 text-text-muted">
                                {groupedData[previewCountry].nums.map((n, i) => <div key={i}>{n.num}</div>)}
                            </div>
                        </div>
                    )}

                    {/* Export Section */}
                    <div className="glass-panel p-4">
                        <div className="divider mb-4" />
                        <h3 className="section-title mb-3">Export selected countries</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="input-field w-auto text-xs">
                                <option value="xlsx">Excel (.xlsx)</option>
                                <option value="csv">CSV (.csv)</option>
                                <option value="txt">Text (.txt)</option>
                            </select>
                            <button onClick={exportData} className="btn-primary text-xs flex items-center gap-2"><Download size={12} /> Download ({selectedCountries.size})</button>
                            <button onClick={copyAllSelected} className="btn-secondary text-xs flex items-center gap-2"><Copy size={12} /> Copy All</button>
                            <button onClick={resetTool} className="btn-secondary text-xs flex items-center gap-2 text-red-400"><Trash2 size={12} /> Reset</button>
                        </div>
                    </div>

                    <div className="text-center text-[10px] text-text-dim uppercase tracking-wider">
                        Processed {processedData.length} numbers • {Object.keys(groupedData).length} countries detected
                    </div>
                </div>
            )}
        </div>
    );
}
