// we use clerk for managing authentication and user sessions
// we use supabase for storing all data
// clerk has a supabase jwt template already for tokens
// this context will make sure supabase and clerk are synced

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ClerkProvider, useAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { env } from '@/utils/env';
import { supabase, createAuthClient } from '@/services/supabase';
import { useTheme } from './ThemeContext';

/**
 * User context interface
 */
interface UserContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: ReturnType<typeof useClerkUser>['user'];
  signOut: () => Promise<void>;
  supabaseToken: string | null;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { theme } = useTheme();
  const baseUrl = env.BASE_URL;
  
  return (
    <ClerkProvider
      publishableKey={env.CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
      }}
      // Configure routing for Clerk
      signInUrl={`${baseUrl}/sign-in`}
      signUpUrl={`${baseUrl}/sign-up`}
      afterSignInUrl={`${baseUrl}/`}
      afterSignUpUrl={`${baseUrl}/`}
    >
      <UserProviderInner>{children}</UserProviderInner>
    </ClerkProvider>
  );
}

function UserProviderInner({ children }: { children: ReactNode }) {
  const { isLoaded: isAuthLoaded, userId: clerkUserId, signOut, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useClerkUser();
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  
  const isLoading = !isAuthLoaded || !isUserLoaded;
  const isAuthenticated = !!clerkUserId && !!user;
  const userId = clerkUserId || null;

  // Get Supabase token from Clerk
  useEffect(() => {
    if (!isAuthenticated) return;

    const getSupabaseToken = async () => {
      try {
        // Get JWT from Clerk with the supabase template
        const token = await getToken({ template: 'supabase' });
        
        if (!token) {
          console.warn('No token received from Clerk for Supabase');
          return;
        }

        // Store the token for use in the context
        setSupabaseToken(token);
        console.log('Successfully retrieved Supabase token from Clerk');
      } catch (error) {
        console.error('Failed to get Clerk token for Supabase:', error);
      }
    };

    // Initial token fetch
    getSupabaseToken();
    
    // Set up interval to refresh token (every 10 minutes)
    const intervalId = setInterval(getSupabaseToken, 10 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, getToken]);
  
  return (
    <UserContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        userId, 
        user, 
        signOut,
        supabaseToken
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use the user context
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
}

/**
 * Hook to get an authenticated Supabase client
 */
export function useSupabaseClient() {
  const { supabaseToken } = useUser();
  
  if (!supabaseToken) {
    // Return the anonymous client if no token is available
    return supabase;
  }
  
  // Return an authenticated client
  return createAuthClient(supabaseToken);
}

export default UserProvider; 