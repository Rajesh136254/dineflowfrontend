import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserSignupPage from './UserSignupPage';
import LoginPage from './LoginPage';

const CustomerAuthPage = () => {
    const [searchParams] = useSearchParams();
    // Initialize isSignup based on 'mode' query param. Default to true (signup) unless mode is 'login'.
    const [isSignup, setIsSignup] = useState(searchParams.get('mode') !== 'login');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Update isSignup when URL mode changes
    useEffect(() => {
        setIsSignup(searchParams.get('mode') !== 'login');
    }, [searchParams]);

    // Removed automatic redirection useEffect to prevent conflicts
    // Redirection is now handled by UserSignupPage (after signup) and LoginPage (after login)

    // Video state
    const [showVideo, setShowVideo] = useState(true);

    const handleVideoEnd = () => {
        setShowVideo(false);
    };

    if (showVideo) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white'
            }}>
                <video
                    src="/intro-video.mp4"
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            {isSignup ?
                <UserSignupPage redirectUrl={`/login?mode=login${searchParams.get('table') ? `&table=${searchParams.get('table')}` : ''}`} /> :
                <LoginPage redirectUrl={`/customer.html${searchParams.get('table') ? `?table=${searchParams.get('table')}` : ''}`} />
            }
            <div className="text-center mt-4">
                <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    );
};

export default CustomerAuthPage;