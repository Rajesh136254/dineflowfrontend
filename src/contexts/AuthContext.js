import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('[AUTH INIT] Starting authentication initialization...');

      // 1. Load any existing auth state from localStorage
      let storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('[AUTH INIT] Stored token:', storedToken ? 'EXISTS' : 'NULL');
      console.log('[AUTH INIT] Stored user:', storedUser ? 'EXISTS' : 'NULL');

      // 2. If there is no token yet, but a `token` is present in the URL
      //    (e.g. after redirect from main domain to company subdomain),
      //    persist it so admin/analytics can work on the tenant domain.
      if (!storedToken) {
        const searchParams = new URLSearchParams(window.location.search);
        const urlToken = searchParams.get('token');

        console.log('[AUTH INIT] URL token:', urlToken ? 'FOUND' : 'NOT FOUND');

        if (urlToken) {
          storedToken = urlToken;
          localStorage.setItem('token', urlToken);
          console.log('[AUTH INIT] ✅ Token saved from URL to localStorage');

          // Clean token from the URL for security / neatness
          searchParams.delete('token');
          const newQuery = searchParams.toString();
          const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
          window.history.replaceState({}, '', newUrl);
          console.log('[AUTH INIT] ✅ Token removed from URL');
        }
      }

      if (storedToken) {
        setToken(storedToken);
        console.log('[AUTH INIT] Token set in state');

        // If we have a token but no user data, fetch it from the backend
        if (!storedUser) {
          console.log('🔄 Token found but no user data - fetching from backend...');
          console.log('[AUTH INIT] API URL:', API_URL);
          console.log('[AUTH INIT] Making request to:', `${API_URL}/api/auth/me`);

          try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });

            console.log('[AUTH INIT] Response status:', response.status);
            console.log('[AUTH INIT] Response ok:', response.ok);

            if (response.ok) {
              const data = await response.json();
              console.log('[AUTH INIT] Response data:', data);

              if (data.success && data.user) {
                console.log('✅ User data fetched from backend:', data.user);
                const userData = {
                  ...data.user,
                  permissions: data.user.permissions || null
                };
                localStorage.setItem('user', JSON.stringify(userData));
                setCurrentUser(userData);
                console.log('[AUTH INIT] ✅ User data saved to localStorage and state');
              } else {
                console.error('[AUTH INIT] ❌ Response success is false or no user in response');
              }
            } else {
              const errorText = await response.text();
              console.warn('⚠️ Failed to fetch user data - token may be invalid');
              console.warn('[AUTH INIT] Error response:', errorText);

              // Token is invalid, clear it
              localStorage.removeItem('token');
              setToken(null);
              window.location.href = '/signup?mode=login';
            }
          } catch (error) {
            console.error('❌ Error fetching user data:', error);
            console.error('[AUTH INIT] Error details:', error.message, error.stack);
          }
        } else {
          console.log('[AUTH INIT] Using stored user data');
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          console.log('[AUTH INIT] ✅ User loaded from localStorage:', parsedUser);
        }
      } else {
        console.log('[AUTH INIT] No token available - user not authenticated');
      }

      setIsLoading(false);
      console.log('[AUTH INIT] ✅ Authentication initialization complete');
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const authToken = data.data.token;
        const userData = {
          ...data.data,
          permissions: data.data.permissions || null
        };
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setCurrentUser(userData);
        return { success: true, user: userData, company: data.company };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const signup = async (fullName, email, password, role = 'customer') => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, email, password, role })
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login after successful signup
        // Backend returns: { success, data: { id, full_name, email, role, company_id, token }, company }
        const authToken = data.data.token;
        const userData = {
          ...data.data,
          permissions: data.data.permissions || null
        };

        console.log('[SIGNUP] Storing auth data:', { token: authToken, user: userData });

        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setCurrentUser(userData);

        return {
          success: true,
          message: 'Registration successful!',
          user: userData,
          company: data.company
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('[SIGNUP] Error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    // Capture user role BEFORE clearing storage
    let role = null;
    if (currentUser && currentUser.role) {
      role = currentUser.role;
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('user'));
        if (stored) role = stored.role;
      } catch (e) { }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);

    // Force a page reload to ensure clean state with correct redirect
    if (role === 'admin' || role === 'staff') {
      window.location.href = '/signup?mode=login';
    } else {
      window.location.href = '/login?mode=login';
    }
  };

  const updateAuthState = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
    setToken(userData.token);
    setCurrentUser(userData);
  };

  const value = {
    currentUser,
    token,
    isLoading,
    login,
    signup,
    logout,
    updateAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;