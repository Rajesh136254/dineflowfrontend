import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import SupportTicketModal from '../components/SupportTicketModal';

function HomePage() {
    const navigate = useNavigate();
    const { currentUser, logout, token } = useAuth();
    const { selectedBranch, branches, setSelectedBranch } = useBranch();
    const location = useLocation();

    // State for UI elements
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // State for frame navigation
    const [activeFrame, setActiveFrame] = useState(null);
    const [frameUrl, setFrameUrl] = useState('');
    const [isFrameLoading, setIsFrameLoading] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

                // If user is logged in (has token), use authenticated endpoint
                // Otherwise use public endpoint
                if (token) {
                    const res = await fetch(`${API_URL}/api/company/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const json = await res.json();
                    if (json.success && json.data) {
                        setCompanyInfo(json.data);
                    }
                } else {
                    const res = await fetch(`${API_URL}/api/company/public`);
                    const json = await res.json();
                    if (json.success && json.data) {
                        setCompanyInfo(json.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();

        const interval = setInterval(fetchCompanyInfo, 10000);
        return () => clearInterval(interval);
    }, [token]);

    const isHomePage = location.pathname === '/' || location.pathname === '/homepage';

    // --- Navigation Handlers ---
    const handleTopNavigation = (path) => {
        // Top navigation opens in iframe modal
        setActiveFrame(path);
        setFrameUrl(path);
        setIsFrameLoading(true);
    };

    const handleCardNavigation = (path) => {
        // Card navigation goes to full page
        navigate(path);
    };

    const closeFrame = () => {
        setActiveFrame(null);
        setFrameUrl('');
        setIsFrameLoading(false);
    };

    const handleIframeLoad = () => {
        setIsFrameLoading(false);
    };

    // --- Effects for UI ---
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });

        return () => observer.disconnect();
    }, []);

    const allFeatures = [
        {
            id: 'customer',
            title: 'Customer Experience',
            description: 'Seamless QR-based ordering, real-time tracking, and instant payments.',
            path: '/customer.html',
            buttonColor: 'bg-purple-600 hover:bg-purple-700',
            demoText: 'View Customer App',
            isLink: false
        },
        {
            id: 'kitchen',
            title: 'Kitchen Display',
            description: 'Efficient order management, status updates, and preparation tracking.',
            path: '/kitchen.html',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            demoText: 'View Kitchen Display',
            isLink: false
        },
        {
            id: 'admin',
            title: 'Admin Dashboard',
            description: 'Comprehensive management of menu, tables, and restaurant settings.',
            path: '/admin.html',
            buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
            demoText: 'View Admin Panel',
            isLink: false
        },
        {
            id: 'analytics',
            title: 'Analytics & Reports',
            description: 'Deep insights into sales, popular items, and peak hours.',
            path: '/analytics.html',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            demoText: 'View Analytics',
            isLink: false
        },
        {
            id: 'ingredients',
            title: 'Ingredients Management',
            description: 'Track inventory, manage stock levels, and get low stock alerts.',
            path: '/ingredients',
            buttonColor: 'bg-orange-600 hover:bg-orange-700',
            demoText: 'Manage Ingredients',
            isLink: false
        },
        {
            id: 'staff',
            title: 'Staff Portal',
            description: 'Staff login, attendance tracking, and leave management.',
            path: '/staff',
            buttonColor: 'bg-teal-600 hover:bg-teal-700',
            demoText: 'Staff Login',
            isLink: false
        }
    ];

    const filterItems = (item) => {
        console.log('[FILTER] Checking:', item.id, '| User:', currentUser?.email, '| Role:', currentUser?.role, '| Has role_id:', !!currentUser?.role_id, '| Permissions:', currentUser?.permissions);
        if (item.id === 'home') return true;
        if (!currentUser) return true;

        // Super Admin (Legacy or explicit admin role without specific permissions)
        // Only allow if NO role_id is present. If role_id exists, we MUST use permissions.
        if (currentUser.role === 'admin' && !currentUser.role_id) {
            console.log('[FILTER] ✅ Super Admin - showing all');
            return true;
        }

        // Parse permissions if they are a string (just in case)
        let perms = currentUser.permissions;
        if (typeof perms === 'string') {
            try {
                perms = JSON.parse(perms);
            } catch (e) {
                console.error('Failed to parse permissions:', e);
                perms = {};
            }
        }

        // Role-based Users (with permissions)
        if (perms && Object.keys(perms).length > 0) {
            console.log('[FILTER] Permissions check for', item.id, ':', perms);
            if (item.id === 'admin') {
                return !!(perms.admin ||
                    perms.menu ||
                    perms.tables ||
                    perms.orders ||
                    perms.users ||
                    perms.roles ||
                    perms.settings);
            }
            // Strict check: must have permission for the feature
            return !!perms[item.id];
        }

        // Regular Customers (or users with role_id but no permissions)
        if (currentUser.role === 'customer') {
            return item.id === 'customer';
        }

        // Default to hidden if no permissions match
        return false;
    };

    const visibleFeatures = allFeatures.filter(filterItems);

    const navItems = [
        { id: 'home', path: '/homepage', icon: 'fa-home', label: 'Home' },
        { id: 'admin', path: '/admin.html', icon: 'fa-cog', label: 'Admin' },
        { id: 'kitchen', path: '/kitchen.html', icon: 'fa-chef-hat', label: 'Kitchen' },
        { id: 'customer', path: '/customer.html', icon: 'fa-user', label: 'Customer' },
        { id: 'analytics', path: '/analytics.html', icon: 'fa-chart-line', label: 'Analytics' },
        { id: 'ingredients', path: '/ingredients', icon: 'fa-cubes', label: 'Ingredients' }
    ];

    const visibleNavItems = navItems.filter(filterItems);

    return (
        <div className="pattern-bg min-h-screen">
            {/* Premium Header with Navigation */}
            <header
                className={`text-white transition-all duration-500 sticky top-0 z-[90] bg-cover bg-center relative ${isScrolled ? 'py-3 shadow-2xl' : 'py-6'} ${!companyInfo?.banner_url ? 'hero-gradient' : ''}`}
                style={companyInfo?.banner_url ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`
                } : {}}
            >

                <div className="w-full px-4 relative z-10">
                    {/* Desktop Layout - Relative container with absolute positioned children */}
                    <div className="hidden lg:block relative">
                        {/* Restaurant Name - Absolute Left Edge */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-3 group z-10">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                                {companyInfo?.logo_url ? (
                                    <img src={companyInfo.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <i className="fas fa-utensils text-purple-600 text-xl"></i>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight whitespace-nowrap">{companyInfo ? companyInfo.name : 'RedSorm'}</h1>
                        </div>

                        {/* Desktop Navigation - Absolute Center */}
                        <nav className="flex items-center justify-center space-x-2 py-2 relative z-20">
                            {visibleNavItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => item.id === 'home' ? handleCardNavigation(item.path) : handleTopNavigation(item.path)}
                                    className="nav-item bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium shadow-md flex items-center space-x-2 hover:shadow-xl"
                                >
                                    <i className={`fas ${item.icon}`}></i>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* User Profile Section - Absolute Right Edge */}
                        {currentUser && (
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-[10000]">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="flex items-center space-x-4 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="text-right">
                                            <p className="text-sm font-bold leading-none">{currentUser.full_name || 'User'}</p>
                                            <p className="text-xs opacity-75 leading-none mt-1">{currentUser.email}</p>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-md">
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <i className={`fas fa-chevron-down text-sm transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                                    </button>


                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Layout */}
                    <div className="flex lg:hidden justify-between items-center">
                        {/* Restaurant Name - Mobile */}
                        <div className="flex items-center space-x-3 group">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                                {companyInfo?.logo_url ? (
                                    <img src={companyInfo.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <i className="fas fa-utensils text-purple-600 text-xl"></i>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{companyInfo ? companyInfo.name : 'RedSorm'}</h1>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden p-2 hover:scale-110 transition-transform active:scale-95"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <nav className="lg:hidden mt-4 pb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {visibleNavItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            item.id === 'home' ? handleCardNavigation(item.path) : handleTopNavigation(item.path);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="mobile-nav-item nav-item bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium shadow-md flex items-center space-x-2"
                                    >
                                        <i className={`fas ${item.icon}`}></i>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Mobile User Profile & Logout */}
                            {currentUser && (
                                <div className="bg-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-md">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-bold leading-none">{currentUser.full_name || 'User'}</p>
                                                <p className="text-xs opacity-75 leading-none mt-1">{currentUser.email}</p>
                                            </div>
                                        </div>
                                        <i className={`fas fa-chevron-down text-sm transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                                    </button>

                                    {/* Collapsible Logout Section */}
                                    {isProfileDropdownOpen && (
                                        <div className="px-4 pb-4 pt-2 border-t border-white/20 animate-fade-in">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsMobileMenuOpen(false);
                                                    setIsProfileDropdownOpen(false);
                                                }}
                                                className="w-full bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-medium shadow-md transition-all duration-300 flex items-center justify-center space-x-2"
                                            >
                                                <i className="fas fa-sign-out-alt"></i>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            {isHomePage && (
                <main className="container mx-auto px-4 py-8">
                    {/* Branch Indicator */}
                    {selectedBranch && (
                        <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-purple-50 transform hover:scale-[1.01] transition-transform duration-300">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-2xl">
                                    <i className="fas fa-code-branch text-purple-600 text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Current Branch Context</p>
                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                                        {branches.find(b => b.id === selectedBranch)?.name || 'Unknown Branch'}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedBranch(null); navigate('/branches'); }}
                                className="px-6 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all shadow-purple-200"
                            >
                                Switch Branch
                            </button>
                        </div>
                    )}

                    {/* Hero Section */}
                    <div className="relative rounded-3xl overflow-hidden mb-16 shadow-2xl fade-in min-h-[400px] md:min-h-[500px]">
                        {companyInfo?.banner_url ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                                style={{ backgroundImage: `url(${companyInfo.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            >
                                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900"></div>
                        )}

                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-6 md:p-8 min-h-[400px] md:min-h-[500px]">
                            {companyInfo?.logo_url && (
                                <img src={companyInfo.logo_url} alt="Logo" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg mb-6 animate-bounce-slow" />
                            )}
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight text-shadow">
                                Welcome to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
                                    {companyInfo ? companyInfo.name : 'RedSorm'}
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8">
                                A modern QR-based restaurant ordering system that enhances customer experience and streamlines operations
                            </p>
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {visibleFeatures.map((feature, index) => (
                            <div key={index} className="feature-card bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-500 transform hover:-translate-y-2 fade-in relative z-10 flex flex-col h-full border border-gray-200" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="p-8 flex flex-col flex-grow">
                                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>{feature.title}</h3>
                                    <p className="font-medium mb-6 leading-relaxed flex-grow" style={{ color: '#334155' }}>{feature.description}</p>
                                    <div className="mt-auto">
                                        {feature.isLink ? (
                                            <a href="#" className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover shadow-md`}>
                                                {feature.demoText}
                                            </a>
                                        ) : (
                                            <button onClick={() => handleCardNavigation(feature.path)} className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover shadow-md`}>
                                                {feature.demoText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why Choose Us Section */}
                    < div className="glass-effect rounded-3xl shadow-2xl p-10 mb-16 fade-in" >
                        <h3 className="text-3xl font-bold text-gray-800 mb-10 text-center">Why Choose RedSorm?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: 'fa-mobile-alt',
                                    color: 'purple',
                                    title: 'Mobile First',
                                    description: 'Optimized for all devices with responsive design and touch-friendly interface'
                                },
                                {
                                    icon: 'fa-bolt',
                                    color: 'blue',
                                    title: 'Lightning Fast',
                                    description: 'Quick order placement and real-time updates for efficient restaurant operations'
                                },
                                {
                                    icon: 'fa-shield-alt',
                                    color: 'green',
                                    title: 'Secure & Reliable',
                                    description: 'Enterprise-grade security with encrypted payments and data protection'
                                }
                            ].map((item, index) => (
                                <div key={index} className="text-center group">
                                    <div className={`w-20 h-20 bg-${item.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                        <i className={`fas ${item.icon} text-${item.color}-600 text-2xl`}></i>
                                    </div>
                                    <h4 className="font-bold text-xl text-black mb-3">{item.title}</h4>
                                    <p className="text-black font-medium leading-relaxed">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonial Section */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl p-12 text-white mb-16 relative overflow-hidden fade-in">
                        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
                        <div className="relative z-10 max-w-4xl mx-auto text-center">
                            <i className="fas fa-quote-left text-6xl mb-8 opacity-50"></i>
                            <p className="text-2xl md:text-3xl mb-8 italic leading-relaxed">
                                "RedSorm transformed our restaurant operations. Orders are processed 40% faster, and our customers love the convenience of ordering from their tables."
                            </p>
                            <div className="flex items-center justify-center">
                                <img src="https://picsum.photos/seed/restaurant-owner/60/60.jpg" alt="Restaurant Owner" className="w-16 h-16 rounded-full mr-6 border-4 border-white shadow-lg" />
                                <div className="text-left">
                                    <p className="font-bold text-xl">Sarah Johnson</p>
                                    <p className="text-lg opacity-90">Owner, The Garden Bistro</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            )
            }

            {/* Footer */}
            {
                isHomePage && (
                    <footer className="bg-gray-900 text-white py-12 px-4 mt-16">
                        <div className="container mx-auto">

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                                <div>
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                            <i className="fas fa-utensils text-purple-600"></i>
                                        </div>
                                        <h3 className="text-xl font-bold">RedSorm</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed">Modern QR-based restaurant ordering system for enhanced dining experiences.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4">Product</h4>
                                    <ul className="space-y-3 text-gray-400">
                                        <li><a onClick={() => navigate('/features')} className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block cursor-pointer">Features</a></li>
                                        <li><a onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block cursor-pointer">Pricing</a></li>
                                        <li><a onClick={() => navigate('/faqs')} className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block cursor-pointer">FAQ</a></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4">Company</h4>
                                    <ul className="space-y-3 text-gray-400">
                                        <li><a onClick={() => navigate('/about')} className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block cursor-pointer">About</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Blog</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Careers</a></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4">Connect</h4>
                                    <ul className="space-y-3 text-gray-400">
                                        <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Twitter</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">LinkedIn</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Instagram</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
                                <p>&copy; 2024 RedSorm. All rights reserved.</p>
                            </div>
                        </div>
                    </footer>
                )
            }

            {/* Support Chat Button */}
            <button
                onClick={() => setIsSupportOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition transform hover:scale-110 z-50 flex items-center justify-center group"
                title="Support Chat"
            >
                <i className="fas fa-comments text-2xl"></i>
                <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Chat with us
                </span>
            </button>

            <SupportTicketModal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                currentUser={currentUser}
            />

            {/* Iframe Modal for Top Navigation */}
            {activeFrame && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                            <h3 className="text-lg font-bold">Preview</h3>
                            <button
                                onClick={closeFrame}
                                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-full"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        {/* Iframe Content */}
                        <div className="flex-1 relative">
                            {isFrameLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading...</p>
                                    </div>
                                </div>
                            )}
                            <iframe
                                src={frameUrl}
                                className="w-full h-full border-0"
                                title="Preview"
                                onLoad={handleIframeLoad}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Moved Profile Dropdown to Root Level for Correct Stacking - DESKTOP ONLY */}
            {isProfileDropdownOpen && currentUser && (
                <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                        className="fixed inset-0 z-[10000] hidden lg:block"
                        onClick={() => setIsProfileDropdownOpen(false)}
                    ></div>

                    <div className="fixed top-20 right-4 w-56 bg-white rounded-2xl shadow-2xl overflow-hidden z-[10001] animate-fade-in hidden lg:block">
                        <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <p className="font-bold text-sm">{currentUser.full_name || 'User'}</p>
                            <p className="text-xs opacity-90 mt-1">{currentUser.email}</p>
                            <p className="text-xs opacity-75 mt-1 capitalize">Role: {currentUser.role}</p>
                        </div>
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    logout();
                                    setIsProfileDropdownOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                            >
                                <i className="fas fa-sign-out-alt text-lg group-hover:scale-110 transition-transform"></i>
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div >
    );
}

export default HomePage;
