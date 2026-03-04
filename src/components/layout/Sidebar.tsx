'use client';

import { motion } from 'framer-motion';
import { Home, Smartphone, MessageSquare, Cookie, Phone, PhoneForwarded, Split, Settings, ChevronRight, Shield, Hash } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { name: 'DASHBOARD', href: '/', icon: <Home size={16} /> },
    { name: 'IVAS FORMATTER', href: '/ivas-formatter', icon: <Smartphone size={16} /> },
    { name: 'SMS CDR PRO', href: '/sms-cdr-pro', icon: <MessageSquare size={16} /> },
    { name: 'COOKIE DASH', href: '/cookie-dashboard', icon: <Cookie size={16} /> },
    { name: 'PHONE FORMAT', href: '/phone-formatter', icon: <Phone size={16} /> },
    { name: 'PHONE SPLIT', href: '/phone-splitter', icon: <PhoneForwarded size={16} /> },
    { name: 'OTP SPLITTER', href: '/phone-otp-splitter', icon: <Split size={16} /> },
    { name: 'NUMBER EXTRACT', href: '/number-extractor', icon: <Hash size={16} /> },
    { name: 'PROXY MGR', href: '/proxy-manager', icon: <Shield size={16} /> },
    { name: 'SETTINGS', href: '/settings', icon: <Settings size={16} /> },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-56 h-screen bg-surface border-r border-border hidden md:flex flex-col relative">
            {/* Accent line at top */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-brand via-brand/20 to-transparent" />

            {/* Logo / Brand */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-text">
                        SMS<span className="text-brand">TOOLKIT</span>
                    </h1>
                </div>
                <div className="text-[10px] text-text-dim mt-1 tracking-[0.2em] uppercase ml-4">
                    VIBE EDITION v2.0
                </div>
            </div>

            <div className="divider mx-4 mb-2" />

            {/* Section Label */}
            <div className="px-5 py-2">
                <span className="section-title text-[10px]">Operations</span>
            </div>

            {/* Nav Items */}
            <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 group ${isActive
                                        ? 'bg-brand-dim text-brand border-l-2 border-brand'
                                        : 'text-text-muted hover:text-text hover:bg-surface-hover border-l-2 border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {item.icon}
                                    <span className="text-[11px] font-semibold tracking-wider">{item.name}</span>
                                </div>
                                {isActive && <ChevronRight size={12} className="text-brand" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Status */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-brand/20 border border-brand/30 flex items-center justify-center">
                        <span className="text-brand text-xs font-bold">N</span>
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold tracking-wider uppercase">NELOY</div>
                        <div className="text-[9px] text-text-dim tracking-wider uppercase">DEVELOPER</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
