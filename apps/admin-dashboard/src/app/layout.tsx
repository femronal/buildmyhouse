'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Poppins } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileShell from '@/components/MobileShell';
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
  const isPublicPage = pathname === '/login' || pathname === '/accept-invite';

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased bg-gray-100 font-poppins`}>
        <QueryClientProvider client={queryClient}>
          {isPublicPage ? (
            children
          ) : (
            <ProtectedRoute>
              <div className="min-h-screen md:flex md:items-stretch">
                <div className="hidden md:flex md:shrink-0">
                  <Sidebar />
                </div>

                <MobileShell />

                <main className="admin-content min-h-screen min-w-0 flex-1 pb-24 md:pb-0">
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
