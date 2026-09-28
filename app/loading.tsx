import LoadingSpinner from '@/components/LoadingSpinner';

// Next's route-level Suspense fallback — shown automatically while
// app/page.tsx awaits getCurrentProfile() during navigation (e.g. right
// after dev-login redirects to "/"), not just during the client-side data
// bootstrap inside BizYepApp.
export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <LoadingSpinner />
    </div>
  );
}
