'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Copy, Download, Trash2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SmsRecord { id: number; num: string; otp: string; country: string; cli: string; len: number; orgSms: string; }

export default function SmsCdrPro() {
    const [allData, setAllData] = useState<SmsRecord[]>([]);
    const [filteredData, setFilteredData] = useState<SmsRecord[]>([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [statusClass, setStatusClass] = useState('');

    // Filters
    const [countries, setCountries] = useState<string[]>([]);
    const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
    const [clis, setClis] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('All');
    const [selectedCLI, setSelectedCLI] = useState('All');
    const [len5, setLen5] = useState(true);
    const [len6, setLen6] = useState(true);
    const [len8, setLen8] = useState(true);
    const [customRegex, setCustomRegex] = useState('');
    const [isDedupeActive, setIsDedupeActive] = useState(false);

    // Stats
    const [statTotal, setStatTotal] = useState(0);
    const [statView, setStatView] = useState(0);
    const [statFB, setStatFB] = useState(0);
    const [statDupes, setStatDupes] = useState(0);

    // Details panel
    const [showDetails, setShowDetails] = useState(false);
    const [detailTitle, setDetailTitle] = useState('');
    const [detLen6, setDetLen6] = useState(0);
    const [detLen8, setDetLen8] = useState(0);
    const [detLenOther, setDetLenOther] = useState(0);
    const [cliBreakdown, setCliBreakdown] = useState<{ cli: string; count: number; pct: string }[]>([]);

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFiles(files: FileList) {
        if (!files || files.length === 0) return;
        resetApp();
        setStatusMsg("Processing...");
        setStatusClass('');
        
        const processFile = (file: File): Promise<SmsRecord[]> => {
            return new Promise((resolve) => {
                const r = new FileReader();
                r.onload = function (e) {
                    try {
                        const d = new Uint8Array(e.target?.result as ArrayBuffer);
                        const wb = XLSX.read(d, { type: 'array' });
                        const s = wb.Sheets[wb.SheetNames[0]];
                        const rd: any[][] = XLSX.utils.sheet_to_json(s, { header: 1, defval: "" });

                        let hi = -1;
                        for (let i = 0; i < Math.min(rd.length, 25); i++) {
                            const rw = rd[i]; if (!rw) continue;
                            const hNames = rw.map((c: any) => String(c).trim().toLowerCase());
                            const hasNum = hNames.some((h: string) => h.includes("number"));
                            const hasSms = hNames.some((h: string) => h.includes("sms") || h.includes("message"));
                            const hasRng = hNames.some((h: string) => h.includes("range") || h.includes("country"));
                            const hasCli = hNames.some((h: string) => h.includes("cli") || h.includes("sender"));

                            if ((hasNum && hasSms) && (hasRng || hasCli)) { hi = i; break; }
                        }
                        if (hi === -1) { resolve([]); return; }

                        const h = rd[hi].map((h: any) => String(h).trim());
                        const idx = {
                            num: h.findIndex((x: string) => x.toLowerCase().includes("number")),
                            rng: h.findIndex((x: string) => x.toLowerCase().includes("range") || x.toLowerCase().includes("country")),
                            cli: h.findIndex((x: string) => x.toLowerCase().includes("cli") || x.toLowerCase().includes("sender")),
                            sms: h.findIndex((x: string) => x.toLowerCase().includes("sms") || x.toLowerCase().includes("message"))
                        };

                        const newData: SmsRecord[] = [];

                        for (let i = hi + 1; i < rd.length; i++) {
                            const row = rd[i]; if (!row || row.length === 0) continue;
                            const n = (row[idx.num] !== undefined) ? String(row[idx.num]).trim() : "";
                            const rng = (row[idx.rng] !== undefined) ? String(row[idx.rng]).trim() : "";
                            const cli = (row[idx.cli] !== undefined) ? String(row[idx.cli]).trim() : "";
                            const sms = (row[idx.sms] !== undefined) ? String(row[idx.sms]).trim() : "";
                            if (!n) continue;

                            const cty = rng.split(' ')[0] || "Unknown";

                            let otp: string | null = null;
                            const m = sms.match(/\d+/g);
                            if (m) { for (const x of m) { if (x.length >= 4 && x.length <= 8) { otp = x; break; } } }

                            if (otp) {
                                newData.push({ id: i, num: n, otp, country: cty, cli, len: otp.length, orgSms: sms });
                            }
                        }
                        resolve(newData);
                    } catch { resolve([]); }
                };
                r.readAsArrayBuffer(file);
            });
        };
        
        Promise.all(Array.from(files).map(processFile)).then(results => {
            const allRecords = results.flat();
            if (allRecords.length === 0) {
                setStatusMsg("Error: No valid data found in any files.");
                setStatusClass('');
                return;
            }
            
            const cC: Record<string, number> = {};
            const cL: Record<string, number> = {};
            let fB = 0;
            
            allRecords.forEach(d => {
                if (!cC[d.country]) cC[d.country] = 0;
                if (!cL[d.cli]) cL[d.cli] = 0;
                cC[d.country]++;
                cL[d.cli]++;
                if (d.cli.toLowerCase() === 'facebook') fB++;
            });
            
            setAllData(allRecords);
            setStatTotal(allRecords.length);
            setStatFB(fB);
            
            const sortedCountries = Object.keys(cC).sort((a, b) => cC[b] - cC[a]);
            setCountries(sortedCountries);
            setCountryCounts(cC);
            setClis(Object.keys(cL).sort());
            
            applyFiltersOnData(allRecords, 'All', 'All', [5, 6, 8], '', false);
            
            setStatusMsg(`Success! Loaded ${allRecords.length} records from ${files.length} file(s).`);
            setStatusClass('success');
        });
    }

    function applyFiltersOnData(data: SmsRecord[], country: string, cli: string, lengths: number[], regex: string, dedupe: boolean) {
        let ws = data;
        if (country !== 'All') ws = ws.filter(d => d.country === country);
        ws = ws.filter(item => {
            const cm = (cli === 'All') || (item.cli === cli);
            const lm = lengths.includes(item.len);
            let rm = true;
            if (regex) { try { const r = new RegExp(regex); rm = r.test(item.orgSms); } catch { rm = false; } }
            return cm && lm && rm;
        });
        if (dedupe) {
            const u = new Map<string, SmsRecord>();
            ws.forEach(d => u.set(d.num, d));
            ws = Array.from(u.values());
        }
        setFilteredData(ws);
        setStatView(ws.length);
        if (dedupe) {
            const u = new Set(ws.map(d => d.num));
            setStatDupes(u.size);
        } else setStatDupes(0);
    }

    function applyFilters() {
        const ls: number[] = [];
        if (len5) ls.push(5);
        if (len6) ls.push(6);
        if (len8) ls.push(8);
        applyFiltersOnData(allData, selectedCountry, selectedCLI, ls, customRegex, isDedupeActive);
    }

    function selectCountry(c: string) {
        setSelectedCountry(c);
        const ls: number[] = [];
        if (len5) ls.push(5);
        if (len6) ls.push(6);
        if (len8) ls.push(8);

        // Update CLIs for this country
        if (c === 'All') {
            const cL: Record<string, number> = {};
            allData.forEach(d => { if (!cL[d.cli]) cL[d.cli] = 0; cL[d.cli]++; });
            setClis(Object.keys(cL).sort());
        } else {
            const cd = allData.filter(d => d.country === c);
            const cL: Record<string, number> = {};
            cd.forEach(d => { if (!cL[d.cli]) cL[d.cli] = 0; cL[d.cli]++; });
            setClis(Object.keys(cL).sort());

            // Show details panel
            if (cd.length > 0) {
                setShowDetails(true);
                setDetailTitle(`Deep Analysis: ${c}`);
                renderDetails(cd);
            }
        }

        setSelectedCLI('All');
        applyFiltersOnData(allData, c, 'All', ls, customRegex, isDedupeActive);
    }

    function renderDetails(d: SmsRecord[]) {
        setDetLen6(d.filter(x => x.len === 6).length);
        setDetLen8(d.filter(x => x.len === 8).length);
        setDetLenOther(d.filter(x => x.len !== 6 && x.len !== 8).length);
        const m: Record<string, number> = {};
        d.forEach(x => { if (!m[x.cli]) m[x.cli] = 0; m[x.cli]++; });
        const k = Object.keys(m).sort((a, b) => m[b] - m[a]);
        setCliBreakdown(k.map(cli => ({ cli, count: m[cli], pct: ((m[cli] / d.length) * 100).toFixed(1) })));
    }

    function toggleDuplicates() {
        const newState = !isDedupeActive;
        setIsDedupeActive(newState);
        const ls: number[] = [];
        if (len5) ls.push(5);
        if (len6) ls.push(6);
        if (len8) ls.push(8);
        applyFiltersOnData(allData, selectedCountry, selectedCLI, ls, customRegex, newState);
    }

    function downloadCSV() {
        if (!filteredData.length) return;
        const h = ["Number", "OTP", "Country", "CLI", "Length", "Original SMS"];
        const rows = filteredData.map(d => [`"${d.num}"`, `"${d.otp}"`, `"${d.country}"`, `"${d.cli}"`, d.len, `"${d.orgSms.replace(/"/g, '""')}"`]);
        const blob = new Blob([h.join(",") + "\n" + rows.map(x => x.join(",")).join("\n")], { type: 'text/csv' });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sms_export.csv"; a.click();
    }

    function downloadExcel() {
        if (!filteredData.length) return;
        const ed = filteredData.map(d => ({ Number: d.num, OTP: d.otp, Country: d.country, CLI: d.cli, Length: d.len }));
        const ws = XLSX.utils.json_to_sheet(ed);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FilteredSMS");
        XLSX.writeFile(wb, "sms_export.xlsx");
    }

    function downloadTXT() {
        if (!filteredData.length) return;
        const content = filteredData.map(d => `${d.num}|${d.otp}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sms_export.txt"; a.click();
    }

    function downloadCountryWise() {
        if (!allData.length) return;
        
        const countryGroups: Record<string, SmsRecord[]> = {};
        allData.forEach(d => {
            if (!countryGroups[d.country]) countryGroups[d.country] = [];
            countryGroups[d.country].push(d);
        });
        
        const ts = new Date().getDate() + '-' + new Date().toLocaleString('default', { month: 'short' }) + '_' + new Date().toTimeString().slice(0, 5).replace(':', '');
        
        Object.entries(countryGroups).forEach(([country, records], idx) => {
            setTimeout(() => {
                const content = records.map(d => `${d.num}|${d.otp}`).join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const a = document.createElement("a"); 
                a.href = URL.createObjectURL(blob); 
                a.download = `${country.replace(/[^a-zA-Z0-9]/g, '_')}_${records.length}_${ts}.txt`; 
                a.click();
                URL.revokeObjectURL(a.href);
            }, idx * 200);
        });
    }

    function downloadSingleCountry(country: string) {
        const records = allData.filter(d => d.country === country);
        if (!records.length) return;
        
        const ts = new Date().getDate() + '-' + new Date().toLocaleString('default', { month: 'short' }) + '_' + new Date().toTimeString().slice(0, 5).replace(':', '');
        const content = records.map(d => `${d.num}|${d.otp}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement("a"); 
        a.href = URL.createObjectURL(blob); 
        a.download = `${country.replace(/[^a-zA-Z0-9]/g, '_')}_${records.length}_${ts}.txt`; 
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function copyToClipboard() {
        const output = filteredData.map(d => `${d.num}|${d.otp}`).join('\n');
        if (output) navigator.clipboard.writeText(output);
    }

    function resetApp() {
        setAllData([]); setFilteredData([]); setIsDedupeActive(false); setSelectedCountry('All');
        setSelectedCLI('All'); setCustomRegex(''); setLen5(true); setLen6(true); setLen8(true);
        setStatTotal(0); setStatView(0); setStatFB(0); setStatDupes(0);
        setShowDetails(false); setCountries([]); setClis([]); setCountryCounts({});
        setStatusMsg(''); setStatusClass('');
    }

    // Trigger filter updates on filter changes
    function onFilterChange(type: string, val: any) {
        if (type === 'country') { selectCountry(val); return; }
        if (type === 'cli') setSelectedCLI(val);
        if (type === 'len5') setLen5(val);
        if (type === 'len6') setLen6(val);
        if (type === 'len8') setLen8(val);
        if (type === 'regex') setCustomRegex(val);

        // Need to use a timeout to let state update
        setTimeout(() => applyFilters(), 10);
    }

    const outputVal = filteredData.map(d => `${d.num}|${d.otp}`).join('\n');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[80vh]">
            {/* Sidebar */}
            <div className="glass-panel p-4 space-y-4 h-fit lg:sticky lg:top-20">
                <h3 className="section-title">Filters</h3>

                {/* Upload */}
                <div
                    className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${isDragging ? 'border-brand bg-brand-dim' : 'border-border hover:border-border-hover'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud size={24} className="mx-auto mb-1 text-text-muted" />
                    <p className="text-[10px] text-text-dim uppercase tracking-wider">Upload SMS CDR Files (.xlsx)</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} multiple />
                </div>

                {/* Country filter */}
                <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase tracking-wider">Country</label>
                    <select value={selectedCountry} onChange={e => onFilterChange('country', e.target.value)} className="input-field text-xs w-full">
                        <option value="All">All Countries</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* CLI filter */}
                <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase tracking-wider">CLI / Sender</label>
                    <select value={selectedCLI} onChange={e => { setSelectedCLI(e.target.value); setTimeout(applyFilters, 10); }} className="input-field text-xs w-full">
                        <option value="All">All CLIs</option>
                        {clis.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* OTP Length */}
                <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase tracking-wider">OTP Length</label>
                    <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={len5} onChange={e => { setLen5(e.target.checked); setTimeout(applyFilters, 10); }} /> 5</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={len6} onChange={e => { setLen6(e.target.checked); setTimeout(applyFilters, 10); }} /> 6</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={len8} onChange={e => { setLen8(e.target.checked); setTimeout(applyFilters, 10); }} /> 8</label>
                    </div>
                </div>

                {/* Custom Regex */}
                <div className="space-y-1">
                    <label className="text-[10px] text-text-dim uppercase tracking-wider">Custom Regex</label>
                    <input type="text" value={customRegex} onChange={e => { setCustomRegex(e.target.value); setTimeout(applyFilters, 10); }} className="input-field text-xs w-full" placeholder="e.g. Facebook|Whatsapp" />
                </div>

                <button onClick={toggleDuplicates} className={`w-full text-xs py-2 rounded ${isDedupeActive ? 'btn-primary' : 'btn-secondary'}`}>
                    {isDedupeActive ? "Show All (Include Dupes)" : "Remove Duplicates"}
                </button>

                {selectedCountry !== 'All' && (
                    <button onClick={() => selectCountry('All')} className="btn-secondary w-full text-xs flex items-center gap-2 justify-center"><RotateCcw size={12} /> Reset Country</button>
                )}

                {/* Country buttons */}
                {countries.length > 0 && (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {countries.map(c => (
                            <div key={c} className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${selectedCountry === c ? 'bg-brand/20 text-brand border border-brand/30' : 'hover:bg-surface-hover border border-transparent'}`}>
                                <button onClick={() => selectCountry(c)} className="text-left text-xs flex-1">
                                    <span>{c}</span>
                                    <span className="text-[10px] font-bold ml-2">{countryCounts[c]}</span>
                                </button>
                                <button onClick={() => downloadSingleCountry(c)} className="text-xs text-text-dim hover:text-brand ml-2" title="Download">
                                    <Download size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Download All Countries */}
                {countries.length > 1 && (
                    <button onClick={downloadCountryWise} className="btn-primary w-full text-xs flex items-center justify-center gap-2">
                        <Download size={12} /> Download All Countries
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                {/* Status */}
                {statusMsg && (
                    <div className={`glass-panel p-3 text-xs ${statusClass === 'success' ? 'text-brand border-brand/20' : 'text-text-muted'}`}>
                        {statusMsg}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass-panel p-3 text-center">
                        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Total</div>
                        <div className="text-lg font-bold text-brand">{statTotal}</div>
                    </div>
                    <div className="glass-panel p-3 text-center">
                        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Viewing</div>
                        <div className="text-lg font-bold">{statView}</div>
                    </div>
                    <div className="glass-panel p-3 text-center">
                        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Facebook</div>
                        <div className="text-lg font-bold">{statFB}</div>
                    </div>
                    <div className="glass-panel p-3 text-center">
                        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Deduped</div>
                        <div className="text-lg font-bold">{statDupes}</div>
                    </div>
                </div>

                {/* Details Panel */}
                {showDetails && (
                    <div className="glass-panel p-4 space-y-3">
                        <h3 className="section-title">{detailTitle}</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center"><div className="text-[10px] text-text-dim">6-digit</div><div className="font-bold text-brand">{detLen6}</div></div>
                            <div className="text-center"><div className="text-[10px] text-text-dim">8-digit</div><div className="font-bold text-brand">{detLen8}</div></div>
                            <div className="text-center"><div className="text-[10px] text-text-dim">Other</div><div className="font-bold">{detLenOther}</div></div>
                        </div>
                        {cliBreakdown.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead><tr><th className="text-left p-2 text-text-dim">CLI</th><th className="text-left p-2 text-text-dim">Count</th><th className="text-left p-2 text-text-dim">%</th></tr></thead>
                                    <tbody>
                                        {cliBreakdown.map(cb => (
                                            <tr key={cb.cli} className="border-t border-border"><td className="p-2">{cb.cli}</td><td className="p-2">{cb.count}</td><td className="p-2">{cb.pct}%</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Output */}
                <div className="glass-panel p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="section-title">Output (Number|OTP)</h3>
                        <div className="flex gap-2">
                            <button onClick={copyToClipboard} className="btn-secondary text-xs flex items-center gap-1"><Copy size={12} /> Copy</button>
                            <button onClick={downloadTXT} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> TXT</button>
                            <button onClick={downloadCSV} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> CSV</button>
                            <button onClick={downloadExcel} className="btn-primary text-xs flex items-center gap-1"><Download size={12} /> Excel</button>
                        </div>
                    </div>
                    <textarea readOnly value={outputVal} className="input-field h-64 font-mono text-xs resize-none bg-surface" placeholder="Upload an SMS CDR file to begin..." />
                </div>

                <button onClick={resetApp} className="btn-secondary text-xs flex items-center gap-2"><Trash2 size={12} /> Reset All</button>
            </div>
        </div>
    );
}
