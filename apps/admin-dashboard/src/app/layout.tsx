'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Poppins } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased bg-gray-100 font-poppins`}>
        <QueryClientProvider client={queryClient}>
          {isLoginPage ? (
            children
          ) : (
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <main className="flex-1 min-h-screen">
                  {children}
                </main>
              </div>
            </ProtectedRoute>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
