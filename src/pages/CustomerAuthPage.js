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

    // Check if user is already logged in
    useEffect(() => {
        if (currentUser) {
            const tableNumber = searchParams.get('table') || '1';
            // Check if user has the correct role
            if (currentUser.role === 'user') {
                navigate(`/customer.html?table=${tableNumber}`);
            } else {
                navigate('/dashboard'); // Redirect admins to dashboard
            }
        }
    }, [currentUser, navigate, searchParams]);

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