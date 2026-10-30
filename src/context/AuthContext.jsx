import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const isPreviewHost = () => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'test.wildtype.app' || h.startsWith('test-') || h.endsWith('.vercel.app');
};

export const getApexUrl = () => {
    if (typeof window !== 'undefined') {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5173';
        if (isPreviewHost()) return 'https://test.wildtype.app';
    }
    return 'https://wildtype.app';
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        // Local Development Mock
        if (import.meta.env.DEV) {
            console.log('DEV MODE: Simulating authenticated user for localhost');
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setUser({
                id: 'mock-user-id',
                email: 'dev@wildtype.app',
                name: 'Developer Mode',
                role: 'admin'
            });
            setLoading(false);
            return;
        }

        try {
            // Call our local proxy instead of external API directly
            const response = await fetch('/api/auth/session', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else if (response.status === 403) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Access Forbidden:', errorData.error);
                alert(errorData.error || 'Bu uygulamaya erişim yetkiniz bulunmamaktadır.');
                window.location.href = getApexUrl();
            } else {
                console.warn('Authentication failed, redirecting to login...');
                window.location.href = `${getApexUrl()}/login`;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = `${getApexUrl()}/login`;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        window.location.href = `${getApexUrl()}/login`;
    };

    useEffect(() => {
        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-500 animate-pulse">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
