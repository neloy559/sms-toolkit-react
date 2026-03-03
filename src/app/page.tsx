'use client';

import { motion } from 'framer-motion';
import HeroScene from '@/components/3d/HeroScene';
import Link from 'next/link';
import { Smartphone, MessageSquare, Cookie, Phone, PhoneForwarded, Split } from 'lucide-react';

const tools = [
    {
        name: 'iVAS Formatter',
        description: 'Process, sort, and export phone numbers by country code. Generate routing parameters and API endpoint configurations.',
        href: '/ivas-formatter',
        icon: Smartphone,
    },
    {
        name: 'SMS CDR Pro',
        description: 'Advanced analytics for SMS data. Filter by country, CLI, OTP length and visualize trends.',
        href: '/sms-cdr-pro',
        icon: MessageSquare,
    },
    {
        name: 'Cookie Dashboard',
        description: 'Parse pipe-delimited cookie files, filter by ID series (e.g., 1000xxx, 6154xxx), and export to Excel.',
        href: '/cookie-dashboard',
        icon: Cookie,
    },
    {
        name: 'Phone Formatter',
        description: 'Extract clean phone numbers from Excel/TXT files with smart column detection.',
        href: '/phone-formatter',
        icon: Phone,
    },
    {
        name: 'Phone Splitter',
        description: 'Detect country codes and split phone numbers into separate files by country.',
        href: '/phone-splitter',
        icon: PhoneForwarded,
    },
    {
        name: 'Phone OTP Splitter',
        description: "Split phone|OTP combination files by country. Download individual files or export all as ZIP.",
        href: '/phone-otp-splitter',
        icon: Split,
    },
];

export default function Dashboard() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
            <HeroScene />

            <div className="z-10 max-w-3xl mb-12">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
                >
                    Your Ultimate <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-[#ff66b2]">
                        Data Swiss Army Knife.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl leading-relaxed"
                >
                    Effortlessly process text files, extract numbers by country, parse SMS OTPs, and generate premium rate iVAS configurations — all in one powerful suite.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {tools.map((tool, i) => (
                    <Link key={i} href={tool.href}>
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel p-6 flex flex-col h-full cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                                <tool.icon size={24} className="text-brand" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-brand transition-colors">{tool.name}</h3>
                            <p className="text-text-muted text-sm leading-relaxed">{tool.description}</p>
                        </motion.div>
                    </Link>
                ))}
            </motion.div>
        </div>
    );
}
