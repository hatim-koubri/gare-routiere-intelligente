import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Gare Routière 4.0',
  description: 'Moroccan smart bus station management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} min-h-screen antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
            {children}
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}