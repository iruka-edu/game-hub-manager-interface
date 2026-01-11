import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository, type User } from '@/models/User';
import { Sidebar } from '@/components/console/Sidebar';
import { TopBar } from '@/components/console/TopBar';

// Serialize user for client components (convert ObjectId to string)
function serializeUser(user: User) {
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    roles: user.roles,
    isActive: user.isActive,
    avatar: user.avatar,
    teamIds: user.teamIds?.map(id => id.toString()),
    createdBy: user.createdBy?.toString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

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

  // Serialize user for client components
  const serializedUser = serializeUser(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={serializedUser} />
      <div className="flex-1 ml-[260px] transition-[margin] duration-300">
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
