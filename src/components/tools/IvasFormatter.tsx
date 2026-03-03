'use client';

import { useState } from 'react';
import { Terminal, Copy, ArrowRight, Download, Trash2 } from 'lucide-react';

interface FormattedEndpoint {
    number: string;
    country: string;
    endpoint: string;
}

const countryData: Record<string, { code: string; name: string }> = {
    '880': { code: 'BD', name: 'Bangladesh' },
    '1': { code: 'US', name: 'USA' },
    '44': { code: 'UK', name: 'UK' },
    '49': { code: 'DE', name: 'Germany' },
    '33': { code: 'FR', name: 'France' },
    '91': { code: 'IN', name: 'India' },
    '92': { code: 'PK', name: 'Pakistan' },
    '966': { code: 'SA', name: 'Saudi Arabia' },
    '971': { code: 'AE', name: 'UAE' },
};

export default function IvasFormatter() {
    const [inputVal, setInputVal] = useState('');
    const [outputVal, setOutputVal] = useState('');
    const [formattedData, setFormattedData] = useState<FormattedEndpoint[]>([]);
    const [gatewayIP, setGatewayIP] = useState('192.168.1.1');
    const [port, setPort] = useState('8080');
    const [path, setPath] = useState('/api/sendsms');
    const [senderId, setSenderId] = useState('IVAS');
    const [messageTemplate, setMessageTemplate] = useState('Your verification code is: {OTP}');

    const detectCountry = (phone: string): string => {
        const clean = phone.replace(/\D/g, '');
        for (const [prefix, data] of Object.entries(countryData)) {
            if (clean.startsWith(prefix)) return data.name;
        }
        if (clean.startsWith('1')) return 'USA';
        return 'Unknown';
    };

    const formatIvas = () => {
        const lines = inputVal.split('\n').map(l => l.trim()).filter(l => l);
        const results: FormattedEndpoint[] = [];
        
        const endpoints = lines.map(num => {
            const cleanNum = num.replace(/\D/g, '');
            const country = detectCountry(cleanNum);
            const endpoint = `http://${gatewayIP}:${port}${path}?sender=${senderId}&receiver=${cleanNum}&text=${encodeURIComponent(messageTemplate)}`;
            
            results.push({
                number: cleanNum,
                country,
                endpoint
            });
            
            return endpoint;
        }).join('\n');

        setOutputVal(endpoints);
        setFormattedData(results);
    };

    const copyOut = () => {
        navigator.clipboard.writeText(outputVal);
    };

    const downloadTxt = () => {
        const blob = new Blob([outputVal], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ivas_endpoints.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearAll = () => {
        setInputVal('');
        setOutputVal('');
        setFormattedData([]);
    };

    const countryStats = formattedData.reduce((acc, curr) => {
        acc[curr.country] = (acc[curr.country] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                        <Terminal size={20} className="text-brand" />
                        <h2 className="text-xl font-bold">iVAS Configuration</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-text-muted font-medium mb-1 block">Gateway IP</label>
                            <input
                                type="text"
                                value={gatewayIP}
                                onChange={e => setGatewayIP(e.target.value)}
                                className="input-field text-sm"
                                placeholder="192.168.1.1"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-medium mb-1 block">Port</label>
                            <input
                                type="text"
                                value={port}
                                onChange={e => setPort(e.target.value)}
                                className="input-field text-sm"
                                placeholder="8080"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-medium mb-1 block">API Path</label>
                            <input
                                type="text"
                                value={path}
                                onChange={e => setPath(e.target.value)}
                                className="input-field text-sm"
                                placeholder="/api/sendsms"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-medium mb-1 block">Sender ID</label>
                            <input
                                type="text"
                                value={senderId}
                                onChange={e => setSenderId(e.target.value)}
                                className="input-field text-sm"
                                placeholder="IVAS"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-text-muted font-medium mb-1 block mt-2">Message Template</label>
                        <input
                            type="text"
                            value={messageTemplate}
                            onChange={e => setMessageTemplate(e.target.value)}
                            className="input-field text-sm"
                            placeholder="Your verification code is: {OTP}"
                        />
                        <p className="text-xs text-text-muted mt-1">Use {'{OTP}'} as placeholder</p>
                    </div>

                    <div>
                        <label className="text-xs text-text-muted font-medium mb-1 block mt-2">Target Numbers (One per line)</label>
                        <textarea
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            className="input-field h-48 font-mono text-sm resize-none"
                            placeholder="8801700000000&#10;8801800000000"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={formatIvas} className="btn-primary flex-1 flex justify-center items-center gap-2 mt-2">
                            Generate Endpoints <ArrowRight size={18} />
                        </button>
                        <button onClick={clearAll} className="btn-secondary mt-2 px-4">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                        <h2 className="text-xl font-bold">Generated Endpoints</h2>
                        <div className="flex gap-2">
                            <button onClick={copyOut} className="text-text-muted hover:text-brand transition-colors p-2 bg-surface hover:bg-surface-hover rounded-lg" title="Copy">
                                <Copy size={18} />
                            </button>
                            <button onClick={downloadTxt} className="text-text-muted hover:text-brand transition-colors p-2 bg-surface hover:bg-surface-hover rounded-lg" title="Download">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    <textarea
                        className="input-field flex-1 font-mono text-xs resize-none bg-surface min-h-[300px]"
                        readOnly
                        value={outputVal}
                        placeholder="Generated endpoints will appear here..."
                    />

                    {formattedData.length > 0 && (
                        <div className="border-t border-border pt-4">
                            <h3 className="text-sm font-bold mb-2">Country Stats</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(countryStats).map(([country, count]) => (
                                    <span key={country} className="bg-surface-hover px-2 py-1 rounded text-xs">
                                        {country}: <span className="text-brand font-bold">{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
