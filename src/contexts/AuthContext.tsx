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
        getRedirectResult(auth).then(async (result) => {
            if (result) {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential?.accessToken) {
                    localStorage.setItem('google_access_token', credential.accessToken);
                }
                // User is already handled by onAuthStateChanged, but we can do extra stuff here if needed
            }
        }).catch((error) => {
            console.error('Redirect Login Error:', error);
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
