import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'MiniquesCare — Pharmacy, Lab & Supermarket',
  description:
    'Your trusted healthcare partner. Quality drugs, diagnostic lab tests, and everyday supermarket essentials — all in one place.',
  keywords: ['pharmacy', 'laboratory', 'supermarket', 'healthcare', 'MiniquesCare'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-white text-gray-900 antialiased">
       <HomePage children={children}/>
      </body>
    </html>
  );
}
