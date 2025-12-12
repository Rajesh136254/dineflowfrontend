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

    // Video is now integrated as background in UserSignupPage, so we don't need a separate blocking video here.
    // If you want a specific intro video only for this wrapper, we could keep it, but user request implies
    // they want the "UserSignupPage" (with video BG) to be the experience.

    const table = searchParams.get('table');
    const branch = searchParams.get('branch_id');
    const getQuery = (prefix = '?') => {
        const parts = [];
        if (table) parts.push(`table=${table}`);
        if (branch) parts.push(`branch_id=${branch}`);
        return parts.length ? `${prefix}${parts.join('&')}` : '';
    };

    return (
        <div>
            {isSignup ?
                <UserSignupPage redirectUrl={`/login?mode=login${getQuery('&')}`} /> :
                <LoginPage redirectUrl={`/customer.html${getQuery('?')}`} />
            }
            <div className="fixed bottom-4 w-full text-center z-20">
                <button
                    onClick={() => {
                        const newMode = isSignup ? 'login' : 'signup';
                        // Update URL to match state
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('mode', newMode);
                        navigate(`?${newParams.toString()}`);
                        setIsSignup(!isSignup);
                    }}
                    className="text-white hover:text-gray-200 font-medium px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm transition"
                >
                    {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    );
};

export default CustomerAuthPage;