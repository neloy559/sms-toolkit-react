import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMS ToolKit | Developer Dashboard",
  description: "Advanced SMS Toolkit by Neloy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-background text-text selection:bg-brand selection:text-white flex`}
      >
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto w-full relative">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
