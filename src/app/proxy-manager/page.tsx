'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, Globe, Search } from 'lucide-react';
import { abcProxies, dataImpulseProxies, type ProxyEntry } from './proxyData';

type Provider = 'abc' | 'dataimpulse';

export default function ProxyManager() {
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const currentProxies: ProxyEntry[] = useMemo(() => {
        if (!selectedProvider) return [];
        const list = selectedProvider === 'abc' ? abcProxies : dataImpulseProxies;
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(p => p.country.toLowerCase().includes(q));
    }, [selectedProvider, search]);

    const handleCopy = async (idx: number, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleBack = () => {
        setSelectedProvider(null);
        setSearch('');
        setCopiedIdx(null);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-brand-dim border border-brand/20 flex items-center justify-center">
                        <Shield className="text-brand w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Proxy Manager</h1>
                        <p className="text-sm text-text-dim">Select a provider to view & copy proxies</p>
                    </div>
                </div>
                <div className="divider" />
            </div>

            {/* Provider Selection or Proxy List */}
            {!selectedProvider ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-16"
                >
                    {/* ABC Proxy Card */}
                    <button
                        onClick={() => setSelectedProvider('abc')}
                        className="glass-panel p-8 flex flex-col items-center gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:border-brand/40 text-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-transparent transition-all duration-500" />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-brand-dim border border-brand/20 flex items-center justify-center group-hover:border-brand/40 transition-colors">
                                <Globe size={28} className="text-brand" />
                            </div>
                            <h2 className="text-lg font-bold uppercase tracking-wider group-hover:text-brand transition-colors">ABC Proxy</h2>
                            <p className="text-xs text-text-dim leading-relaxed">
                                {abcProxies.length} proxies across {new Set(abcProxies.map(p => p.country)).size} countries
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-[0.15em] text-green-400 uppercase">Ready</span>
                            </div>
                        </div>
                    </button>

                    {/* DataImpulse Card */}
                    <button
                        onClick={() => setSelectedProvider('dataimpulse')}
                        className="glass-panel p-8 flex flex-col items-center gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:border-brand/40 text-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-transparent transition-all duration-500" />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-brand-dim border border-brand/20 flex items-center justify-center group-hover:border-brand/40 transition-colors">
                                <Shield size={28} className="text-brand" />
                            </div>
                            <h2 className="text-lg font-bold uppercase tracking-wider group-hover:text-brand transition-colors">DataImpulse</h2>
                            <p className="text-xs text-text-dim leading-relaxed">
                                {dataImpulseProxies.length} proxies across {new Set(dataImpulseProxies.map(p => p.country)).size} countries
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-[0.15em] text-green-400 uppercase">Ready</span>
                            </div>
                        </div>
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Top Bar: Back + Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBack} className="btn-secondary text-xs px-4 py-2">
                                ← Back
                            </button>
                            <div>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-brand">
                                    {selectedProvider === 'abc' ? 'ABC Proxy' : 'DataImpulse'}
                                </h2>
                                <span className="text-[10px] text-text-dim tracking-wider uppercase">
                                    {currentProxies.length} proxies
                                </span>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                type="text"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-bg-darker border border-border/50 rounded-md pl-9 pr-3 py-2 text-sm text-text focus:border-brand/50 focus:outline-none transition-colors placeholder:text-text-dim/50"
                            />
                        </div>
                    </div>

                    {/* Proxy List */}
                    <div className="glass-panel p-5">
                        {currentProxies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-text-dim py-12">
                                <Shield className="w-10 h-10 mb-3 text-border" />
                                <p className="text-sm">No proxies match your search.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
                                {currentProxies.map((item, i) => (
                                    <div
                                        key={`${item.country}-${i}`}
                                        className="flex items-center justify-between p-3 bg-bg-darker border border-border/30 rounded-md hover:border-brand/30 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                            {/* Country Badge */}
                                            <div className="flex-shrink-0">
                                                <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-1 rounded whitespace-nowrap">
                                                    {item.country}
                                                </span>
                                            </div>

                                            {/* Proxy String */}
                                            <div className="font-mono text-sm text-text truncate">
                                                {item.proxy}
                                            </div>
                                        </div>

                                        {/* Copy Button */}
                                        <button
                                            onClick={() => handleCopy(i, item.proxy)}
                                            className={`ml-4 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded transition-all duration-200 ${copiedIdx === i
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-bg-dark'
                                                }`}
                                        >
                                            {copiedIdx === i ? (
                                                <>
                                                    <Check size={14} />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
