import { z } from 'zod';

/**
 * User schema with validation
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * User type derived from schema
 */
export type User = z.infer<typeof userSchema>;

/**
 * API response schema with validation
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

/**
 * API response type derived from schema
 */
export type ApiResponse<T = unknown> = z.infer<typeof apiResponseSchema> & {
  data?: T;
};

/**
 * Pagination parameters schema
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Pagination parameters type
 */
export type PaginationParams = z.infer<typeof paginationParamsSchema>;

/**
 * Paginated response schema
 */
export const paginatedResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

/**
 * Paginated response type
 */
export type PaginatedResponse<T = unknown> = Omit<z.infer<typeof paginatedResponseSchema>, 'items'> & {
  items: T[];
};

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters type
 */
export type SortParams<T extends string> = {
  field: T;
  direction: SortDirection;
}; 