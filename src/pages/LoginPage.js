
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const LoginPage = ({ redirectUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tableNumber = searchParams.get('table');
    const { t, language, changeLanguage } = useLanguage();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const { logout } = useAuth(); // Get logout function

    // Clear session if mode=login is present (forced logout)
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'login') {
            // We can't call logout() directly here because it redirects to /login?mode=login 
            // which would cause an infinite loop if not handled carefully.
            // Instead, we manually clear storage to be safe, or rely on the fact that 
            // the logout function ALREADY redirected us here.
            // But to be double sure, let's clear localStorage.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

                const res = await fetch(`${API_URL}/api/company/public`);
                const json = await res.json();
                if (json.success && json.data) {
                    setCompanyInfo(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();
    }, []);

    // Use environment variable for API URL with fallback
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    // Use redirectUrl if provided, otherwise use default
    const redirectTo = redirectUrl || (tableNumber ? `/customer.html?table=${tableNumber}` : '/customer.html');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // For QR flow (LoginPage), everyone goes to CustomerPage
            // We removed the admin redirect logic from here as requested
            if (result.user && (['user', 'customer'].includes(result.user.role))) {
                const companyId = searchParams.get('companyId');
                let targetUrl = '/customer.html';
                const params = new URLSearchParams();

                if (tableNumber) params.append('table', tableNumber);
                if (companyId) params.append('companyId', companyId);

                const queryString = params.toString();
                if (queryString) targetUrl += `?${queryString}`;

                navigate(targetUrl);
            } else {
                navigate(redirectTo);
            }
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Video Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <video
                    src="/intro-video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center"
                />
            </div>
            {/* Language Selector */}
            <div className="absolute top-4 right-4 z-10">
                <div className="relative">
                    <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition"
                    >
                        <i className="fas fa-globe text-gray-500"></i>
                        <span className="uppercase font-medium text-gray-700">{language}</span>
                    </button>
                    {showLanguageDropdown && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 py-1 text-gray-800 border border-gray-100">
                            {['en', 'es', 'fr', 'hi', 'zh', 'ta', 'ml', 'te'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        changeLanguage(lang);
                                        setShowLanguageDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                    {lang === 'en' ? 'English' :
                                        lang === 'es' ? 'Español' :
                                            lang === 'fr' ? 'Français' :
                                                lang === 'hi' ? 'हिंदी' :
                                                    lang === 'zh' ? '中文' :
                                                        lang === 'ta' ? 'தமிழ்' :
                                                            lang === 'ml' ? 'മലയാളം' : 'తెలుగు'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    {companyInfo?.logo_url ? (
                        <img
                            src={companyInfo.logo_url}
                            alt={companyInfo.company_name || "Company Logo"}
                            className="w-24 h-24 object-contain rounded-full bg-white shadow-md p-2"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-utensils text-white text-2xl"></i>
                        </div>
                    )}
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white sm:text-gray-900 drop-shadow-md sm:drop-shadow-none">
                    {t('signInTitle')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-200 sm:text-gray-600">
                    {t('or')}{' '}
                    <Link to={`/login?mode=signup&table=${tableNumber}`} className="font-medium text-blue-400 sm:text-blue-600 hover:text-blue-300 sm:hover:text-blue-500">
                        {t('createAccountLink')}
                    </Link>
                </p>
            </div>

            <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white/90 backdrop-blur-md py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-circle text-red-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                {t('email')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {t('password')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex items-center justify-end mt-1">
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        {t('forgotPassword') || "Forgot your password?"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                ) : null}
                                {t('signIn')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
                API_URL={API_URL}
            />
        </div>
    );
};

export default LoginPage;