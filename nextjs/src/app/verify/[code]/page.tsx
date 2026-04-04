// Certificate codes are runtime-only (from API).
// generateStaticParams returns [] so the build succeeds;
// the SPA rewrite in vercel.json handles unknown codes client-side.
// Returns one placeholder so the build succeeds with output:export.
// vercel.json rewrites /verify/:code → /verify/_/ so the pre-built
// shell is served; useParams() still reads the real code from the URL.
export async function generateStaticParams() { return [{ code: '_' }]; }

import VerifyClient from './VerifyClient';

export default function VerifyPage() {
  return <VerifyClient />;
}
