import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Shared household finance management',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
