import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const UserSignupPage = ({ redirectUrl }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tableNumber = searchParams.get('table') || '1';
    const { t, language, changeLanguage } = useLanguage();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('passwordLength'));
            return;
        }

        setIsLoading(true);

        const result = await signup(fullName, email, password);

        if (result.success) {
            // Redirect to login page with table number after successful signup
            navigate(`/login?mode=login&table=${tableNumber}`);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
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

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <i className="fas fa-utensils text-white text-2xl"></i>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {t('createAccountTitle')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('or')}{' '}
                    <Link to={`/login?mode=login&table=${tableNumber}`} className="font-medium text-blue-600 hover:text-blue-500">
                        {t('signInLink')}
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                {t('fullName')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

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
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                {t('confirmPassword')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
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
                                {t('signUp')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserSignupPage;