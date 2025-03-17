import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type UrlStateOptions<T> = {
  key: string;
  defaultValue: T;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
};

/**
 * A hook for managing complex UI state in the URL search parameters.
 * Uses React Router's useSearchParams along with TanStack Query for caching.
 * 
 * @param options Configuration options for the URL state
 * @returns A tuple containing the current state value and a setter function
 */
export function useUrlState<T>({
  key,
  defaultValue,
  serializer = JSON.stringify,
  deserializer = JSON.parse,
}: UrlStateOptions<T>): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const queryKey = ['urlState', key];

  // Get the current value from URL or use default
  const getValue = (): T => {
    const param = searchParams.get(key);
    if (param) {
      try {
        return deserializer(param);
      } catch (error) {
        console.error(`Failed to deserialize URL param ${key}:`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  // Use React Query to cache the value
  const { data = defaultValue } = useQuery({
    queryKey,
    queryFn: getValue,
    // Disable automatic refetching
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Update the URL and the cache
  const setValue = (value: T) => {
    try {
      const serialized = serializer(value);
      
      // Update search params
      const newSearchParams = new URLSearchParams(searchParams);
      
      // Only add the param if it's not the default value
      if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
        newSearchParams.set(key, serialized);
      } else {
        // Remove the param if it's the default value
        newSearchParams.delete(key);
      }
      
      setSearchParams(newSearchParams);
      
      // Update query cache
      queryClient.setQueryData(queryKey, value);
    } catch (error) {
      console.error(`Failed to serialize value for URL param ${key}:`, error);
      // If serialization fails, at least update the query cache
      queryClient.setQueryData(queryKey, value);
    }
  };

  return [data, setValue];
} 