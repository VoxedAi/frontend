import { useUser } from '@/contexts/UserContext';

/**
 * Home page component
 * This is the main landing page for authenticated users
 */
export function HomePage() {
  const { user } = useUser();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Welcome{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
      <p className="text-lg">This is your application dashboard.</p>
    </div>
  );
}

export default HomePage; 