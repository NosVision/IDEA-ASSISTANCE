import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthService } from '../../services/auth/GoogleAuth';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import '../../config/firebase'; // Force load Firebase config
import { useAuth } from '../../contexts/AuthContext'; // Ensure AuthContext is loaded

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    useAuth(); // This ensures AuthContext and Firebase are initialized
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        console.log('🔵 Sign in button clicked');
        setLoading(true);
        setError(null);
        try {
            console.log('🔵 Calling GoogleAuthService.signInWithGoogle()...');
            await GoogleAuthService.signInWithGoogle();
            console.log('✅ Sign in successful!');
            // With popup, we can navigate immediately after success
            navigate('/voice');
        } catch (err: any) {
            console.error('❌ Login failed:', err);
            console.error('❌ Error code:', err.code);
            console.error('❌ Error message:', err.message);

            let errorMessage = 'Failed to sign in. ';
            if (err.code === 'auth/configuration-not-found') {
                errorMessage += 'Firebase configuration error. Please check your setup.';
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage += 'Popup was blocked. Please allow popups for this site.';
            } else if (err.code === 'auth/popup-closed-by-user') {
                errorMessage += 'Sign in was cancelled.';
            } else {
                errorMessage += err.message || 'Please check your connection and try again.';
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/voice');
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            color: '#333'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Sparkles size={32} />
                    </div>
                </div>

                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                    IDEA ASSISTANCE
                </h1>
                <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                    Your AI-powered personal assistant for capturing ideas, notes, and tasks effortlessly.
                </p>

                {error && (
                    <div style={{
                        padding: '10px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid #ddd',
                        background: 'white',
                        color: '#333',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '16px',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                style={{ width: '20px', height: '20px' }}
                            />
                            Sign in with Google
                        </>
                    )}
                </button>

                <button
                    onClick={handleSkip}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '100%'
                    }}
                >
                    Continue without login <ArrowRight size={14} />
                </button>
            </motion.div>
        </div>
    );
};

export default LoginPage;
