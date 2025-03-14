import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Query key factory for type-safe query keys
 */
export const queryKeys = {
  // User related queries
  user: {
    all: ['users'] as const,
    details: (userId: string) => [...queryKeys.user.all, userId] as const,
    preferences: (userId: string) => [...queryKeys.user.details(userId), 'preferences'] as const,
  },
  
  // Content related queries
  content: {
    all: ['content'] as const,
    details: (contentId: string) => [...queryKeys.content.all, contentId] as const,
  },
  
  // Custom query key generator
  custom: <T extends string[]>(...parts: T) => parts as const,
};

export default queryClient; 