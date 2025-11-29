
import {
    GoogleAuthProvider,
    signInWithPopup,
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
            // Use signInWithPopup for better localhost support and easier debugging
            const result = await signInWithPopup(auth, provider);

            // Get the Google Access Token
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                // Save token for SyncManager to use
                localStorage.setItem('google_access_token', token);
                console.log('✅ Google Access Token saved');
            } else {
                console.warn('⚠️ No access token returned from Google Sign-In');
            }
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
