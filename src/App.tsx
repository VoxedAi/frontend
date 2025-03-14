import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      <p className="mt-2 text-sm text-gray-500">Loading page...</p>
    </div>
  </div>
);

// Route guard components
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/sign-in" element={<PublicRoute><SignInPage /></PublicRoute>} />
        <Route path="/sign-up" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        
        {/* App routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
