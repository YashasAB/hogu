
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hogu Dating - Find Your Perfect Match',
  description: 'Quality connections in Bengaluru. Curated matches and meaningful relationships.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
