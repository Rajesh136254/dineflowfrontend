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

    return (
        <div>
            {isSignup ?
                <UserSignupPage redirectUrl={`/login?mode=login&table=${searchParams.get('table') || '1'}`} /> :
                <LoginPage redirectUrl={`/customer.html?table=${searchParams.get('table') || '1'}`} />
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