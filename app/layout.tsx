import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
export const metadata: Metadata = {
  title: 'iGT · Market Research',
  description: 'Winter 26.27 centralized company research, outreach, and team resources for AIESEC in Kandy.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
