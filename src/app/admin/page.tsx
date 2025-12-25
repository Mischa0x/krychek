'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return <Loading />;
  if (!session?.user?.isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      <div className="bg-spotify-darkgray rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Session Info</h2>
        <div className="space-y-2 text-spotify-lightgray">
          <p><span className="font-medium text-white">User ID:</span> {session.user.id}</p>
          <p><span className="font-medium text-white">Email:</span> {session.user.email}</p>
          <p><span className="font-medium text-white">Name:</span> {session.user.name}</p>
          <p><span className="font-medium text-white">Admin:</span> {session.user.isAdmin ? 'Yes' : 'No'}</p>
          <p><span className="font-medium text-white">Token Status:</span> {session.error ? 'Error: ' + session.error : 'Valid'}</p>
        </div>
      </div>
    </div>
  );
}
