
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DatingAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('dating_access_token');
      
      if (!token) {
        router.push('/dating/login');
        return;
      }

      try {
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email
          });
        } else {
          localStorage.removeItem('dating_access_token');
          localStorage.removeItem('dating_refresh_token');
          router.push('/dating/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/dating/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dating_access_token');
    localStorage.removeItem('dating_refresh_token');
    router.push('/dating');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dating/app" className="text-xl font-bold text-red-500">
                Hogu Dating
              </Link>
              
              <div className="hidden md:flex space-x-6">
                <Link 
                  href="/dating/app/matches"
                  className={`text-sm font-medium transition-colors ${
                    pathname?.includes('/matches') 
                      ? 'text-red-600 border-b-2 border-red-600 pb-4' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Matches
                </Link>
                <Link 
                  href="/dating/app/profile"
                  className={`text-sm font-medium transition-colors ${
                    pathname?.includes('/profile') 
                      ? 'text-red-600 border-b-2 border-red-600 pb-4' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile
                </Link>
                <Link 
                  href="/dating/app/inbox"
                  className={`text-sm font-medium transition-colors ${
                    pathname?.includes('/inbox') 
                      ? 'text-red-600 border-b-2 border-red-600 pb-4' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inbox
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hi, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
