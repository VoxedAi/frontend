import { Link } from 'react-router-dom';

/**
 * 404 Not Found page component
 * Displayed when a user navigates to a non-existent route
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
      <h1 className="text-9xl font-bold text-gray-900 dark:text-white">404</h1>
      <h2 className="mb-8 text-2xl font-medium text-gray-600 dark:text-gray-400">Page Not Found</h2>
      <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Go back home
      </Link>
    </div>
  );
}

export default NotFoundPage; 