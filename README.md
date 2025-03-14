# VoxAI Frontend

A modern, scalable, and performant web application built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **TypeScript** for type safety and better developer experience
- **React 18** with hooks and functional components
- **Vite** for fast development and optimized production builds
- **Tailwind CSS v4** for utility-first styling
- **React Router v7** for client-side routing
- **React Query** for efficient data fetching and caching
- **Clerk** for authentication and user management
- **Supabase** for backend database and API
- **Mantine** for UI components
- **Zod** for runtime type validation

## Project Structure

```
src/
├── assets/        # Static assets like images, fonts, etc.
├── components/    # Reusable UI components
│   └── layout/    # Layout components like AppLayout
├── contexts/      # React contexts for state management
├── hooks/         # Custom React hooks
├── pages/         # Page components
│   └── auth/      # Authentication pages
├── services/      # API and service integrations
├── styles/        # Global styles and Tailwind customizations
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── App.tsx        # Main App component with routing
└── main.tsx       # Entry point
```

## Environment Configuration

The application uses environment variables for configuration:

- **Development**: Base URL is automatically set to `http://localhost:5173`
- **Production**: Base URL is automatically set to `https://app.voxed.ai`

These URLs are used for authentication redirects and API endpoints.

## Clerk-Supabase Integration

This application integrates Clerk for authentication with Supabase for data storage:

1. **JWT Template**: Create a Supabase JWT template in the Clerk Dashboard
   - Name it `supabase`
   - Use your Supabase JWT Secret as the signing key
   - Set the signing algorithm to `HS256`

2. **Using Authenticated Queries**: 
   - Use the `useSupabaseClient()` hook to get an authenticated client
   - This client automatically includes the JWT token in requests
   - Example:
     ```tsx
     const supabase = useSupabaseClient();
     const { data } = await supabase.from('your_table').select('*');
     ```

3. **Row Level Security**: 
   - Set up RLS policies in Supabase that use the `auth.uid()` function
   - This will match the Clerk user ID passed in the JWT

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9+

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your API keys and configuration.

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:5173.

### Building for Production

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Code Quality

- ESLint for code linting
- TypeScript for static type checking

## Performance Optimizations

- Code splitting with lazy loading
- Optimized bundle size with tree shaking
- Efficient data fetching with React Query
- Memoization of expensive computations

## License

This project is licensed under the terms of the license included in the repository.
