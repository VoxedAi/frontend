import { SignUp } from '@clerk/clerk-react';

/**
 * Sign up page component
 * Uses Clerk's SignUp component for user registration
 */
export function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </a>
          </p>
        </div>
        
        <div className="mt-8">
          <SignUp routing="path" path="/sign-up" />
        </div>
      </div>
    </div>
  );
}

export default SignUpPage; 