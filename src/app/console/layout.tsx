import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository, type User } from '@/models/User';
import { Sidebar } from '@/components/console/Sidebar';
import { TopBar } from '@/components/console/TopBar';

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user from session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');
  
  if (!sessionCookie?.value) {
    redirect('/login');
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect('/login');
  }

  // Fetch fresh user data
  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 ml-[260px] transition-[margin] duration-300">
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
