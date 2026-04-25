import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { ReactNode } from 'react';
import Navbar from '../components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'ProjectHub',
  description: 'Your developer workspace',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-full flex flex-col bg-white text-slate-900">
        <Navbar />
        <main className="grow">
          {children}
        </main>
      </body>
    </html>
  );
}