'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BlogRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') || '1';

  useEffect(() => {
    router.replace(`/articles/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense>
      <BlogRedirect />
    </Suspense>
  );
}
