# Frontend Code Structure

This document outlines the clean and organized structure of the MockPie frontend application.

## Directory Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── shared/           # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── index.ts
│   │   ├── layout/           # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── features/         # Feature-specific components
│   │   └── ui/              # Additional UI components
│   ├── constants/           # Application constants
│   │   └── index.ts
│   ├── hooks/              # Custom React hooks
│   │   └── index.ts
│   ├── lib/                # Utility libraries
│   │   └── index.ts
│   ├── services/           # API services
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── index.ts
│   └── [pages]/            # Next.js app router pages
```

## Key Improvements

### 1. Centralized Type Definitions (`types/index.ts`)
- All TypeScript interfaces and types in one place
- Consistent type usage across components
- Easy to maintain and update

### 2. Application Constants (`constants/index.ts`)
- API endpoints and configuration
- Route definitions
- UI constants (colors, spacing, etc.)
- Error and success messages
- File upload configuration

### 3. Utility Functions (`utils/index.ts`)
- Date and time formatting
- File validation and formatting
- String manipulation
- Local storage utilities
- Score normalization
- Color utilities

### 4. Custom Hooks (`hooks/index.ts`)
- Authentication hook (`useAuth`)
- API request hook (`useApi`)
- Local storage hook (`useLocalStorage`)
- Form validation hook (`useFormValidation`)
- Media query hook (`useMediaQuery`)
- Window size hook (`useWindowSize`)

### 5. Shared Components (`components/shared/`)
- Reusable UI components
- Consistent styling and behavior
- TypeScript support
- Accessibility features

### 6. Layout Components (`components/layout/`)
- Sidebar navigation
- Consistent layout structure
- User authentication integration

### 7. Utility Libraries (`lib/index.ts`)
- API client configuration
- Validation schemas
- Error handling utilities
- Date and time utilities
- File utilities
- Color utilities
- Performance utilities

## Usage Examples

### Using Shared Components
```tsx
import { Button, Input, Card, LoadingSpinner } from '@/app/components/shared';

function MyComponent() {
  return (
    <Card>
      <Input label="Email" placeholder="Enter your email" />
      <Button variant="primary" loading={isLoading}>
        Submit
      </Button>
    </Card>
  );
}
```

### Using Custom Hooks
```tsx
import { useAuth, useApi } from '@/app/hooks';
import { useLocalStorage } from '@/app/hooks';

function MyComponent() {
  const { user, login, logout } = useAuth();
  const { data, loading, request } = useApi();
  const [theme, setTheme] = useLocalStorage('theme', 'light');
}
```

### Using Constants
```tsx
import { ROUTES, API_CONFIG, ERROR_MESSAGES } from '@/app/constants';

function MyComponent() {
  const handleClick = () => {
    router.push(ROUTES.DASHBOARD);
  };
}
```

### Using Utilities
```tsx
import { formatDate, normalizeScore, getScoreColor } from '@/app/utils';

function MyComponent() {
  const formattedDate = formatDate('2024-01-01');
  const score = normalizeScore(85);
  const color = getScoreColor(score);
}
```

### Using Types
```tsx
import { User, Presentation, FeedbackData } from '@/app/types';

interface Props {
  user: User;
  presentations: Presentation[];
}
```

## Best Practices

### 1. Import Organization
- Use absolute imports with `@/` prefix
- Group imports: React, external libraries, internal modules, types
- Use index files for cleaner imports

### 2. Component Structure
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Add accessibility attributes

### 3. State Management
- Use custom hooks for complex state logic
- Prefer local state over global state when possible
- Use React Query for server state

### 4. Error Handling
- Use centralized error handling utilities
- Provide meaningful error messages
- Implement proper loading states

### 5. Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Use debounce/throttle for user input
- Lazy load components when appropriate

## Migration Guide

### From Old Structure
1. Replace inline styles with shared components
2. Update imports to use new structure
3. Replace hardcoded values with constants
4. Use custom hooks instead of inline logic
5. Update type definitions

### Example Migration
```tsx
// Before
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/user')
    .then(res => res.json())
    .then(data => setUser(data))
    .finally(() => setLoading(false));
}, []);

// After
const { user, loading } = useAuth();
```

## Adding New Features

### 1. New Component
1. Create component in appropriate directory
2. Add TypeScript interface
3. Export from index file
4. Add to documentation

### 2. New Hook
1. Create hook in `hooks/index.ts`
2. Add proper TypeScript types
3. Include error handling
4. Add usage examples

### 3. New Utility
1. Add to appropriate utility file
2. Include TypeScript types
3. Add unit tests
4. Update documentation

### 4. New Type
1. Add to `types/index.ts`
2. Use consistent naming conventions
3. Add JSDoc comments
4. Update related components

This structure promotes maintainability, reusability, and consistency across the application. 