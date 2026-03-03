'use client';

import { useState } from 'react';
import { Terminal, Copy, ArrowRight } from 'lucide-react';

export default function IvasFormatter() {
    const [inputVal, setInputVal] = useState('');
    const [outputVal, setOutputVal] = useState('');
    const [gatewayIP, setGatewayIP] = useState('192.168.1.1');
    const [port, setPort] = useState('8080');
    const [path, setPath] = useState('/api/sendsms');

    const formatIvas = () => {
        // Mimicking the original app's logic
        // Generate a list of URLs with the parameters
        const lines = inputVal.split('\n').map(l => l.trim()).filter(l => l);

        // In original code, it generated endpoints for Premium rate.
        // Example: http://IP:PORT/PATH?sender=&receiver=NUM&msg=TXT
        const result = lines.map(num => {
            let cleanNum = num.replace(/\D/g, '');
            return `http://${gatewayIP}:${port}${path}?receiver=${cleanNum}&text=premium_content_sample`;
        }).join('\n');

        setOutputVal(result);
    };

    const copyOut = () => {
        navigator.clipboard.writeText(outputVal);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                    <Terminal size={20} className="text-brand" />
                    <h2 className="text-xl font-bold">iVAS Configuration</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                        <label className="text-xs text-text-muted font-medium mb-1 block">Path</label>
                        <input
                            type="text"
                            value={path}
                            onChange={e => setPath(e.target.value)}
                            className="input-field text-sm"
                            placeholder="/api/sendsms"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block mt-2">Target Numbers (One per line)</label>
                    <textarea
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        className="input-field h-64 font-mono text-sm resize-none"
                        placeholder="8801700000000&#10;8801800000000"
                    />
                </div>

                <button onClick={formatIvas} className="btn-primary w-full flex justify-center items-center gap-2 mt-2">
                    Generate Endpoints <ArrowRight size={18} />
                </button>
            </div>

            {/* Output Section */}
            <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                    <h2 className="text-xl font-bold">Generated Endpoints</h2>
                    <button onClick={copyOut} className="text-text-muted hover:text-brand transition-colors p-2 bg-surface hover:bg-surface-hover rounded-lg">
                        <Copy size={18} />
                    </button>
                </div>

                <textarea
                    className="input-field h-[410px] font-mono text-xs resize-none bg-surface"
                    readOnly
                    value={outputVal}
                    placeholder="Generated endpoints will appear here..."
                />
            </div>
        </div>
    );
}
