'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, Trash2, Search, CheckSquare, Square } from 'lucide-react';
import { psCountryDict, psSortedCodes } from '@/lib/countryDict';
import * as XLSX from 'xlsx';

interface PsGroupedData { [country: string]: { code: string; count: number; nums: string[] } }

export default function PhoneSplitter() {
    const [inputVal, setInputVal] = useState('');
    const [groupedData, setGroupedData] = useState<PsGroupedData>({});
    const [showDashboard, setShowDashboard] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalProcessed, setTotalProcessed] = useState(0);
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
                                if (rows.length < 2) return;
                                const headerRow = rows[0];
                                let numColIdx = -1;

                                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                                    const row = rows[i];
                                    if (!row) continue;
                                    const idx = row.findIndex((cell: any) => cell && String(cell).trim().toLowerCase().includes('number'));
                                    if (idx !== -1) {
                                        numColIdx = idx;
                                        for (let j = i + 1; j < rows.length; j++) {
                                            const r2 = rows[j];
                                            if (r2 && r2[numColIdx]) numbers.push(String(r2[numColIdx]).trim());
                                        }
                                        break;
                                    }
                                }

                                if (numColIdx === -1 && headerRow) {
                                    const colScores: Record<number, number> = {};
                                    for (let c = 0; c < headerRow.length; c++) colScores[c] = 0;
                                    for (let rowIdx = 1; rowIdx < Math.min(rows.length, 50); rowIdx++) {
                                        const row = rows[rowIdx];
                                        if (!row) continue;
                                        for (let c = 0; c < headerRow.length; c++) {
                                            const val = row[c];
                                            if (val) {
                                                const strVal = String(val).replace(/\D/g, '');
                                                if (strVal.length >= 6 && strVal.length <= 15) colScores[c]++;
                                            }
                                        }
                                    }
                                    let maxScore = 0;
                                    for (const c in colScores) {
                                        if (colScores[c] > maxScore) { maxScore = colScores[c]; numColIdx = parseInt(c); }
                                    }
                                    if (numColIdx !== -1 && maxScore > 0) {
                                        for (let j = 1; j < rows.length; j++) {
                                            const r2 = rows[j];
                                            if (r2 && r2[numColIdx]) numbers.push(String(r2[numColIdx]).trim());
                                        }
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
            if (allNumbers.length === 0) alert('No phone numbers found in files');
            else setInputVal(allNumbers.join('\n'));
        });
    }

    function processNumbers() {
        if (!inputVal.trim()) return;
        const grouped: PsGroupedData = {};
        let count = 0;

        inputVal.split(/\r?\n/).filter(l => l.trim() !== '').forEach(l => {
            const n = l.replace(/\D/g, '');
            if (n.length < 3) return;
            let code = '', country = 'UNKNOWN';
            for (const c of psSortedCodes) {
                if (n.startsWith(c)) { code = c; country = psCountryDict[c]; break; }
            }
            if (!grouped[country]) grouped[country] = { code, count: 0, nums: [] };
            grouped[country].count++;
            grouped[country].nums.push(n);
            count++;
        });

        if (!count) { alert('No valid numbers found'); return; }
        setGroupedData(grouped);
        setTotalProcessed(count);
        setShowDashboard(true);
    }

    function downloadFiles(countries: string[]) {
        const now = new Date();
        const ts = now.getDate() + '-' + now.toLocaleString('default', { month: 'short' }) + '_' + now.toTimeString().slice(0, 5).replace(':', '');

        countries.forEach((c, i) => {
            const g = groupedData[c];
            if (!g || !g.nums.length) return;
            setTimeout(() => {
                const fn = `${c.replace(/[^a-zA-Z0-9]/g, '_')}_${g.nums.length}_${ts}`;
                const content = g.nums.join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fn + '.txt';
                a.click();
                URL.revokeObjectURL(a.href);
            }, i * 200);
        });
    }

    function downloadSingleCountry(country: string) {
        const g = groupedData[country];
        if (!g || !g.nums.length) return;
        
        const now = new Date();
        const ts = now.getDate() + '-' + now.toLocaleString('default', { month: 'short' }) + '_' + now.toTimeString().slice(0, 5).replace(':', '');
        const fn = `${country.replace(/[^a-zA-Z0-9]/g, '_')}_${g.nums.length}_${ts}`;
        const content = g.nums.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fn + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function downloadSelected() {
        const cbs = document.querySelectorAll('input.ps-cb:checked') as NodeListOf<HTMLInputElement>;
        const countries = Array.from(cbs).map(cb => cb.getAttribute('data-ps-c') || '');
        if (!countries.length) return;
        downloadFiles(countries);
    }

    function downloadAll() {
        downloadFiles(Object.keys(groupedData));
    }

    function resetTool() {
        setInputVal(''); setGroupedData({}); setShowDashboard(false); setSearchQuery(''); setTotalProcessed(0);
    }

    const filteredCountries = Object.keys(groupedData).sort().filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
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

                <textarea value={inputVal} onChange={e => setInputVal(e.target.value)} className="input-field h-32 font-mono text-xs resize-none" placeholder={"Paste phone numbers (one per line)\n6288801256516\n2609555123456\n249123456789"} />

                <div className="flex gap-2 justify-end">
                    <button onClick={resetTool} className="btn-secondary flex items-center gap-2 text-xs"><Trash2 size={12} /> Reset</button>
                    <button onClick={processNumbers} className="btn-primary text-xs">Process & Split →</button>
                </div>
            </div>

            {showDashboard && (
                <div className="space-y-4">
                    <div className="glass-panel p-3 flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-8 text-xs" placeholder="Search countries..." />
                        </div>
                        <button onClick={() => document.querySelectorAll('input.ps-cb').forEach((cb: any) => cb.checked = true)} className="btn-secondary text-xs py-1.5"><CheckSquare size={12} /> All</button>
                        <button onClick={() => document.querySelectorAll('input.ps-cb').forEach((cb: any) => cb.checked = false)} className="btn-secondary text-xs py-1.5"><Square size={12} /> None</button>
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-xs">
                                <thead className="bg-surface-hover sticky top-0">
                                    <tr>
                                        <th className="p-3 w-10"><input type="checkbox" defaultChecked onChange={(e) => document.querySelectorAll('input.ps-cb').forEach((cb: any) => cb.checked = e.target.checked)} /></th>
                                        <th className="text-left p-3 section-title">Country</th>
                                        <th className="text-left p-3 section-title">Code</th>
                                        <th className="text-left p-3 section-title">Count</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCountries.map(c => (
                                        <tr key={c} className="border-t border-border hover:bg-surface-hover">
                                            <td className="p-3"><input type="checkbox" className="ps-cb" data-ps-c={c} defaultChecked /></td>
                                            <td className="p-3 font-medium">{c}</td>
                                            <td className="p-3 text-text-muted">{groupedData[c].code}</td>
                                            <td className="p-3"><span className="badge bg-surface-hover text-brand">{groupedData[c].count}</span></td>
                                            <td className="p-3">
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

                    {filteredCountries.length === 0 && (
                        <p className="text-center text-text-dim text-xs py-4">No countries found.</p>
                    )}

                    <div className="glass-panel p-4">
                        <h3 className="section-title mb-3">Download Country Files</h3>
                        <p className="text-xs text-text-dim mb-3">Each country = separate .txt file: <code className="text-brand">COUNTRY_COUNT_Date-Time.txt</code></p>
                        <div className="flex gap-3 flex-wrap">
                            <button onClick={downloadSelected} className="btn-primary text-xs flex items-center gap-2"><Download size={12} /> Download Selected</button>
                            <button onClick={downloadAll} className="btn-secondary text-xs flex items-center gap-2"><Download size={12} /> Download All</button>
                        </div>
                    </div>

                    <div className="text-center text-[10px] text-text-dim uppercase tracking-wider">
                        Processed {totalProcessed} numbers • {Object.keys(groupedData).length} countries
                    </div>
                </div>
            )}
        </div>
    );
}
