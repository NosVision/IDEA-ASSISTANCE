import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAikrAy568BqAL7jv3WxYn59qo7nBRwrrk',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'idea-assistance.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'idea-assistance',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'idea-assistance.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '776139245532',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:776139245532:web:e9fb4f6b0e364d5cefb119'
};

// Debug: Check if Firebase config is loaded
console.log('🔥 Firebase Config Status:', {
    apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Loaded' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Loaded' : '✗ Missing',
    fullConfig: firebaseConfig
});

// Validate required fields
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('❌ Firebase config is incomplete!', firebaseConfig);
    throw new Error('Firebase configuration is missing required fields');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log('✅ Firebase initialized successfully');
