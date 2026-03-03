import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMS ToolKit — Vibe Edition",
  description: "Advanced Data Operations Toolkit by Neloy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-text flex`}>
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto w-full relative">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/3 blur-[200px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/2 blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
