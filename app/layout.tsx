import type { Metadata, Viewport } from 'next';
import '../styles/tokens.css';
import '../styles/app.css';

export const metadata: Metadata = {
  title: 'HR Tech summit contacts — Talent Muscle',
  description: 'Search the HR Tech summit contact list by name or company.',
  icons: { icon: '/logo-square.jpg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0C54A0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
