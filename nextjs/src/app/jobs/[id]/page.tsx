import JobDetailClient from './JobDetailClient';

// Required for Next.js static export with dynamic routes
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
