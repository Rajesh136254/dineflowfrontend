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

    // Currency conversion rates (relative to INR)
    const currencyRates = {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
        JPY: 1.75,
        AUD: 0.018,
        CAD: 0.016,
        SGD: 0.016
    };

    // Currency symbols
    const currencySymbols = {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        AUD: 'A$',
        CAD: 'C$',
        SGD: 'S$'
    };

    // Testimonials data
    const testimonials = [
        {
            name: "Sarah Johnson",
            position: "Owner, The Garden Bistro",
            image: "https://picsum.photos/seed/restaurant-owner/100/100.jpg",
            quote: "EndOfHunger transformed our restaurant operations. Orders are processed 40% faster, and our customers love the convenience of ordering from their tables.",
            rating: 5
        },
        {
            name: "Michael Chen",
            position: "Manager, Urban Eats",
            image: "https://picsum.photos/seed/restaurant-manager/100/100.jpg",
            quote: "The analytics dashboard has given us insights we never had before. We've optimized our menu based on real data and increased profits by 25%.",
            rating: 5
        },
        {
            name: "Emily Rodriguez",
            position: "Chef, Coastal Kitchen",
            image: "https://picsum.photos/seed/restaurant-chef/100/100.jpg",
            quote: "Kitchen staff love the real-time order updates. No more confusion or missed tickets. It's streamlined our entire operation.",
            rating: 5
        }
    ];

    // Features data
    const features = [
        {
            icon: 'fa-mobile-alt',
            title: 'Mobile Ordering',
            description: 'Customers can browse menus, customize orders, and pay directly from their phones.',
            color: '#6366F1',
            image: 'https://picsum.photos/seed/mobile-ordering/400/300.jpg'
        },
        {
            icon: 'fa-qrcode',
            title: 'QR Code Integration',
            description: 'Generate unique QR codes for each table. No app downloads required.',
            color: '#8B5CF6',
            image: 'https://picsum.photos/seed/qr-code/400/300.jpg'
        },
        {
            icon: 'fa-credit-card',
            title: 'Secure Payments',
            description: 'Multiple payment options with enterprise-grade security and instant processing.',
            color: '#EC4899',
            image: 'https://picsum.photos/seed/payments/400/300.jpg'
        },
        {
            icon: 'fa-chart-line',
            title: 'Analytics Dashboard',
            description: 'Track sales, popular items, and customer trends with detailed insights.',
            color: '#10B981',
            image: 'https://picsum.photos/seed/analytics/400/300.jpg'
        },
        {
            icon: 'fa-chef-hat',
            title: 'Kitchen Display',
            description: 'Real-time order management for kitchen staff with status updates and timers.',
            color: '#F59E0B',
            image: 'https://picsum.photos/seed/kitchen/400/300.jpg'
        },
        {
            icon: 'fa-cog',
            title: 'Admin Panel',
            description: 'Manage menu items, tables, and system settings with full control.',
            color: '#EF4444',
            image: 'https://picsum.photos/seed/admin/400/300.jpg'
        }
    ];

    // Calculate price in selected currency
    const calculatePrice = () => {
        const inrPrice = pricingPlan === 'monthly' ? 4999 : 3499;
        const convertedPrice = inrPrice * currencyRates[currency];
        return Math.round(convertedPrice);
    };

    // Format price with proper decimal places
    const formatPrice = (price) => {
        if (currency === 'JPY') {
            return price.toLocaleString();
        }
        return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // Scroll effects
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [features.length]);

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));

        return () => {
            elements.forEach(el => observer.unobserve(el));
        };
    }, []);

    // Close currency dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCurrencyDropdown && currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
                setShowCurrencyDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCurrencyDropdown]);

    const scrollToSection = useCallback((ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

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
        <div className="dashboard">
            {/* Animated Background */}
            <div className="animated-background">
                <div className="gradient-sphere sphere-1"></div>
                <div className="gradient-sphere sphere-2"></div>
                <div className="gradient-sphere sphere-3"></div>
            </div>

            {/* Header */}
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="logo-icon">
                                <i className="fas fa-utensils"></i>
                            </div>
                            <span className="logo-text">EndOfHunger</span>
                        </div>

                        <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
                            <ul className="nav-list">
                                <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection(heroRef); }}>{t('home')}</a></li>
                                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>{t('features')}</a></li>
                                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }}>{t('pricing')}</a></li>
                                <li><a href="#contact" onClick={(e) => e.preventDefault()}>{t('contact')}</a></li>
                            </ul>
                        </nav>

                        <div className="header-actions">
                            <div className="relative inline-block text-left mr-2">
                                <button
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <i className="fas fa-globe"></i>
                                    {language.toUpperCase()}
                                </button>
                                {showLanguageDropdown && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 py-1">
                                        {['en', 'es', 'fr', 'hi', 'zh', 'ta', 'ml', 'te'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => {
                                                    changeLanguage(lang);
                                                    setShowLanguageDropdown(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                            <button className="btn btn-secondary" onClick={() => navigate('/signup')}>
                                {t('login')}
                            </button>
                            <button className="btn btn-primary" onClick={goToSignup} disabled={isLoading}>
                                {isLoading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    t('getStarted')
                                )}
                            </button>
                            <button
                                className="mobile-menu-toggle"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section ref={heroRef} className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <div className="hero-badge animate-on-scroll">
                                <span>🎉 Revolutionize Your Restaurant Experience</span>
                            </div>

                            <h1 className="hero-title animate-on-scroll">
                                {t('heroTitle')}
                            </h1>

                            <p className="hero-description animate-on-scroll">
                                {t('heroSubtitle')}
                            </p>

                            <div className="hero-actions animate-on-scroll">
                                <button className="btn btn-hero-primary" onClick={goToSignup}>
                                    Start Free Trial
                                </button>
                                <button className="btn btn-hero-secondary">
                                    <i className="fas fa-play-circle"></i>
                                    Watch Demo
                                </button>
                            </div>

                            <div className="hero-stats animate-on-scroll">
                                <div className="stat">
                                    <div className="stat-number">40%</div>
                                    <div className="stat-label">Faster Service</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-number">25%</div>
                                    <div className="stat-label">Higher Revenue</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-number">98%</div>
                                    <div className="stat-label">Customer Satisfaction</div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual animate-on-scroll">
                            <div className="phone-mockup">
                                <div className="phone-frame">
                                    <div className="phone-screen">
                                        <div className="app-header">
                                            <div className="restaurant-info">
                                                <h3>The Garden Bistro</h3>
                                                <p>Table 5 • 2 guests</p>
                                            </div>
                                            <div className="qr-icon">
                                                <i className="fas fa-qrcode"></i>
                                            </div>
                                        </div>
                                        <div className="menu-categories">
                                            <div className="category active">Starters</div>
                                            <div className="category">Mains</div>
                                            <div className="category">Desserts</div>
                                            <div className="category">Drinks</div>
                                        </div>
                                        <div className="menu-items">
                                            <div className="menu-item">
                                                <div className="item-image">
                                                    <img src="https://picsum.photos/seed/food1/80/80.jpg" alt="Food" />
                                                </div>
                                                <div className="item-details">
                                                    <h4>Garden Salad</h4>
                                                    <p>Fresh organic greens</p>
                                                    <div className="item-price">₹299</div>
                                                </div>
                                                <button className="add-btn">+</button>
                                            </div>
                                            <div className="menu-item">
                                                <div className="item-image">
                                                    <img src="https://picsum.photos/seed/food2/80/80.jpg" alt="Food" />
                                                </div>
                                                <div className="item-details">
                                                    <h4>Bruschetta</h4>
                                                    <p>Grilled bread & tomatoes</p>
                                                    <div className="item-price">₹199</div>
                                                </div>
                                                <button className="add-btn">+</button>
                                            </div>
                                        </div>
                                        <div className="cart-bar">
                                            <div className="cart-info">
                                                <span>2 items</span>
                                                <span className="cart-total">₹498</span>
                                            </div>
                                            <button className="checkout-btn">Checkout</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="floating-elements">
                                <div className="floating-card card-1">
                                    <i className="fas fa-bell"></i>
                                    <span>Order Ready!</span>
                                </div>
                                <div className="floating-card card-2">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Payment Success</span>
                                </div>
                                <div className="floating-card card-3">
                                    <i className="fas fa-star"></i>
                                    <span>5.0 Rating</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="features">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 className="section-title">Powerful Features</h2>
                        <p className="section-subtitle">Everything you need to streamline operations</p>
                    </div>

                    <div className="features-showcase">
                        <div className="feature-tabs">
                            {features.map((feature, index) => (
                                <button
                                    key={index}
                                    className={`feature-tab ${activeFeature === index ? 'active' : ''}`}
                                    onClick={() => setActiveFeature(index)}
                                    style={{ '--color': feature.color }}
                                >
                                    <i className={`fas ${feature.icon}`}></i>
                                    <span>{feature.title}</span>
                                </button>
                            ))}
                        </div>

                        <div className="feature-content animate-on-scroll">
                            <div className="feature-image">
                                <img src={features[activeFeature].image} alt={features[activeFeature].title} />
                            </div>
                            <div className="feature-info">
                                <h3>{features[activeFeature].title}</h3>
                                <p>{features[activeFeature].description}</p>
                                <button className="btn btn-primary">Learn More</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section ref={pricingRef} className="pricing">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 className="section-title">Simple Pricing</h2>
                        <p className="section-subtitle">One plan, unlimited possibilities</p>
                    </div>

                    <div className="pricing-controls animate-on-scroll">
                        <div className="pricing-toggle">
                            <button
                                className={`toggle-btn ${pricingPlan === 'monthly' ? 'active' : ''}`}
                                onClick={() => setPricingPlan('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                className={`toggle-btn ${pricingPlan === 'yearly' ? 'active' : ''}`}
                                onClick={() => setPricingPlan('yearly')}
                            >
                                Yearly <span className="discount">Save 20%</span>
                            </button>
                        </div>

                        <div className="currency-selector" ref={currencyDropdownRef}>
                            <button
                                className="currency-btn"
                                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                            >
                                <span>{currencySymbols[currency]}</span>
                                <span>{currency}</span>
                                <i className={`fas fa-chevron-${showCurrencyDropdown ? 'up' : 'down'}`}></i>
                            </button>

                            {showCurrencyDropdown && (
                                <div className="currency-dropdown">
                                    {Object.keys(currencyRates).map(curr => (
                                        <button
                                            key={curr}
                                            className={`currency-option ${currency === curr ? 'active' : ''}`}
                                            onClick={() => {
                                                setCurrency(curr);
                                                setShowCurrencyDropdown(false);
                                            }}
                                        >
                                            <span>{currencySymbols[curr]}</span>
                                            <span>{curr}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pricing-card animate-on-scroll">
                        <div className="pricing-header">
                            <h3 className="pricing-title">Complete Solution</h3>
                            <div className="pricing-price">
                                <span className="currency-symbol">{currencySymbols[currency]}</span>
                                <span className="amount">{formatPrice(calculatePrice())}</span>
                                <span className="period">/{pricingPlan === 'monthly' ? 'mo' : 'mo'}</span>
                            </div>
                            <p className="pricing-description">Everything you need to run your restaurant efficiently</p>
                        </div>

                        <div className="pricing-features">
                            <div className="feature-group">
                                <h4>Core Features</h4>
                                <ul>
                                    <li><i className="fas fa-check"></i>Unlimited tables</li>
                                    <li><i className="fas fa-check"></i>Advanced menu management</li>
                                    <li><i className="fas fa-check"></i>Custom QR codes</li>
                                    <li><i className="fas fa-check"></i>Real-time analytics</li>
                                </ul>
                            </div>

                            <div className="feature-group">
                                <h4>Advanced Features</h4>
                                <ul>
                                    <li><i className="fas fa-check"></i>Customer insights</li>
                                    <li><i className="fas fa-check"></i>Priority support</li>
                                    <li><i className="fas fa-check"></i>Custom branding</li>
                                    <li><i className="fas fa-check"></i>API access</li>
                                </ul>
                            </div>
                        </div>

                        <button className="btn btn-primary pricing-btn" onClick={goToSignup}>
                            Start Free Trial
                        </button>

                        <div className="pricing-guarantee">
                            <i className="fas fa-shield-alt"></i>
                            <span>14-day money-back guarantee</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 className="section-title">Customer Success Stories</h2>
                        <p className="section-subtitle">Join thousands of restaurants using EndOfHunger</p>
                    </div>

                    <div className="testimonial-slider animate-on-scroll">
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <div className="rating">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className="fas fa-star"></i>
                                    ))}
                                </div>
                                <p className="testimonial-text">{testimonials[testimonialIndex].quote}</p>
                            </div>
                            <div className="testimonial-author">
                                <img src={testimonials[testimonialIndex].image} alt={testimonials[testimonialIndex].name} className="author-image" />
                                <div className="author-info">
                                    <h4 className="author-name">{testimonials[testimonialIndex].name}</h4>
                                    <p className="author-position">{testimonials[testimonialIndex].position}</p>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-dots">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    className={`dot ${index === testimonialIndex ? 'active' : ''}`}
                                    onClick={() => setTestimonialIndex(index)}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content animate-on-scroll">
                        <h2 className="cta-title">Ready to End Hunger?</h2>
                        <p className="cta-description">
                            Start your free 14-day trial today. No credit card required.
                        </p>

                        <form className="cta-form" onSubmit={handleEmailSubmit}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        'Get Started Free'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="cta-features">
                            <div className="cta-feature">
                                <i className="fas fa-check-circle"></i>
                                <span>No credit card required</span>
                            </div>
                            <div className="cta-feature">
                                <i className="fas fa-check-circle"></i>
                                <span>14-day free trial</span>
                            </div>
                            <div className="cta-feature">
                                <i className="fas fa-check-circle"></i>
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <div className="footer-logo">
                                <div className="logo-icon">
                                    <i className="fas fa-utensils"></i>
                                </div>
                                <span className="logo-text">EndOfHunger</span>
                            </div>
                            <p className="footer-description">
                                The most advanced QR-based restaurant ordering system for enhanced dining experiences.
                            </p>
                            <div className="social-links">
                                <a href="/" onClick={(e) => e.preventDefault()} className="social-link">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                                <a href="/" onClick={(e) => e.preventDefault()} className="social-link">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="/" onClick={(e) => e.preventDefault()} className="social-link">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="/" onClick={(e) => e.preventDefault()} className="social-link">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                            </div>
                        </div>

                        <div className="footer-section">
                            <h3 className="footer-title">Product</h3>
                            <ul className="footer-links">
                                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Features</a></li>
                                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }}>Pricing</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>FAQ</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Integrations</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h3 className="footer-title">Company</h3>
                            <ul className="footer-links">
                                <li><a href="/" onClick={(e) => e.preventDefault()}>About</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Blog</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Careers</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Contact</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h3 className="footer-title">Support</h3>
                            <ul className="footer-links">
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Help Center</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Documentation</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>API Reference</a></li>
                                <li><a href="/" onClick={(e) => e.preventDefault()}>Status</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2023 EndOfHunger. All rights reserved.</p>
                        <div className="footer-legal">
                            <a href="/" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                            <a href="/" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default DashboardPage;