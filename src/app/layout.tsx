// src/app/layout.tsx
// Purpose: Root layout — global styles, metadata, font
// Dependencies: next/font, globals.css

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RFP Shredder — AI Compliance Matrix Generator',
  description:
    'Upload a federal RFP and get a formatted Excel compliance matrix in 2 minutes. Every Section L/M requirement extracted, classified, and cross-referenced.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
