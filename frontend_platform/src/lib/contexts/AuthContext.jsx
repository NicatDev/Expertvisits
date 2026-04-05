"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { id, username, email, profile: { avatar, ... } }
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // Verify token and get user data
                    const { data } = await auth.getProfile();
                    setUser(data);
                } catch (error) {
                    console.error("Auth check failed", error);
                    // If 401, clear token
                    // Only logout if definitively unauthorized
                    if (error.response && error.response.status === 401) {
                        auth.logout();
                        setUser(null);
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username, password) => {
        const { data } = await auth.login({ username, password });
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);

        // Fetch full profile immediately after login
        try {
            const profileRes = await auth.getProfile();
            console.log("Login User fetched:", profileRes.data);
            setUser(profileRes.data);
            // Ensure state propagation is attempted before return
            await new Promise(resolve => setTimeout(resolve, 0));
            router.refresh(); // Update server components/header
        } catch (err) {
            console.error("Failed to fetch profile after login", err);
            // Fallback
            setUser({ username });
        }

        return data; // Caller can handle routing
    };

    const logout = () => {
        auth.logout();
        setUser(null);
        router.replace('/');
        setTimeout(() => router.refresh(), 100);
    };

    const loginWithTokens = (access, refresh, userData) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        setUser(userData);
        router.refresh();
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const { data } = await auth.getProfile();
                setUser(data);
            } catch (error) {
                console.error("Refresh user failed", error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, loginWithTokens, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
