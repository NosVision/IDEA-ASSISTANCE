import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

import { GoogleAuthService } from '../services/auth/GoogleAuth';
import { SupabaseService } from '../services/supabase/SupabaseService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            // Create/update Supabase profile when user logs in
            if (user) {
                await SupabaseService.getOrCreateUserProfile(
                    user.uid,
                    user.email,
                    user.displayName
                );
            }

            setLoading(false);
        });

        // Handle redirect result
        console.log('🔵 Checking getRedirectResult...');
        getRedirectResult(auth).then(async (result) => {
            console.log('🔵 getRedirectResult result:', result);
            if (result) {
                console.log('✅ Redirect login successful, user:', result.user.email);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential?.accessToken) {
                    localStorage.setItem('google_access_token', credential.accessToken);
                }
                // Redirect to voice page after successful login
                console.log('🔄 Redirecting to /voice...');
                window.location.href = '/voice';
            } else {
                console.log('⚪ No redirect result found (normal if not returning from redirect)');
            }
        }).catch((error) => {
            console.error('❌ Redirect Login Error:', error);
            console.error('❌ Error Code:', error.code);
            console.error('❌ Error Message:', error.message);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        await GoogleAuthService.signInWithGoogle();
    };

    const signOut = async () => {
        await GoogleAuthService.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
