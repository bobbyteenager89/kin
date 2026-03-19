import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();
  const clerkName = clerkUser?.fullName ?? clerkUser?.firstName ?? '';

  return (
    <main>
      <OnboardingClient userId={userId} clerkName={clerkName} />
    </main>
  );
}
