'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased bg-gray-100 font-poppins`}>
        <QueryClientProvider client={queryClient}>
          {isLoginPage ? (
            children
          ) : (
            <ProtectedRoute>
              <div className="min-h-screen md:flex">
                <div className="hidden md:block md:shrink-0">
                  <Sidebar />
                </div>

                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">BuildMyHouse</p>
                    <p className="text-xs text-gray-500">Admin Dashboard</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                    Menu
                  </button>
                </header>

                {mobileMenuOpen && (
                  <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50"
                      aria-label="Close navigation menu"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative h-full w-64 max-w-[85vw] shadow-2xl">
                      <Sidebar
                        isMobile
                        onClose={() => setMobileMenuOpen(false)}
                        onNavigate={() => setMobileMenuOpen(false)}
                      />
                    </div>
                  </div>
                )}

                <main className="admin-content min-h-screen min-w-0 flex-1 pb-6 md:pb-0">
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
