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
    // 1. Load any existing auth state from localStorage
    let storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // 2. If there is no token yet, but a `token` is present in the URL
    //    (e.g. after redirect from main domain to company subdomain),
    //    persist it so admin/analytics can work on the tenant domain.
    if (!storedToken) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');

      if (urlToken) {
        storedToken = urlToken;
        localStorage.setItem('token', urlToken);

        // Clean token from the URL for security / neatness
        searchParams.delete('token');
        const newQuery = searchParams.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }
    }

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedToken && storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
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
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(data.data));
        setToken(authToken);
        setCurrentUser(data.data);
        return { success: true, user: data.data, company: data.company };
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
        // Don't auto-login after signup, let user go to login page
        return { success: true, message: 'Registration successful. Please login.' };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    // Force a page reload to ensure clean state
    window.location.href = '/login?mode=login';
  };

  const value = {
    currentUser,
    token,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;