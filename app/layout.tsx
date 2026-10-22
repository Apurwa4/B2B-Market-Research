import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'iGT · Market Research',
  description: 'Winter 26.27 centralized company research, outreach, and team resources.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
