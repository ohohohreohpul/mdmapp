import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface UserContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mustResetPassword: boolean }>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (userId: string, newPassword: string, currentPassword?: string) => Promise<void>;
  updateProgress: (courseId: string, lessonId: string) => Promise<void>;
  getUserProgress: (courseId: string) => any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Try to refresh user data from server
        try {
          const response = await axios.get(`${API_URL}/api/users/${parsedUser._id}`);
          if (response.data) {
            setUser(response.data);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (refreshError: any) {
          if (refreshError.response?.status === 404) {
            await AsyncStorage.removeItem('user');
            setUser(null);
          }
          // For other errors keep local data
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with email + password.
   * Returns { mustResetPassword } so the caller can redirect to change-password screen.
   */
  const login = async (email: string, password: string): Promise<{ mustResetPassword: boolean }> => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const userData = response.data;
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    return { mustResetPassword: !!userData.must_reset_password };
  };

  /** Register a new account. */
  const register = async (username: string, email: string, password: string): Promise<void> => {
    const response = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
    const userData = response.data;
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  /** Change password — used by first-login reset flow and settings screen. */
  const changePassword = async (
    userId: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/change-password`, {
      user_id: userId,
      new_password: newPassword,
      current_password: currentPassword,
    });
    // Refresh user so must_reset_password clears
    const refreshed = await axios.get(`${API_URL}/api/users/${userId}`);
    if (refreshed.data) {
      setUser(refreshed.data);
      await AsyncStorage.setItem('user', JSON.stringify(refreshed.data));
    }
  };

  const updateProgress = async (courseId: string, lessonId: string) => {
    if (!user) return;
    try {
      await axios.post(`${API_URL}/api/progress/lesson-complete`, null, {
        params: { user_id: user._id, lesson_id: lessonId, course_id: courseId },
      });
      await loadUser();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getUserProgress = (courseId: string) => {
    if (!user || !user.progress) return null;
    return user.progress[courseId] || { completed_lessons: [], quiz_scores: {} };
  };

  return (
    <UserContext.Provider
      value={{ user, loading, login, register, logout, changePassword, updateProgress, getUserProgress }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
