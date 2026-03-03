'use client';

import { motion } from 'framer-motion';
import { Home, Filter, PieChart, BarChart2, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { name: 'Dashboard', href: '/', icon: <Home size={20} /> },
    { name: 'Number Extractor Pro', href: '/extractor', icon: <Filter size={20} /> },
    { name: 'SMS CDR Pro', href: '/sms-cdr', icon: <PieChart size={20} /> },
    { name: 'Cookie Dashboard', href: '/cookie', icon: <BarChart2 size={20} /> },
    { name: 'iVAS Formatter', href: '/ivas', icon: <MessageSquare size={20} /> },
    { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen bg-surface border-r border-border hidden md:flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    SMS ToolKit
                </h1>
                <div className="text-xs text-text-muted mt-1">Vibe Edition</div>
            </div>

            <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                        ? 'bg-brand/10 text-brand border border-brand/20'
                                        : 'text-text-muted hover:bg-surface-hover hover:text-text'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex items-center p-3 rounded-xl bg-background border border-border">
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-bold text-white shadow-lg">
                        N
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-semibold">Neloy</div>
                        <div className="text-xs text-text-muted">Developer</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
