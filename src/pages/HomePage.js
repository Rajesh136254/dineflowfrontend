import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();

    // State for UI elements
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State for frame navigation
    const [activeFrame, setActiveFrame] = useState(null);
    const [frameUrl, setFrameUrl] = useState('');
    const [isFrameLoading, setIsFrameLoading] = useState(false);

    const isHomePage = location.pathname === '/' || location.pathname === '/homepage';

    // --- Navigation Handlers ---
    // This function opens the frame for top navigation items
    const handleTopNavigation = (path) => {
        // If we're already on the homepage, use frame navigation
        if (isHomePage) {
            setActiveFrame(path);
            setFrameUrl(path);
            setIsFrameLoading(true); // Start loading state
        } else {
            // Otherwise, navigate normally
            navigate(path);
        }
    };

    // This function navigates to full pages for feature cards
    const handleCardNavigation = (path) => {
        navigate(path);
    };

    // Close the frame
    const closeFrame = () => {
        setActiveFrame(null);
        setFrameUrl('');
        setIsFrameLoading(false);
    };

    // Handle iframe load complete
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

        // Cleanup function for observer
        return () => observer.disconnect();
    }, []);

    return (
        <div className="pattern-bg min-h-screen">
            {/* Premium Header with Navigation */}
            <header className={`hero-gradient text-white transition-all duration-500 ${isScrolled ? 'py-3 shadow-2xl' : 'py-6'}`}>
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 group">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                                <i className="fas fa-utensils text-purple-600 text-xl"></i>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">EndOfHunger</h1>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-2">
                            {[
                                { id: 'home', path: '/homepage', icon: 'fa-home', label: 'Home' },
                                { id: 'admin', path: '/admin.html', icon: 'fa-cog', label: 'Admin' },
                                { id: 'kitchen', path: '/kitchen.html', icon: 'fa-chef-hat', label: 'Kitchen' },
                                { id: 'customer', path: '/customer.html', icon: 'fa-user', label: 'Customer' },
                                { id: 'analytics', path: '/analytics.html', icon: 'fa-chart-line', label: 'Analytics' },
                                { id: 'ingredients', path: '/ingredients', icon: 'fa-cubes', label: 'Ingredients' }
                            ].map((item) => (
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

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden hover:scale-110 transition-transform"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <nav className="lg:hidden mt-4 pb-4 flex flex-wrap gap-2">
                            {[
                                { id: 'home', path: '/homepage', icon: 'fa-home', label: 'Home' },
                                { id: 'admin', path: '/admin.html', icon: 'fa-cog', label: 'Admin' },
                                { id: 'kitchen', path: '/kitchen.html', icon: 'fa-chef-hat', label: 'Kitchen' },
                                { id: 'customer', path: '/customer.html', icon: 'fa-user', label: 'Customer' },
                                { id: 'analytics', path: '/analytics.html', icon: 'fa-chart-line', label: 'Analytics' },
                                { id: 'ingredients', path: '/ingredients', icon: 'fa-cubes', label: 'Ingredients' }
                            ].map((item) => (
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
                        </nav>
                    )}
                </div>
            </header>

            {/* Content Container - Only show on the home page */}
            {isHomePage && (
                <div id="content-container" className="container mx-auto px-4 py-8">
                    {/* Hero Section */}
                    <div className="text-center mb-16 fade-in">
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            Welcome to <br />
                            <span className="text-gradient">EndOfHunger</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            A modern QR-based restaurant ordering system that enhances customer experience and streamlines operations
                        </p>
                        <div className="mt-8 scroll-indicator">
                            <i className="fas fa-arrow-down text-3xl text-purple-600"></i>
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {[
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
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                                    {feature.isLink ? (
                                        <a href="#" className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover`}>
                                            {feature.demoText}
                                        </a>
                                    ) : (
                                        <button onClick={() => handleCardNavigation(feature.path)} className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover`}>
                                            {feature.demoText}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why Choose Us Section */}
                    <div className="glass-effect rounded-3xl shadow-2xl p-10 mb-16 fade-in">
                        <h3 className="text-3xl font-bold text-gray-800 mb-10 text-center">Why Choose EndOfHunger?</h3>
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
                                    <h4 className="font-bold text-xl text-gray-800 mb-3">{item.title}</h4>
                                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
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
                                "EndOfHunger transformed our restaurant operations. Orders are processed 40% faster, and our customers love the convenience of ordering from their tables."
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
                </div>
            )}

            {/* Footer - Only show on home page */}
            {isHomePage && (
                <footer className="bg-gray-900 text-white py-12 px-4 mt-16">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                        <i className="fas fa-utensils text-purple-600"></i>
                                    </div>
                                    <h3 className="text-xl font-bold">EndOfHunger</h3>
                                </div>
                                <p className="text-gray-400 leading-relaxed">Modern QR-based restaurant ordering system for enhanced dining experiences.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-4">Product</h4>
                                <ul className="space-y-3 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">FAQ</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-4">Company</h4>
                                <ul className="space-y-3 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">About</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Blog</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Careers</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-4">Connect</h4>
                                <div className="flex space-x-4 mb-6">
                                    {['facebook-f', 'twitter', 'instagram', 'linkedin-in'].map((social) => (
                                        <a key={social} href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-all duration-300 hover:scale-110 hover:rotate-6">
                                            <i className={`fab fa-${social}`}></i>
                                        </a>
                                    ))}
                                </div>
                                <p className="text-gray-400">support@endofhunger.com</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                            <p>&copy; 2023 EndOfHunger. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            )}

            {/* Floating Action Button - Only show on home page */}
            {isHomePage && (
                <div className="fixed bottom-8 right-8 floating">
                    <button className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300 pulse">
                        <i className="fas fa-comment-dots text-2xl"></i>
                    </button>
                </div>
            )}

            {/* Overlay when frame is open */}
            {activeFrame && (
                <div className="overlay" onClick={closeFrame}></div>
            )}

            {/* Frame Container for displaying pages - Centered */}
            {activeFrame && (
                <div className="frame-container">
                    <div className="frame-header">
                        <h3 className="text-xl font-semibold">
                            {activeFrame === '/admin.html' && 'Admin Panel'}
                            {activeFrame === '/kitchen.html' && 'Kitchen Dashboard'}
                            {activeFrame === '/customer.html' && 'Customer Order'}
                            {activeFrame === '/analytics.html' && 'Analytics Dashboard'}
                        </h3>
                        <button className="close-btn" onClick={closeFrame}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="frame-content">
                        {isFrameLoading && (
                            <div className="loading-container">
                                <div className="loading-spinner">
                                    <div className="loading-spinner-circle"></div>
                                    <div className="loading-spinner-circle"></div>
                                </div>
                                <div className="loading-text">Loading...</div>
                                <div className="loading-subtext">Please wait while we load the module</div>
                            </div>
                        )}
                        <iframe
                            src={frameUrl}
                            title="Content Frame"
                            onLoad={handleIframeLoad}
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;