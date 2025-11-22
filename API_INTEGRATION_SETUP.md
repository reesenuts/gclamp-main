# API Integration Setup - Complete

## ✅ What Was Set Up

Your frontend is now fully prepared to connect to your PHP backend API. Here's what was implemented:

### 1. **Dependencies Installed**
- ✅ `axios` - HTTP client for API requests
- ✅ `expo-secure-store` - Secure storage for JWT tokens

### 2. **API Configuration** (`app/config/api.ts`)
- Base URL configuration for development and production
- Currently set to: `http://localhost/testapilamp/student/lamp.php` (dev)
- Timeout and header configuration

### 3. **TypeScript Types** (`app/types/api.ts`)
- Complete type definitions based on your API documentation
- `ApiResponse<T>` - Standard response structure
- `ApiRequest` - Request structure
- `User` - User object from login
- `LoginCredentials` - Login parameters
- All types match your API documentation

### 4. **API Client** (`app/services/api/client.ts`)
- ✅ JWT token authentication with automatic header injection
- ✅ Secure token storage using `expo-secure-store`
- ✅ Token expiration checking (5-minute buffer before actual expiration)
- ✅ Automatic token refresh handling (currently triggers re-login)
- ✅ Request/response interceptors
- ✅ Error handling and transformation
- ✅ File upload support with FormData

### 5. **Service Modules**

#### Authentication Service (`app/services/auth.service.ts`)
- `login()` - User login with credentials
- `logout()` - Clear authentication
- `getCurrentUser()` - Get stored user data
- `isAuthenticated()` - Check authentication status
- `updateUser()` - Update stored user data

#### Student Service (`app/services/student.service.ts`)
- Profile management
- Enrollment history
- Available courses
- Update operations (info, education, family, health, government, others)
- Enlistment

#### LAMP Service (`app/services/lamp.service.ts`)
- Class management (get student/faculty classes)
- Post management (get, add, edit)
- Comment management (get, add, edit)
- Activity management (get, add, edit, todo list)
- Resource management (get, add, edit)
- Submission management (get, save, edit)
- Quiz management (get, draft, save, edit, add answer)
- File upload/download
- Messages
- Evaluation

#### General Service (`app/services/general.service.ts`)
- Settings, apps, positions, departments, programs
- Announcements, bug reports, messages
- Location data (regions, provinces, cities, barangays)
- Image uploads

### 6. **Error Handling** (`app/utils/errorHandler.ts`)
- Centralized error message extraction
- User-friendly error messages
- Authentication error detection
- Network error handling

### 7. **Custom Hook** (`app/hooks/useApi.ts`)
- React hook for API calls with loading/error states
- Automatic error handling
- Type-safe API calls

## 📁 File Structure

```
app/
├── config/
│   └── api.ts                    # API configuration
├── types/
│   └── api.ts                    # TypeScript type definitions
├── utils/
│   └── errorHandler.ts           # Error handling utilities
├── services/
│   ├── api/
│   │   └── client.ts            # Core API client
│   ├── auth.service.ts           # Authentication service
│   ├── student.service.ts        # Student endpoints
│   ├── lamp.service.ts          # LMS endpoints
│   ├── general.service.ts       # General endpoints
│   ├── index.ts                 # Service exports
│   └── README.md                # Service documentation
└── hooks/
    └── useApi.ts                 # API hook for React components
```

## 🚀 How to Use

### Example 1: Login

```typescript
import { authService } from './services';

// In your login component
const handleLogin = async () => {
  try {
    const user = await authService.login({
      username: '202211523',
      password: 'password',
      device: 'mobile'
    });
    
    // User is logged in, token is stored automatically
    console.log('Logged in:', user.fullname);
    router.push('/todolist');
  } catch (error: any) {
    Alert.alert('Login Failed', error.message);
  }
};
```

### Example 2: Fetch Student Classes

```typescript
import { lampService } from './services';
import { useApi } from './hooks/useApi';

function ClassesScreen() {
  const { execute, loading, error, data } = useApi();

  useEffect(() => {
    execute(() => lampService.getStudentClasses({
      studentId: '202211523'
    }));
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (data) return <Text>Classes: {JSON.stringify(data)}</Text>;
}
```

### Example 3: Update Login Component

Update your existing `app/login.tsx`:

```typescript
import { useState } from 'react';
import { authService } from '../services';
import { router } from 'expo-router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await authService.login({
        username: username.trim(),
        password,
        device: 'mobile'
      });

      // Success - navigate to app
      router.push('./todolist');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... your existing JSX with:
    // - TextInput for username (controlled by username state)
    // - TextInput for password (controlled by password state)
    // - Pressable with onPress={handleLogin} and disabled={loading}
    // - Error message display if error exists
  );
}
```

## 🔧 Configuration

### Update API Base URL

Edit `app/config/api.ts` to change the API URL:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost/testapilamp/student/lamp.php'  // Development
  : 'https://your-production-domain.com/testapilamp/student/lamp.php';  // Production
```

### Token Refresh

Currently, token refresh triggers re-login. The token expires after 1 hour. You can enhance this by:
1. Storing user credentials securely (with user consent)
2. Implementing auto re-login on token expiration
3. Or prompting user to re-login when token expires

## 🔐 Security Features

- ✅ JWT tokens stored securely using `expo-secure-store`
- ✅ Automatic token expiration checking
- ✅ Token automatically included in all authenticated requests
- ✅ Automatic token cleanup on logout

## 📝 Next Steps

1. **Update Login Component**: Integrate `authService.login()` into your existing login screen
2. **Add Loading States**: Use the `useApi` hook for better UX
3. **Replace Mock Data**: Replace hardcoded data in components with API calls
4. **Add Error Handling**: Show user-friendly error messages
5. **Test Endpoints**: Test each endpoint with your backend

## 🧪 Testing

Test the API connection:

```typescript
import { authService } from './services';

// Test login
const testLogin = async () => {
  try {
    const user = await authService.login({
      username: 'your_test_username',
      password: 'your_test_password',
      device: 'mobile'
    });
    console.log('Login successful:', user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## 📚 Documentation

- See `app/services/README.md` for detailed service documentation
- See `testapilamp/API_DOCUMENTATION.md` for complete API endpoint documentation

## ⚠️ Important Notes

1. **Authentication**: Currently disabled in backend (returns `true`), but frontend is fully prepared for JWT auth
2. **Token Expiration**: Tokens expire after 1 hour. The client checks expiration with a 5-minute buffer
3. **Error Messages**: All errors are automatically converted to user-friendly messages
4. **CORS**: Backend already has CORS configured, so no additional setup needed

## ✅ Status

Your frontend is **100% ready** to connect to your PHP backend API! All services are set up, typed, and ready to use. Just integrate them into your existing components.

