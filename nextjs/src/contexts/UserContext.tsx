'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// localStorage wrapper — safe for SSR
const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

interface UserContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mustResetPassword: boolean; hasResumeSetup: boolean }>;
  loginWithData: (userData: any) => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (userId: string, newPassword: string, currentPassword?: string) => Promise<void>;
  updateProfile: (userId: string, fields: { username?: string; display_name?: string }) => Promise<void>;
  markResumeSetup: (userId: string) => Promise<void>;
  updateProgress: (courseId: string, lessonId: string) => Promise<void>;
  getUserProgress: (courseId: string) => any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = storage.get('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        try {
          const res = await axios.get(`${API_URL}/api/users/${parsed._id}`);
          if (res.data) {
            setUser(res.data);
            storage.set('user', JSON.stringify(res.data));
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
            storage.remove('user');
            setUser(null);
          }
        }
      }
    } catch (e) {
      console.error('loadUser error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const userData = res.data;
    setUser(userData);
    storage.set('user', JSON.stringify(userData));
    return {
      mustResetPassword: !!userData.must_reset_password,
      hasResumeSetup: !!userData.has_resume_setup,
    };
  };

  const loginWithData = (userData: any) => {
    setUser(userData);
    storage.set('user', JSON.stringify(userData));
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
    const userData = res.data;
    setUser(userData);
    storage.set('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    storage.remove('user');
  };

  const changePassword = async (userId: string, newPassword: string, currentPassword?: string) => {
    await axios.post(`${API_URL}/api/auth/change-password`, {
      user_id: userId,
      new_password: newPassword,
      current_password: currentPassword,
    });
    const res = await axios.get(`${API_URL}/api/users/${userId}`);
    if (res.data) {
      setUser(res.data);
      storage.set('user', JSON.stringify(res.data));
    }
  };

  const updateProfile = async (userId: string, fields: { username?: string; display_name?: string }) => {
    await axios.patch(`${API_URL}/api/users/${userId}`, fields);
    const res = await axios.get(`${API_URL}/api/users/${userId}`);
    if (res.data) {
      setUser(res.data);
      storage.set('user', JSON.stringify(res.data));
    }
  };

  const markResumeSetup = async (userId: string) => {
    try { await axios.post(`${API_URL}/api/resume/skip`, { user_id: userId }); } catch (_) {}
    const updated = { ...user, has_resume_setup: true };
    setUser(updated);
    storage.set('user', JSON.stringify(updated));
  };

  const updateProgress = async (courseId: string, lessonId: string) => {
    if (!user) return;
    try {
      await axios.post(`${API_URL}/api/progress/lesson-complete`, null, {
        params: { user_id: user._id, lesson_id: lessonId, course_id: courseId },
      });
      await loadUser();
    } catch (e) {
      console.error('updateProgress error:', e);
    }
  };

  const getUserProgress = (courseId: string) => {
    if (!user?.progress) return { completed_lessons: [], quiz_scores: {} };
    return user.progress[courseId] || { completed_lessons: [], quiz_scores: {} };
  };

  return (
    <UserContext.Provider value={{ user, loading, login, loginWithData, register, logout, changePassword, updateProfile, markResumeSetup, updateProgress, getUserProgress }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
