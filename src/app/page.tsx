'use client';

import { motion } from 'framer-motion';
import HeroScene from '@/components/3d/HeroScene';
import Link from 'next/link';
import { Smartphone, MessageSquare, Cookie, Phone, PhoneForwarded, Split, ArrowUpRight } from 'lucide-react';

const tools = [
    {
        name: 'iVAS Formatter',
        description: 'Process, sort, and export phone numbers by country code. Generate routing parameters and API endpoint configurations.',
        href: '/ivas-formatter',
        icon: Smartphone,
        status: 'LIVE',
    },
    {
        name: 'SMS CDR Pro',
        description: 'Advanced analytics for SMS data. Filter by country, CLI, OTP length and visualize trends.',
        href: '/sms-cdr-pro',
        icon: MessageSquare,
        status: 'LIVE',
    },
    {
        name: 'Cookie Dashboard',
        description: 'Parse pipe-delimited cookie files, filter by ID series (e.g., 1000xxx, 6154xxx), and export to Excel.',
        href: '/cookie-dashboard',
        icon: Cookie,
        status: 'LIVE',
    },
    {
        name: 'Phone Formatter',
        description: 'Extract clean phone numbers from Excel/TXT files with smart column detection.',
        href: '/phone-formatter',
        icon: Phone,
        status: 'LIVE',
    },
    {
        name: 'Phone Splitter',
        description: 'Detect country codes and split phone numbers into separate files by country.',
        href: '/phone-splitter',
        icon: PhoneForwarded,
        status: 'LIVE',
    },
    {
        name: 'Phone OTP Splitter',
        description: 'Split phone|OTP combination files by country. Download individual files or export all as ZIP.',
        href: '/phone-otp-splitter',
        icon: Split,
        status: 'LIVE',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
            {/* 3D Background */}
            <HeroScene />

            {/* Hero Section — cinematic darknode style */}
            <div className="z-10 pt-12 md:pt-24 pb-16 md:pb-24 relative">
                {/* Top label */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <div className="w-8 h-[1px] bg-brand" />
                    <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-brand">
                        Developer Toolkit
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.9] mb-8"
                >
                    <span className="text-text">Operate</span>
                    <br />
                    <span className="text-text">Your</span>{' '}
                    <span className="text-brand">Data</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-sm md:text-base text-text-muted max-w-md leading-relaxed mb-10"
                >
                    Extract numbers, parse SMS data, split by country, and generate
                    premium rate configurations — all from one command center.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap gap-3"
                >
                    <Link href="/ivas-formatter">
                        <button className="btn-primary flex items-center gap-2">
                            Launch Tools
                            <ArrowUpRight size={16} />
                        </button>
                    </Link>
                    <Link href="/settings">
                        <button className="btn-secondary">
                            Configuration
                        </button>
                    </Link>
                </motion.div>
            </div>

            {/* Divider */}
            <div className="z-10 mb-8">
                <div className="divider" />
                <div className="flex items-center justify-between mt-4">
                    <span className="section-title">Available Operations</span>
                    <span className="text-[10px] text-text-dim tracking-wider uppercase">
                        {tools.length} TOOLS ACTIVE
                    </span>
                </div>
            </div>

            {/* Tool Grid — tactical cards */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {tools.map((tool, i) => (
                    <motion.div key={i} variants={itemVariants}>
                        <Link href={tool.href}>
                            <div className="glass-panel p-5 flex flex-col h-full cursor-pointer group relative overflow-hidden transition-all duration-300 hover:border-brand/30">
                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-transparent transition-all duration-500" />

                                <div className="relative z-10">
                                    {/* Top row: icon + status */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-9 h-9 rounded-md bg-brand-dim border border-brand/10 flex items-center justify-center group-hover:border-brand/30 transition-colors">
                                            <tool.icon size={18} className="text-brand" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                            <span className="text-[9px] font-bold tracking-[0.15em] text-brand uppercase">
                                                {tool.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-sm font-bold mb-2 uppercase tracking-wider group-hover:text-brand transition-colors duration-300">
                                        {tool.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-text-dim text-xs leading-relaxed">
                                        {tool.description}
                                    </p>

                                    {/* Bottom arrow */}
                                    <div className="mt-4 flex items-center gap-1.5 text-text-dim group-hover:text-brand transition-colors duration-300">
                                        <span className="text-[10px] font-semibold tracking-wider uppercase">Deploy</span>
                                        <ArrowUpRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Bottom accent */}
            <div className="z-10 mt-16 mb-8">
                <div className="divider" />
                <div className="mt-4 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                    <span className="text-[10px] text-text-dim tracking-wider uppercase">
                        SMS TOOLKIT VIBE EDITION — DESIGNED FOR OPERATIONS
                    </span>
                </div>
            </div>
        </div>
    );
}
