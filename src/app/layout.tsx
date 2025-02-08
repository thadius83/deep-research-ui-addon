import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Research AI',
  description: 'Using AI to enhance your search experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-950 dark:to-purple-950">
        {children}
      </body>
    </html>
  )
}
