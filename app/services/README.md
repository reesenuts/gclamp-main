# API Services Documentation

This directory contains all API service modules for connecting to the PHP backend.

## Structure

- **`api/client.ts`** - Core API client with JWT authentication, token management, and request/response interceptors
- **`auth.service.ts`** - Authentication service (login, logout, user management)
- **`student.service.ts`** - Student-related endpoints (profile, enrollment, etc.)
- **`lamp.service.ts`** - Learning Management System endpoints (classes, activities, posts, etc.)
- **`general.service.ts`** - General endpoints (settings, announcements, etc.)

## Usage

### Basic API Call

```typescript
import { lampService } from '../services';

// Get student classes
const response = await lampService.getStudentClasses({
  studentId: '202211523'
});

if (response.status.rem === 'success' && response.data) {
  console.log('Classes:', response.data);
}
```

### Authentication

```typescript
import { authService } from '../services';

// Login
const user = await authService.login({
  username: '202211523',
  password: 'password',
  device: 'mobile'
});

// Check authentication
const isAuth = await authService.isAuthenticated();

// Get current user
const currentUser = await authService.getCurrentUser();

// Logout
await authService.logout();
```

### Using the useApi Hook

```typescript
import { useApi } from '../hooks/useApi';
import { lampService } from '../services';

function MyComponent() {
  const { execute, loading, error, data } = useApi();

  const loadClasses = async () => {
    await execute(() => lampService.getStudentClasses({
      studentId: '202211523'
    }));
  };

  return (
    <View>
      {loading && <Text>Loading...</Text>}
      {error && <Text>Error: {error}</Text>}
      {data && <Text>Data loaded!</Text>}
    </View>
  );
}
```

## Features

- ✅ JWT token authentication with automatic header injection
- ✅ Secure token storage using expo-secure-store
- ✅ Token expiration checking with 5-minute buffer
- ✅ Automatic token refresh handling (triggers re-login)
- ✅ Request/response interceptors
- ✅ Centralized error handling
- ✅ TypeScript type safety
- ✅ File upload support

## Configuration

API base URL is configured in `app/config/api.ts`. Update the URL for different environments:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost/testapilamp/student/lamp.php'
  : 'http://gclamp/testapilamp/student/lamp.php';
```

## Error Handling

All errors are automatically handled and converted to user-friendly messages. Use the `getErrorMessage` utility for custom error handling:

```typescript
import { getErrorMessage } from '../utils/errorHandler';

try {
  await lampService.getStudentClasses({ studentId: '123' });
} catch (error) {
  const message = getErrorMessage(error);
  Alert.alert('Error', message);
}
```

