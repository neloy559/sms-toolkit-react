'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Copy, Download, Trash2, Search, CheckSquare, Square } from 'lucide-react';
import { ivasCountryDict, sortedCountryCodes } from '@/lib/countryDict';
import * as XLSX from 'xlsx';

interface GroupedPhoneData { [country: string]: { code: string; count: number; nums: string[] } }

export default function PhoneFormatter() {
    const [inputVal, setInputVal] = useState('');
    const [outputVal, setOutputVal] = useState('');
    const [groupedData, setGroupedData] = useState<GroupedPhoneData>({});
    const [showDashboard, setShowDashboard] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [resultCount, setResultCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [exportFormat, setExportFormat] = useState('txt');
    const [colPos, setColPos] = useState(1);
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
            setInputVal(allNumbers.join('\n'));
        });
    }

    function processNumbers() {
        const txt = inputVal.trim();
        if (!txt) return;

        const processedNums: string[] = [];
        const grouped: GroupedPhoneData = {};

        txt.split(/\r?\n/).filter(l => l.trim() !== '').forEach(l => {
            const n = l.replace(/\D/g, '');
            if (n.length < 3) return;
            let code = '', country = 'UNKNOWN';
            for (const c of sortedCountryCodes) {
                if (n.startsWith(c)) { code = c; country = ivasCountryDict[c]; break; }
            }
            if (!grouped[country]) grouped[country] = { code, count: 0, nums: [] };
            grouped[country].count++;
            grouped[country].nums.push(n);
            processedNums.push(n);
        });

        if (!processedNums.length) { alert('No valid numbers found'); return; }
        setGroupedData(grouped);
        setShowDashboard(true);
        setShowOutput(true);
        setOutputVal(processedNums.join('\n'));
        setResultCount(processedNums.length);
    }

    function updateOutput(checkedCountries: string[]) {
        let all: string[] = [];
        checkedCountries.forEach(c => {
            if (groupedData[c]) all = all.concat(groupedData[c].nums);
        });
        setOutputVal(all.join('\n'));
        setResultCount(all.length);
    }

    function handleCheckboxChange(country: string, checked: boolean) {
        const allChecked = Object.keys(groupedData).filter(c => {
            if (c === country) return checked;
            const el = document.querySelector(`input[data-phone-c="${c}"]`) as HTMLInputElement;
            return el?.checked ?? false;
        });
        updateOutput(allChecked);
    }

    function downloadNumbers() {
        const checkedEls = document.querySelectorAll('input.phone-cb:checked') as NodeListOf<HTMLInputElement>;
        const selected = Array.from(checkedEls).map(cb => cb.getAttribute('data-phone-c') || '');
        if (!selected.length) return;

        let finalNumbers: string[] = [];
        selected.forEach(c => { if (groupedData[c]) finalNumbers = finalNumbers.concat(groupedData[c].nums); });

        const ts = Date.now();
        const fn = `Numbers_${finalNumbers.length}_${ts}`;

        if (exportFormat === 'xlsx') {
            let header: (string)[] = ["Number"];
            if (colPos === 2) header = ["", "Number"];
            if (colPos === 3) header = ["", "", "Number"];
            const rows: (string)[][] = [header];
            finalNumbers.forEach(n => {
                let r: string[] = [n];
                if (colPos === 2) r = ["", n];
                if (colPos === 3) r = ["", "", n];
                rows.push(r);
            });
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Numbers");
            XLSX.writeFile(wb, fn + '.xlsx');
        } else if (exportFormat === 'csv') {
            let prefix = "";
            if (colPos === 2) prefix = ",";
            if (colPos === 3) prefix = ",,";
            const content = prefix + "Number\n" + finalNumbers.map(n => prefix + n).join('\n');
            const b = new Blob([content], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = fn + '.csv'; a.click(); URL.revokeObjectURL(a.href);
        } else {
            let prefix = "";
            if (colPos === 2) prefix = "\t";
            if (colPos === 3) prefix = "\t\t";
            const content = finalNumbers.map(n => prefix + n).join('\n');
            const b = new Blob([content], { type: "text/plain" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = fn + '.txt'; a.click(); URL.revokeObjectURL(a.href);
        }
    }

    function resetTool() {
        setInputVal(''); setOutputVal(''); setShowOutput(false); setShowDashboard(false);
        setGroupedData({}); setResultCount(0); setSearchQuery('');
    }

    const filteredCountries = Object.keys(groupedData).sort().filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Input Section */}
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

                <textarea value={inputVal} onChange={e => setInputVal(e.target.value)} className="input-field h-32 font-mono text-xs resize-none" placeholder={"Paste numbers (one per line)\n8801700000000\n6288801256516"} />

                <div className="flex gap-2 justify-end">
                    <button onClick={resetTool} className="btn-secondary flex items-center gap-2 text-xs"><Trash2 size={12} /> Reset</button>
                    <button onClick={processNumbers} className="btn-primary flex items-center gap-2 text-xs">Process & Detect →</button>
                </div>
            </div>

            {/* Dashboard (Country Table) */}
            {showDashboard && (
                <div className="space-y-4">
                    <div className="glass-panel p-3 flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-8 text-xs" placeholder="Search countries..." />
                        </div>
                        <button onClick={() => { document.querySelectorAll('input.phone-cb').forEach((cb: any) => cb.checked = true); updateOutput(Object.keys(groupedData)); }} className="btn-secondary text-xs py-1.5"><CheckSquare size={12} /></button>
                        <button onClick={() => { document.querySelectorAll('input.phone-cb').forEach((cb: any) => cb.checked = false); updateOutput([]); }} className="btn-secondary text-xs py-1.5"><Square size={12} /></button>
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto max-h-[300px]">
                            <table className="w-full text-xs">
                                <thead className="bg-surface-hover sticky top-0">
                                    <tr>
                                        <th className="p-3 w-10"></th>
                                        <th className="text-left p-3 section-title">Country</th>
                                        <th className="text-center p-3 section-title">Code</th>
                                        <th className="text-center p-3 section-title">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCountries.map(c => (
                                        <tr key={c} className="border-t border-border hover:bg-surface-hover">
                                            <td className="p-3 text-center">
                                                <input type="checkbox" className="phone-cb" data-phone-c={c} defaultChecked onChange={(e) => handleCheckboxChange(c, e.target.checked)} />
                                            </td>
                                            <td className="p-3 font-medium">{c}</td>
                                            <td className="p-3 text-center text-text-muted">{groupedData[c].code}</td>
                                            <td className="p-3 text-center"><span className="badge bg-surface-hover text-brand">{groupedData[c].count}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Output Section */}
            {showOutput && (
                <div className="space-y-4">
                    <div className="glass-panel p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="section-title">Output — {resultCount} Numbers</h3>
                            <button onClick={() => navigator.clipboard.writeText(outputVal)} className="btn-secondary text-xs flex items-center gap-1"><Copy size={12} /> Copy</button>
                        </div>
                        <textarea readOnly value={outputVal} className="input-field h-40 font-mono text-xs resize-none bg-surface" />
                    </div>

                    {/* Export Options */}
                    <div className="glass-panel p-4">
                        <h3 className="section-title mb-3">Export Options</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="input-field w-auto text-xs">
                                <option value="txt">Text (.txt)</option>
                                <option value="xlsx">Excel (.xlsx)</option>
                                <option value="csv">CSV (.csv)</option>
                            </select>
                            <select value={colPos} onChange={e => setColPos(parseInt(e.target.value))} className="input-field w-auto text-xs">
                                <option value={1}>Column A</option>
                                <option value={2}>Column B</option>
                                <option value={3}>Column C</option>
                            </select>
                            <button onClick={downloadNumbers} className="btn-primary text-xs flex items-center gap-2"><Download size={12} /> Download</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
