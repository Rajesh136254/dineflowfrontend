import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './DashboardPage.css';

function DashboardPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [pricingPlan, setPricingPlan] = useState('monthly');
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const [currency, setCurrency] = useState('INR');
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useLanguage();

    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const pricingRef = useRef(null);
    const currencyDropdownRef = useRef(null);

    // Currency Rates
    const currencyRates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.75, AUD: 0.018, CAD: 0.016, SGD: 0.016 };
    const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$' };

    // Testimonials
    const testimonials = [
        { name: "Sarah Johnson", position: "Owner, The Garden Bistro", image: "https://picsum.photos/seed/restaurant-owner/100/100.jpg", quote: "RedSorm transformed our operations. Orders are 40% faster.", rating: 5 },
        { name: "Michael Chen", position: "Manager, Urban Eats", image: "https://picsum.photos/seed/restaurant-manager/100/100.jpg", quote: "The analytics insight increased our profits by 25% in two months.", rating: 5 },
        { name: "Emily Rodriguez", position: "Chef, Coastal Kitchen", image: "https://picsum.photos/seed/restaurant-chef/100/100.jpg", quote: "The KDS is a lifesaver. The kitchen is calm, organized, and efficient.", rating: 5 }
    ];

    // BENTO GRID FEATURES with realistic assets
    const features = [
        {
            id: 'qr',
            title: 'Scan & Order',
            description: 'Frictionless ordering experience. Customers scan, order, and pay without waiting.',
            color: '#FF6B6B',
            image: '/dash-feature-qr.png',
            icon: 'fa-qrcode',
            size: 'large' // Spans 2 cols, 2 rows
        },
        {
            id: 'kds',
            title: 'Live KDS',
            description: 'Replace printers with smart screens. Real-time updates for your kitchen team.',
            color: '#FFA502',
            image: '/dash-feature-kds.png',
            icon: 'fa-fire',
            size: 'tall' // Spans 1 col, 2 rows
        },
        {
            id: 'analytics',
            title: 'Analytics & Insights',
            description: 'Track sales, top items, and peak hours. Data-driven growth.',
            color: '#2ED573',
            image: '/dash-feature-analytics.png',
            icon: 'fa-chart-line',
            size: 'wide' // Spans 2 cols, 1 row
        },
        {
            id: 'tables',
            title: 'Table Management',
            description: 'Digital floor plan. Track occupancy status in real-time.',
            color: '#A3CB38',
            image: '/dash-feature-tables.png',
            icon: 'fa-th',
            size: 'medium'
        },
        {
            id: 'menu',
            title: 'Dynamic Menu',
            description: 'Update items, prices, and images instantly everywhere.',
            color: '#1289A7',
            image: '/dash-feature-menu.png',
            icon: 'fa-book-open',
            size: 'medium'
        },
        {
            id: 'inventory',
            title: 'Smart Inventory',
            description: 'Automated stock deduction. Low-stock alerts.',
            color: '#1E90FF',
            image: '/dash-feature-inventory.png',
            icon: 'fa-cubes',
            size: 'medium'
        },
        {
            id: 'team',
            title: 'Role Management',
            description: 'Secure logins for Staff, Chefs, and Managers.',
            color: '#5352ED',
            image: '/dash-feature-team.png',
            icon: 'fa-user-shield',
            size: 'medium'
        },
        {
            id: 'branches',
            title: 'Branch Management',
            description: 'Manage multiple locations from one dashboard.',
            color: '#FF6348',
            image: '/dash-feature-branches.png',
            icon: 'fa-code-branch',
            size: 'medium'
        }
    ];

    const calculatePrice = () => Math.round((pricingPlan === 'monthly' ? 4999 : 3499) * currencyRates[currency]);
    const formatPrice = (price) => currency === 'JPY' ? price.toLocaleString() : price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    // Scroll & Effects
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length), 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
        }, { threshold: 0.1 });
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));
        return () => elements.forEach(el => observer.unobserve(el));
    }, []);

    // Dropdown Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCurrencyDropdown && currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
                setShowCurrencyDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCurrencyDropdown]);

    const scrollToSection = useCallback((ref) => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

    // Core Navigation Logic (Unchanged)
    const goToSignup = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            navigate("/signup");
        }, 1000);
    };

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert('Thank you for your interest! We will contact you soon.');
            setEmail('');
        }, 1500);
    };

    return (
        <div className="dashboard stunning-theme">
            {/* Hero Background using Inline Style to avoid Webpack errors */}
            <div className="stunning-hero-bg" style={{ backgroundImage: "url('/dash-hero-bg.png')" }}></div>

            {/* Header */}
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="logo-icon glass-icon"><i className="fas fa-utensils"></i></div>
                            <span className="logo-text">RedSorm</span>
                        </div>
                        <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
                            <ul className="nav-list">
                                <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection(heroRef); }}>{t('home')}</a></li>
                                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>{t('features')}</a></li>
                                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }}>{t('pricing')}</a></li>
                                <li><a href="/faqs" onClick={(e) => { e.preventDefault(); navigate('/faqs'); }}>FAQs</a></li>
                            </ul>
                        </nav>
                        <div className="header-actions">
                            <div className="relative inline-block text-left mr-2">
                                <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="btn btn-ghost flex items-center gap-2">
                                    <i className="fas fa-globe"></i> {language.toUpperCase()}
                                </button>
                                {showLanguageDropdown && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 py-1">
                                        {['en', 'es', 'fr', 'hi', 'zh'].map((lang) => (
                                            <button key={lang} onClick={() => { changeLanguage(lang); setShowLanguageDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : lang}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button className="btn btn-secondary" onClick={() => navigate('/signup?mode=login')}>{t('login')}</button>
                            <button className="btn btn-primary glow-effect" onClick={goToSignup} disabled={isLoading}>
                                {isLoading ? <div className="spinner"></div> : t('getStarted')}
                            </button>
                            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}><span></span><span></span><span></span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section ref={heroRef} className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text glass-panel animate-on-scroll">
                            <div className="hero-badge"><span>🍽️ Restaurant dining & Smart order management</span></div>
                            <h1 className="hero-title">{t('heroTitle')}</h1>
                            <p className="hero-description">{t('heroSubtitle')}</p>
                            <div className="hero-actions">
                                <button className="btn btn-hero-primary glow-effect" onClick={goToSignup}>Start Free Trial</button>
                                <button className="btn btn-hero-secondary"><i className="fas fa-play"></i> Watch Demo</button>
                            </div>
                            <div className="hero-stats">
                                <div className="stat"><div className="stat-number">40%</div><div className="stat-label">Faster Service</div></div>
                                <div className="stat"><div className="stat-number">25%</div><div className="stat-label">Higher Revenue</div></div>
                            </div>
                        </div>
                        <div className="hero-visual animate-on-scroll">
                            <div className="realistic-mockup-container">
                                <img src="/dash-hero-visual.png" alt="App on Phone" className="hero-realistic-image" />
                                <div className="floating-card card-1 glass-card"><i className="fas fa-check-circle"></i><span>Order Scanned</span></div>
                                <div className="floating-card card-2 glass-card"><i className="fas fa-bell"></i><span>Chef Notified</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features Section */}
            <section ref={featuresRef} className="features">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 className="section-title">The Complete Ecosystem</h2>
                        <p className="section-subtitle">A stunning suite of tools designed for modern dining.</p>
                    </div>

                    <div className="bento-grid">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`feature-card glass-card bento-${feature.size} animate-on-scroll`}
                                onClick={() => {
                                    // Map dashboard feature IDs to features page IDs
                                    const featureMapping = {
                                        'qr': 'qr-ordering',
                                        'kds': 'kds',
                                        'analytics': 'analytics',
                                        'tables': 'table-management',
                                        'menu': 'menu-management',
                                        'inventory': 'inventory',
                                        'team': 'role-management',
                                        'branches': 'branch-management'
                                    };
                                    const targetFeature = featureMapping[feature.id] || 'qr-ordering';
                                    navigate(`/features?feature=${targetFeature}`);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="feature-image-wrapper">
                                    <img src={feature.image} alt={feature.title} className="feature-realistic-img" />
                                    <div className="feature-overlay"></div>
                                </div>
                                <div className="feature-details">
                                    <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                                        <i className={`fas ${feature.icon}`}></i>
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section ref={pricingRef} className="pricing">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 className="section-title">Investment in Excellence</h2>
                        <p className="section-subtitle">Simple, transparent pricing for unlimited growth.</p>
                    </div>
                    <div className="pricing-card glass-card animate-on-scroll center-card">
                        <div className="pricing-header">
                            <h3>Complete Suite</h3>
                            <div className="price-display">
                                <span className="currency">{currencySymbols[currency]}</span>
                                <span className="amount">{formatPrice(calculatePrice())}</span>
                                <span className="period">/mo</span>
                            </div>
                        </div>
                        <div className="pricing-features-list">
                            <ul>
                                <li><i className="fas fa-check"></i> Unlimited Tables & Staff</li>
                                <li><i className="fas fa-check"></i> Advanced KDS & Analytics</li>
                                <li><i className="fas fa-check"></i> Instant Menu Updates</li>
                                <li><i className="fas fa-check"></i> 24/7 Priority Support</li>
                            </ul>
                        </div>
                        <button className="btn btn-primary full-width" onClick={goToSignup}>Start 14-Day Free Trial</button>
                    </div>
                </div>
            </section>

            {/* Advanced Footer */}
            <footer className="footer-advanced">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="logo footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <div className="logo-icon glass-icon" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                    <i className="fas fa-utensils"></i>
                                </div>
                                <span className="logo-text">RedSorm</span>
                            </div>
                            <p>Empowering restaurants with world-class technology. Join the dining revolution and scale your business today.</p>
                            <div className="social-icons">
                                <a href="#" className="social-icon" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-icon" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                                <a href="#" className="social-icon" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                                <a href="#" className="social-icon" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                            </div>
                        </div>

                        <div className="footer-links-col">
                            <h4>Product</h4>
                            <ul>
                                <li><a href="/features" onClick={(e) => { e.preventDefault(); navigate('/features'); }}>Features</a></li>
                                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }}>Pricing</a></li>
                                <li><a href="/faqs" onClick={(e) => { e.preventDefault(); navigate('/faqs'); }}>FAQs</a></li>
                                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Overview</a></li>
                            </ul>
                        </div>

                        <div className="footer-links-col">
                            <h4>Company</h4>
                            <ul>
                                <li><a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a></li>
                                <li><a href="#" onClick={(e) => e.preventDefault()}>Careers</a></li>
                                <li><a href="#" onClick={(e) => e.preventDefault()}>Blog</a></li>
                                <li><a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a></li>
                            </ul>
                        </div>

                        <div className="footer-newsletter">
                            <h4>Stay Ahead</h4>
                            <p>Get the latest features, tips, and industry trends delivered to your inbox.</p>
                            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }}>
                                <input type="email" placeholder="Enter your email" required />
                                <button type="submit" className="btn-icon"><i className="fas fa-arrow-right"></i></button>
                            </form>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} RedSorm Inc. All rights reserved.</p>
                        <div className="footer-legal">
                            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default DashboardPage;