import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SignupPage from './SignupPage';
import { useNavigate } from "react-router-dom";

function HomePage() {
    const [activePage, setActivePage] = useState('home');
    const [isFullPage, setIsFullPage] = useState(false);
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const showPage = (page, fullPage = false) => {
        setActivePage(page);
        setIsFullPage(fullPage);
        const titles = {
            'home': 'EndOfHunger - Restaurant QR Ordering System',
            'admin': 'Admin Panel - EndOfHunger',
            'kitchen': 'Kitchen Dashboard - EndOfHunger',
            'customer': 'Customer Order - EndOfHunger',
            'analytics': 'Analytics Dashboard - EndOfHunger',
            'qr-codes': 'QR Codes - EndOfHunger'
        };
        document.title = titles[page] || 'EndOfHunger';
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });

        const supportBtn = document.querySelector('.floating button');
        if (supportBtn) {
            supportBtn.addEventListener('click', function() {
                alert('Live chat would open here');
            });
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (supportBtn) {
                supportBtn.removeEventListener('click', () => {});
            }
        };
    }, []);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow-x: hidden;
                }
                
                .hero-gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                    overflow: hidden;
                }
                
                .hero-gradient::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 200%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    animation: shimmer 8s infinite;
                }
                
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                .btn-hover {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                    transform: translateY(0);
                }
                
                .btn-hover::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                
                .btn-hover:hover::before {
                    width: 300px;
                    height: 300px;
                }
                
                .btn-hover:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .floating {
                    animation: floating 3s ease-in-out infinite;
                }
                
                @keyframes floating {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .fade-in {
                    animation: fadeIn 0.8s ease-in forwards;
                    opacity: 0;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .pattern-bg {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    position: relative;
                }
                
                .pattern-bg::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: 
                        radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.05) 0%, transparent 50%);
                    pointer-events: none;
                }
                
                .nav-item {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .nav-item::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transform: translateX(-50%);
                    transition: width 0.3s ease;
                }
                
                .nav-item:hover::after {
                    width: 80%;
                }
                
                .nav-item.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    transform: scale(1.05);
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }
                
                .feature-card {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                }
                
                .feature-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                
                .feature-icon {
                    transition: all 0.3s ease;
                }
                
                .feature-card:hover .feature-icon {
                    transform: rotate(360deg) scale(1.1);
                }
                
                .glass-effect {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                .text-gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .page-section {
                    display: none;
                    animation: slideIn 0.5s ease-out;
                }
                
                .page-section.active {
                    display: block;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .pulse {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
                    }
                }
                
                .scroll-indicator {
                    animation: bounce 2s infinite;
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }
                
                /* FontAwesome Icons */
                .fas {
                    display: inline-block;
                    font-style: normal;
                    font-variant: normal;
                    text-rendering: auto;
                    line-height: 1;
                }
                
                .fa-utensils:before { content: "\\f2e7"; }
                .fa-home:before { content: "\\f015"; }
                .fa-cog:before { content: "\\f013"; }
                .fa-chef-hat:before { content: "\\f6b5"; }
                .fa-user:before { content: "\\f007"; }
                .fa-chart-line:before { content: "\\f201"; }
                .fa-qrcode:before { content: "\\f029"; }
                .fa-bars:before { content: "\\f0c9"; }
                .fa-mobile-alt:before { content: "\\f3cd"; }
                .fa-bolt:before { content: "\\f0e7"; }
                .fa-shield-alt:before { content: "\\f3ed"; }
                .fa-quote-left:before { content: "\\f10d"; }
                .fa-comment-dots:before { content: "\\f4ad"; }
                .fa-facebook-f:before { content: "\\f39e"; }
                .fa-twitter:before { content: "\\f099"; }
                .fa-instagram:before { content: "\\f16d"; }
                .fa-linkedin-in:before { content: "\\f0e1"; }
                .fa-headset:before { content: "\\f590"; }
                .fa-arrow-down:before { content: "\\f063"; }
                .fa-times:before { content: "\\f00d"; }
                .fa-arrow-left:before { content: "\\f060"; }
            `}</style>

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
                            
                            {/* Desktop Navigation - Single Line */}
                            <nav className="hidden lg:flex items-center space-x-2">
                                {[
                                    { id: 'home', icon: 'fa-home', label: 'Home' },
                                    { id: 'admin', icon: 'fa-cog', label: 'Admin' },
                                    { id: 'kitchen', icon: 'fa-chef-hat', label: 'Kitchen' },
                                    { id: 'customer', icon: 'fa-user', label: 'Customer' },
                                    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
                                    { id: 'qr-codes', icon: 'fa-qrcode', label: 'QR Codes' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => showPage(item.id, false)}
                                        className={`nav-item ${activePage === item.id ? 'active' : 'bg-white bg-opacity-20'} px-4 py-2 rounded-full font-medium shadow-md flex items-center space-x-2 hover:shadow-xl`}
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
                                    { id: 'home', icon: 'fa-home', label: 'Home' },
                                    { id: 'admin', icon: 'fa-cog', label: 'Admin' },
                                    { id: 'kitchen', icon: 'fa-chef-hat', label: 'Kitchen' },
                                    { id: 'customer', icon: 'fa-user', label: 'Customer' },
                                    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
                                    { id: 'qr-codes', icon: 'fa-qrcode', label: 'QR Codes' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            showPage(item.id, false);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`nav-item ${activePage === item.id ? 'active' : 'bg-white bg-opacity-20'} px-4 py-2 rounded-full font-medium shadow-md flex items-center space-x-2`}
                                    >
                                        <i className={`fas ${item.icon}`}></i>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        )}
                    </div>
                </header>

                {/* Content Container */}
                <div id="content-container" className="container mx-auto px-4 py-8">
                    {/* Home Section */}
                    <div id="home-section" className={`page-section ${activePage === 'home' ? 'active' : ''}`}>
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
                                    gradient: 'from-blue-500 to-cyan-500',
                                    icon: 'fa-user',
                                    title: 'Customer Order',
                                    description: 'Place orders directly from your table using QR codes. Browse menu, customize items, and pay seamlessly.',
                                    buttonColor: 'bg-blue-600 hover:bg-blue-700',
                                    demoText: 'Try Demo (Table 1)'
                                },
                                {
                                    id: 'kitchen',
                                    gradient: 'from-green-500 to-emerald-500',
                                    icon: 'fa-chef-hat',
                                    title: 'Kitchen Dashboard',
                                    description: 'Real-time order management for kitchen staff. View orders, update status, and manage preparation time.',
                                    buttonColor: 'bg-green-600 hover:bg-green-700',
                                    demoText: 'Open Kitchen View'
                                },
                                {
                                    id: 'admin',
                                    gradient: 'from-purple-500 to-pink-500',
                                    icon: 'fa-cog',
                                    title: 'Admin Panel',
                                    description: 'Manage menu items, tables, and system settings. Full control over your restaurant\'s digital operations.',
                                    buttonColor: 'bg-purple-600 hover:bg-purple-700',
                                    demoText: 'Access Admin'
                                },
                                {
                                    id: 'analytics',
                                    gradient: 'from-orange-500 to-red-500',
                                    icon: 'fa-chart-line',
                                    title: 'Analytics Dashboard',
                                    description: 'Track sales, popular items, and customer trends. Make data-driven decisions to grow your business.',
                                    buttonColor: 'bg-orange-600 hover:bg-orange-700',
                                    demoText: 'View Analytics'
                                },
                                {
                                    id: 'qr-codes',
                                    gradient: 'from-indigo-500 to-purple-500',
                                    icon: 'fa-qrcode',
                                    title: 'QR Codes',
                                    description: 'Generate and print QR codes for each table. Easy setup with customizable designs and branding.',
                                    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
                                    demoText: 'Generate QR Codes'
                                },
                                {
                                    id: 'support',
                                    gradient: 'from-pink-500 to-rose-500',
                                    icon: 'fa-headset',
                                    title: 'Support',
                                    description: 'Get help with setup, training, and troubleshooting. Our team is here to ensure your success.',
                                    buttonColor: 'bg-pink-600 hover:bg-pink-700',
                                    demoText: 'Contact Support',
                                    isLink: true
                                }
                            ].map((feature, index) => (
                                <div key={index} className="feature-card bg-white rounded-3xl shadow-xl overflow-hidden fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className={`bg-gradient-to-r ${feature.gradient} p-8 text-white relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                                        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6 feature-icon backdrop-blur-sm">
                                            <i className={`fas ${feature.icon} text-3xl`}></i>
                                        </div>
                                        <h3 className="text-2xl font-bold">{feature.title}</h3>
                                    </div>
                                    <div className="p-8">
                                        <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                                        {feature.isLink ? (
                                            <a href="#" className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover`}>
                                                {feature.demoText}
                                            </a>
                                        ) : (
                                            <button onClick={() => showPage(feature.id, true)} className={`block w-full ${feature.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition duration-300 text-center btn-hover`}>
                                                {feature.demoText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Features Section */}
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

                    {/* Other Sections with iframes - Full Page View */}
                    {['admin', 'kitchen', 'customer', 'analytics', 'qr-codes'].map((section) => (
                        <div key={section} id={`${section}-section`} className={`page-section ${activePage === section ? 'active' : ''}`}>
                            {isFullPage ? (
                                <div className="fixed inset-0 z-40 bg-white">
                                    <div className="h-full flex flex-col">
                                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
                                            <h2 className="text-xl font-bold capitalize">{section} Dashboard</h2>
                                            <button 
                                                onClick={() => showPage('home', false)}
                                                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-300"
                                            >
                                                <i className="fas fa-arrow-left"></i>
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <iframe 
                                                src={`/${section}.html`} 
                                                style={{ width: '100%', height: '100%', border: 'none' }} 
                                                title={`${section.charAt(0).toUpperCase() + section.slice(1)} Panel`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                                    <iframe 
                                        src={`/${section}.html`} 
                                        style={{ width: '100%', height: 'calc(100vh - 150px)', border: 'none' }} 
                                        title={`${section.charAt(0).toUpperCase() + section.slice(1)} Panel`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer - Only show on home page */}
                {activePage === 'home' && (
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
                {activePage === 'home' && (
                    <div className="fixed bottom-8 right-8 floating">
                        <button className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300 pulse">
                            <i className="fas fa-comment-dots text-2xl"></i>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export default HomePage;