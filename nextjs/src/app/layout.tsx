import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { UserProvider } from '@/contexts/UserContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mydemy',
  description: 'เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mydemy',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ef5ea8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </head>
      <body>
        <UserProvider>
          {children}
          <Toaster position="top-center" richColors />
        </UserProvider>
      </body>
    </html>
  );
}
