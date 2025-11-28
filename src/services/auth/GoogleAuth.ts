
import {
    GoogleAuthProvider,
    signInWithRedirect,
    signOut as firebaseSignOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../../config/firebase';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    accessToken?: string;
}

export class GoogleAuthService {
    static async signInWithGoogle(): Promise<void> {
        const provider = new GoogleAuthProvider();

        // Request Google Drive access
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        provider.addScope('https://www.googleapis.com/auth/drive.appdata');

        try {
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    }

    static async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth);
            localStorage.removeItem('google_access_token');
        } catch (error) {
            console.error('Sign Out Error:', error);
            throw error;
        }
    }

    static getCurrentUser(): User | null {
        return auth.currentUser;
    }
}
