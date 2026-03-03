'use client';

import { motion } from 'framer-motion';
import HeroScene from '@/components/3d/HeroScene';
import Link from 'next/link';

const stats = [
  { label: 'Total Extractions', value: '14,205' },
  { label: 'Files Processed', value: '3,102' },
  { label: 'Active Tools', value: '4' },
];

export default function Dashboard() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* 3D Background */}
      <HeroScene />

      {/* Hero Content */}
      <div className="z-10 max-w-3xl">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap gap-4"
        >
          <Link href="/extractor">
            <button className="btn-primary flex items-center gap-2">
              Launch Number Extractor Pro
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </Link>
          <Link href="/sms-cdr">
            <button className="btn-secondary">
              Open SMS CDR Pro
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Section / Activity Demo */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="z-10 mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 flex flex-col items-start hover:border-brand/50 transition-colors">
            <div className="text-text-muted text-sm font-medium mb-2 uppercase tracking-wider">{stat.label}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
