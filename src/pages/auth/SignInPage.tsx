import { SignIn } from '@clerk/clerk-react';

/**
 * Sign in page component
 * Uses Clerk's SignIn component for authentication
 */
export function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <a href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              create a new account
            </a>
          </p>
        </div>
        
        <div className="mt-8">
          <SignIn routing="path" path="/sign-in" />
        </div>
      </div>
    </div>
  );
}

export default SignInPage; 