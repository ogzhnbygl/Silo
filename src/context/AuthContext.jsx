import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
                window.location.href = 'https://wildtype.app';
            } else {
                console.warn('Authentication failed, redirecting to login...');
                window.location.href = 'https://wildtype.app/login';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'https://wildtype.app/login';
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        window.location.href = 'https://wildtype.app';
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
