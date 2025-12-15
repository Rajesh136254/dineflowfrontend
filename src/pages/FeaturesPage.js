import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function FeaturesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [expandedFeature, setExpandedFeature] = useState('qr-ordering');

    useEffect(() => {
        // Check if there's a feature parameter in the URL
        const featureParam = searchParams.get('feature');
        if (featureParam) {
            setExpandedFeature(featureParam);
            // Scroll to the feature after a short delay to ensure rendering
            setTimeout(() => {
                const element = document.getElementById(`feature-${featureParam}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [searchParams]);

    const features = [
        {
            id: 'qr-ordering',
            title: 'QR Code Ordering',
            icon: 'fa-qrcode',
            color: 'purple',
            tagline: 'Frictionless ordering at customers\' fingertips',
            image: '/qr_ordering_feature_1765608231179.png',
            description: 'Customers scan a QR code at their table to instantly access your digital menu, browse items, customize orders, and pay—all from their own devices.',
            benefits: [
                'No app download required',
                'Instant menu access via QR code',
                'Real-time order tracking',
                'Multiple payment options',
                'Contactless and hygienic',
                'Reduces staff workload by 40%'
            ],
            howItWorks: [
                'Customer scans QR code on table',
                'Digital menu loads instantly on their phone',
                'Browse categories, view images & descriptions',
                'Add items to cart with customizations',
                'Confirm order with one tap',
                'Payment processed securely',
                'Order sent directly to kitchen'
            ]
        },
        {
            id: 'kds',
            title: 'Kitchen Display System',
            icon: 'fa-fire',
            color: 'orange',
            tagline: 'Replace printers with smart screens',
            image: '/kitchen_display_system_1765608257317.png',
            description: 'A modern, real-time kitchen display that replaces paper tickets. Orders appear instantly with clear preparation instructions, timers, and status updates.',
            benefits: [
                'Eliminate paper waste',
                'Real-time order synchronization',
                'Color-coded priority indicators',
                'Built-in preparation timers',
                'One-tap status updates',
                'Reduces order errors by 60%'
            ],
            howItWorks: [
                'Orders appear instantly on KDS screen',
                'Color-coded: Red (new), Yellow (preparing), Green (ready)',
                'Chef taps "Start" to begin preparation',
                'Timer tracks preparation time',
                'Mark items as "Ready" when complete',
                'Automatic notification to serving staff',
                'Historical data for analytics'
            ]
        },
        {
            id: 'analytics',
            title: 'Analytics & Insights',
            icon: 'fa-chart-line',
            color: 'green',
            tagline: 'Data-driven decisions for growth',
            image: '/analytics_dashboard_feature_1765608276694.png',
            description: 'Comprehensive analytics dashboard with sales trends, popular items, peak hours, customer behavior, and actionable business insights.',
            benefits: [
                'Real-time sales tracking',
                'Top-selling items analysis',
                'Peak hours identification',
                'Revenue trend forecasting',
                'Customer behavior insights',
                'Exportable reports (PDF, Excel)'
            ],
            howItWorks: [
                'Automatic data collection from all orders',
                'Daily, weekly, monthly reporting',
                'Visual charts and graphs',
                'Filter by date range, branch, item',
                'Identify best-sellers and slow movers',
                'Download reports for accounting',
                'AI-powered recommendations (coming soon)'
            ]
        },
        {
            id: 'table-management',
            title: 'Table Management',
            icon: 'fa-th',
            color: 'blue',
            tagline: 'Digital floor plan with real-time status',
            image: '/table_management_feature_1765608294874.png',
            description: 'Visual floor plan showing table occupancy, reservations, and real-time status. Optimize seating and reduce wait times.',
            benefits: [
                'Real-time table status',
                'Visual floor plan',
                'Reservation management',
                'Occupancy tracking',
                'Wait time optimization',
                'Increases table turnover by 20%'
            ],
            howItWorks: [
                'Create digital floor plan',
                'Add tables with numbers and capacities',
                'Track status: Available, Occupied, Reserved',
                'See how long customers have been seated',
                'Manage reservations',
                'Assign orders to specific tables',
                'Auto-release tables after payment'
            ]
        },
        {
            id: 'menu-management',
            title: 'Dynamic Menu Control',
            icon: 'fa-book-open',
            color: 'indigo',
            tagline: 'Update your menu in seconds, live everywhere',
            image: '/menu_management_feature_1765608331063.png',
            description: 'Centralized menu management with instant updates across all channels. Add, edit, or remove items in real-time.',
            benefits: [
                'Instant menu updates',
                'Rich media support (images, videos)',
                'Category organization',
                'Availability toggles',
                'Price management',
                'Multi-language support'
            ],
            howItWorks: [
                'Admin logs into dashboard',
                'Add/edit menu items with images',
                'Set prices, descriptions, allergens',
                'Organize into categories',
                'Toggle availability (in-stock/out-of-stock)',
                'Changes reflect instantly on customer app',
                'Version history for rollback'
            ]
        },
        {
            id: 'inventory',
            title: 'Smart Inventory',
            icon: 'fa-cubes',
            color: 'teal',
            tagline: 'Automated stock tracking with alerts',
            image: '/inventory_management_feature_1765608351609.png',
            description: 'Intelligent inventory system that tracks ingredients, auto-deducts stock on orders, and alerts you when supplies run low.',
            benefits: [
                'Automatic stock deduction',
                'Low-stock alerts',
                'Ingredient tracking',
                'Expiry date management',
                'Supplier contact integration',
                'Reduces food waste by 30%'
            ],
            howItWorks: [
                'Configure ingredients for each menu item',
                'Set stock levels and reorder points',
                'Stock auto-deducts when orders placed',
                'Receive alerts when inventory is low',
                'Track expiry dates',
                'Generate purchase orders',
                'View consumption trends'
            ]
        },
        {
            id: 'role-management',
            title: 'Role & Permission Management',
            icon: 'fa-user-shield',
            color: 'purple',
            tagline: 'Secure access control for your team',
            image: '/role_management_feature_1765608373048.png',
            description: 'Granular role-based access control. Define permissions for staff, chefs, managers, and admins with secure authentication.',
            benefits: [
                'Custom role creation',
                'Granular permission control',
                'Secure login system',
                'Activity logging',
                'Multi-branch support',
                'Enhanced security & accountability'
            ],
            howItWorks: [
                'Create custom roles (e.g., Waiter, Chef, Manager)',
                'Assign permissions per role',
                'Users login with unique credentials',
                'Access only permitted features',
                'Track user activity and changes',
                'Manage staff across multiple branches',
                'Revoke access instantly if needed'
            ]
        },
        {
            id: 'branch-management',
            title: 'Branch Management',
            icon: 'fa-code-branch',
            color: 'red',
            tagline: 'Manage multiple locations from one dashboard',
            image: '/dash-feature-branches.png',
            description: 'Comprehensive multi-location management system. Control menus, inventory, staff, and operations across all your restaurant branches from a single unified dashboard.',
            benefits: [
                'Centralized multi-branch control',
                'Branch-specific menu customization',
                'Individual inventory tracking per location',
                'Cross-branch analytics and reporting',
                'Staff assignment to specific branches',
                'Real-time sync across all locations'
            ],
            howItWorks: [
                'Create and configure multiple branch locations',
                'Assign unique settings to each branch',
                'Customize menus per branch if needed',
                'Track inventory separately for each location',
                'View consolidated or branch-specific reports',
                'Assign staff and roles to specific branches',
                'Monitor all branches in real-time from one dashboard'
            ]
        }
    ];

    const toggleFeature = (featureId) => {
        setExpandedFeature(expandedFeature === featureId ? null : featureId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-orange-50">
            {/* Navigation Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-orange-500 rounded-full flex items-center justify-center">
                                <i className="fas fa-utensils text-white"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">RedSorm</h1>
                                <p className="text-xs text-gray-500">Restaurant dining & Smart order management</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-orange-500/10"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                            Comprehensive Features
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            Everything You Need to<br />
                            <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                                Run a Modern Restaurant
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            From QR ordering to analytics, RedSorm provides a complete suite of tools designed to streamline operations and delight customers.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features List */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                id={`feature-${feature.id}`}
                                className={`bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ${expandedFeature === feature.id ? 'ring-4 ring-purple-500' : ''}`}
                            >
                                {/* Feature Header */}
                                <div
                                    onClick={() => toggleFeature(feature.id)}
                                    className="cursor-pointer p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-6 flex-1">
                                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform" style={{ background: `linear-gradient(to bottom right, ${feature.color === 'purple' ? '#9333EA' : feature.color === 'orange' ? '#F97316' : feature.color === 'green' ? '#10B981' : feature.color === 'blue' ? '#3B82F6' : feature.color === 'indigo' ? '#6366F1' : '#14B8A6'}, ${feature.color === 'purple' ? '#7E22CE' : feature.color === 'orange' ? '#EA580C' : feature.color === 'green' ? '#059669' : feature.color === 'blue' ? '#2563EB' : feature.color === 'indigo' ? '#4F46E5' : '#0F766E'})` }}>
                                            <i className={`fas ${feature.icon} text-3xl text-white`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{feature.title}</h2>
                                            <p className="text-lg text-gray-600">{feature.tagline}</p>
                                        </div>
                                    </div>
                                    <div className="text-gray-400">
                                        <i className={`fas fa-chevron-down text-2xl transform transition-transform ${expandedFeature === feature.id ? 'rotate-180' : ''}`}></i>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedFeature === feature.id && (
                                    <div className="p-8 pt-0 animate-fade-in">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Left: Image */}
                                            <div className="order-2 md:order-1">
                                                <img
                                                    src={feature.image}
                                                    alt={feature.title}
                                                    className="w-full rounded-2xl shadow-2xl"
                                                />
                                            </div>

                                            {/* Right: Details */}
                                            <div className="order-1 md:order-2 space-y-6">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Overview</h3>
                                                    <p className="text-gray-700 text-lg leading-relaxed">{feature.description}</p>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Key Benefits</h3>
                                                    <ul className="space-y-2">
                                                        {feature.benefits.map((benefit, i) => (
                                                            <li key={i} className="flex items-start">
                                                                <i className="fas fa-check-circle mr-3 mt-1" style={{ color: feature.color === 'purple' ? '#9333EA' : feature.color === 'orange' ? '#F97316' : feature.color === 'green' ? '#10B981' : feature.color === 'blue' ? '#3B82F6' : feature.color === 'indigo' ? '#6366F1' : '#14B8A6' }}></i>
                                                                <span className="text-gray-700">{benefit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* How It Works */}
                                        <div className="mt-8 bg-gray-50 rounded-2xl p-8">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {feature.howItWorks.map((step, i) => (
                                                    <div key={i} className="flex items-start space-x-3 bg-white p-4 rounded-xl shadow-sm">
                                                        <div className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: feature.color === 'purple' ? '#9333EA' : feature.color === 'orange' ? '#F97316' : feature.color === 'green' ? '#10B981' : feature.color === 'blue' ? '#3B82F6' : feature.color === 'indigo' ? '#6366F1' : '#14B8A6' }}>
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-gray-700 text-sm">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Experience All Features?</h2>
                    <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
                        Start your 14-day free trial and discover how RedSorm can transform your restaurant operations.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                        >
                            Start Free Trial
                        </button>
                        <button
                            onClick={() => navigate('/about')}
                            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all border-2 border-white"
                        >
                            Learn More About Us
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default FeaturesPage;
