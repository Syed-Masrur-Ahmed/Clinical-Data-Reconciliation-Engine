import type { Metadata } from 'next';
import './globals.css';
import { ApiKeyProvider } from '@/context/ApiKeyContext';

export const metadata: Metadata = {
  title: 'MediCheck',
  description: 'AI-powered medication reconciliation & data quality validation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div
          className="fixed inset-0 -z-10 opacity-50"
          style={{ background: "url('/background.jpg') center/cover no-repeat" }}
        />
        <ApiKeyProvider>{children}</ApiKeyProvider>
      </body>
    </html>
  );
}
