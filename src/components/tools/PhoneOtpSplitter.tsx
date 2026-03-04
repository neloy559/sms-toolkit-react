'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Download, Trash2 } from 'lucide-react';
import { otpCountryCodes, otpSortedCodes } from '@/lib/countryDict';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface OtpCountryGroup { code: string; name: string; flag: string; numbers: string[]; }

export default function PhoneOtpSplitter() {
    const [inputVal, setInputVal] = useState('');
    const [groupedData, setGroupedData] = useState<Record<string, OtpCountryGroup>>({});
    const [showDashboard, setShowDashboard] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [unknownCount, setUnknownCount] = useState(0);
    const [exportFormat, setExportFormat] = useState('txt');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function otpGetCountry(phone: string): { code: string; name: string; flag: string } {
        phone = phone.replace(/\D/g, '');
        for (const code of otpSortedCodes) {
            if (phone.startsWith(code)) {
                return { code, ...otpCountryCodes[code] };
            }
        }
        return { code: 'unknown', name: 'Unknown', flag: '❓' };
    }

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
            setInputVal(combinedContent);
            processFromText(combinedContent);
        });
    }

    function processFromText(text?: string) {
        const input = text || inputVal;
        const lines = input.split('\n').filter(line => line.trim());
        const grouped: Record<string, OtpCountryGroup> = {};
        let unk = 0;

        lines.forEach(line => {
            const [phone, otp] = line.split('|');
            if (phone && otp) {
                const country = otpGetCountry(phone.trim());
                const key = country.code;
                if (!grouped[key]) {
                    grouped[key] = { ...country, numbers: [] };
                }
                grouped[key].numbers.push(line.trim());
                if (key === 'unknown') unk++;
            }
        });

        setGroupedData(grouped);
        setTotalCount(lines.length);
        setUnknownCount(unk);
        setShowDashboard(true);
    }

    function downloadCountry(code: string, format: string = 'txt') {
        const country = groupedData[code];
        if (!country) return;

        if (format === 'xlsx') {
            const data = country.numbers.map(line => {
                const [phone, otp] = line.split('|');
                return { Phone: phone, OTP: otp };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Phone OTP');
            XLSX.writeFile(wb, `${country.name.replace(/\s+/g, '_')}_${code}.xlsx`);
            return;
        }

        let content: string, filename: string, mimeType: string;
        if (format === 'csv') {
            const rows = country.numbers.map(line => {
                const [phone, otp] = line.split('|');
                return `${phone},${otp}`;
            });
            content = 'Phone,OTP\n' + rows.join('\n');
            filename = `${country.name.replace(/\s+/g, '_')}_${code}.csv`;
            mimeType = 'text/csv';
        } else {
            content = country.numbers.join('\n');
            filename = `${country.name.replace(/\s+/g, '_')}_${code}.txt`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function downloadAll() {
        const countries = Object.values(groupedData);

        if (exportFormat === 'zip') {
            const zip = new JSZip();
            countries.forEach(country => {
                const content = country.numbers.join('\n');
                zip.file(`${country.name.replace(/\s+/g, '_')}_${country.code}.txt`, content);
            });
            const blob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'phone_otp_by_country.zip';
            a.click();
            URL.revokeObjectURL(a.href);
        } else if (exportFormat === 'xlsx') {
            const wb = XLSX.utils.book_new();
            countries.forEach(country => {
                const data = country.numbers.map(line => {
                    const [phone, otp] = line.split('|');
                    return { Phone: phone, OTP: otp, Country: country.name, Code: country.code };
                });
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, country.name.substring(0, 30));
            });
            XLSX.writeFile(wb, 'phone_otp_all_countries.xlsx');
        } else {
            countries.forEach((country, index) => {
                setTimeout(() => downloadCountry(country.code, exportFormat), index * 200);
            });
        }
    }

    function resetTool() {
        setInputVal(''); setGroupedData({}); setShowDashboard(false); setTotalCount(0); setUnknownCount(0);
    }

    const sortedCountries = Object.values(groupedData).sort((a, b) => b.numbers.length - a.numbers.length);

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
                <p className="text-sm font-semibold uppercase tracking-wider">Upload Phone|OTP Files</p>
                <p className="text-xs text-text-dim mt-1">.txt format (phone|OTP per line) — Multiple files supported</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} multiple />
            </div>

            <textarea
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="input-field h-32 font-mono text-xs resize-none"
                placeholder={"Paste phone|OTP data (one per line)\n6288801256516|123456\n2609555123456|789012\n249123456789|345678"}
            />

            <div className="flex gap-2 justify-end">
                <button onClick={resetTool} className="btn-secondary flex items-center gap-2 text-xs"><Trash2 size={12} /> Reset</button>
                <button onClick={() => processFromText()} className="btn-primary text-xs">Process & Split →</button>
            </div>

            {showDashboard && (
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="glass-panel p-3 text-center text-xs text-text-muted">
                        Total: {totalCount} numbers | Countries: {sortedCountries.length}{unknownCount > 0 ? ` | Unknown: ${unknownCount}` : ''}
                    </div>

                    {/* Country Cards */}
                    <div className="space-y-2">
                        {sortedCountries.map(country => (
                            <div key={country.code} className="glass-panel p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{country.flag}</span>
                                    <div>
                                        <div className="text-sm font-bold">{country.name}</div>
                                        <div className="text-[10px] text-text-dim">+{country.code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-brand font-bold">{country.numbers.length}</span>
                                    <button onClick={() => downloadCountry(country.code, exportFormat)} className="btn-secondary text-xs py-1"><Download size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Export Section */}
                    {sortedCountries.length > 1 && (
                        <div className="glass-panel p-4">
                            <h3 className="section-title mb-3">Export All</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="input-field w-auto text-xs">
                                    <option value="txt">Text (.txt)</option>
                                    <option value="xlsx">Excel (.xlsx)</option>
                                    <option value="csv">CSV (.csv)</option>
                                    <option value="zip">ZIP Archive (.zip)</option>
                                </select>
                                <button onClick={downloadAll} className="btn-primary text-xs flex items-center gap-2"><Download size={12} /> Download All</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
