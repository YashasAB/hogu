
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DatingApp() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dating/app/matches');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to matches...</p>
      </div>
    </div>
  );
}
