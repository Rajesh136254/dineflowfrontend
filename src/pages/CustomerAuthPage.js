import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import UserSignupPage from './UserSignupPage';

const CustomerAuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tableNumber = searchParams.get('table') || '1';
    const redirectUrl = `/customer.html?table=${tableNumber}`;

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            navigate(redirectUrl);
        }
    }, [navigate, redirectUrl]);

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <i className="fas fa-utensils text-white text-2xl"></i>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isLogin ? (
                        <>
                            Or{' '}
                            <button onClick={toggleAuthMode} className="font-medium text-blue-600 hover:text-blue-500">
                                create a new account
                            </button>
                        </>
                    ) : (
                        <>
                            Or{' '}
                            <button onClick={toggleAuthMode} className="font-medium text-blue-600 hover:text-blue-500">
                                sign in to your existing account
                            </button>
                        </>
                    )}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {isLogin ? (
                    <LoginPage redirectUrl={redirectUrl} />
                ) : (
                    <UserSignupPage redirectUrl={redirectUrl} />
                )}
            </div>
        </div>
    );
};

export default CustomerAuthPage;