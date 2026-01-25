'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login - login page will handle redirecting authenticated users
    router.replace('/login');
  }, [router]);

  return null;
}
