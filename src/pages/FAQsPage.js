import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FAQsPage() {
    const navigate = useNavigate();
    const [openFAQ, setOpenFAQ] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const faqCategories = [
        {
            category: 'Getting Started',
            icon: 'fa-rocket',
            color: 'purple',
            questions: [
                {
                    q: 'How do I get started with RedSorm?',
                    a: 'Getting started is simple! Sign up for a free trial, set up your restaurant profile, add your menu items, and generate QR codes for your tables. Our onboarding wizard will guide you through each step. You can be up and running in under 30 minutes.'
                },
                {
                    q: 'Is there a setup fee?',
                    a: 'No, there are no setup fees. RedSorm offers a 14-day free trial with full access to all features. After the trial, you can choose a monthly or annual subscription plan that fits your needs.'
                },
                {
                    q: 'Do I need any special hardware?',
                    a: 'No special hardware is required! RedSorm works on any device with a web browser—smartphones, tablets, or computers. For the Kitchen Display System, we recommend a tablet or monitor for optimal viewing.'
                },
                {
                    q: 'Can I import my existing menu?',
                    a: 'Yes! You can manually add items through our intuitive interface, or contact our support team who can help you bulk import your menu from a spreadsheet.'
                }
            ]
        },
        {
            category: 'Features & Functionality',
            icon: 'fa-cog',
            color: 'blue',
            questions: [
                {
                    q: 'How does QR code ordering work?',
                    a: 'Customers scan a QR code placed on their table using their smartphone camera. This opens your digital menu in their browser (no app download needed). They can browse, select items, customize orders, and pay—all from their phone. Orders are sent directly to your Kitchen Display System.'
                },
                {
                    q: 'Can customers pay through the app?',
                    a: 'Absolutely! RedSorm integrates with multiple payment gateways to accept credit/debit cards, UPI, wallets, and more. Payments are secure, encrypted, and processed instantly.'
                },
                {
                    q: 'Does RedSorm support multiple branches?',
                    a: 'Yes! RedSorm has robust multi-branch support. You can manage multiple locations from a single admin panel, with branch-specific menus, staff, analytics, and inventory tracking.'
                },
                {
                    q: 'Can I customize the menu for different times of day?',
                    a: 'Yes! You can create different menus for breakfast, lunch, dinner, and even special events. Items can be scheduled to appear or disappear automatically at specific times.'
                },
                {
                    q: 'What languages does RedSorm support?',
                    a: 'RedSorm supports multiple languages including English, Hindi, Spanish, French, Chinese, and more. Customers can view the menu in their preferred language, and you can manage content in multiple languages from the admin panel.'
                }
            ]
        },
        {
            category: 'Pricing & Plans',
            icon: 'fa-dollar-sign',
            color: 'green',
            questions: [
                {
                    q: 'How much does RedSorm cost?',
                    a: 'RedSorm offers flexible pricing starting at ₹3,499/month (annual plan) or ₹4,999/month (monthly plan). This includes unlimited orders, all features, and 24/7 support. We also offer custom enterprise plans for large chains.'
                },
                {
                    q: 'Is there a free trial?',
                    a: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.'
                },
                {
                    q: 'Are there any transaction fees?',
                    a: 'RedSorm itself does not charge transaction fees. However, payment gateway providers (like Stripe, Razorpay, etc.) charge their standard processing fees (typically 2-3% per transaction).'
                },
                {
                    q: 'Can I cancel my subscription anytime?',
                    a: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your subscription will remain active until the end of your billing period.'
                }
            ]
        },
        {
            category: 'Technical & Support',
            icon: 'fa-headset',
            color: 'orange',
            questions: [
                {
                    q: 'What if I need help setting up?',
                    a: 'We offer 24/7 customer support via chat, email, and phone. Our support team can guide you through setup, answer questions, and troubleshoot any issues. We also have extensive documentation and video tutorials.'
                },
                {
                    q: 'Is my data secure?',
                    a: 'Absolutely! RedSorm uses enterprise-grade security with SSL encryption, secure data centers, and regular backups. We comply with industry standards like PCI-DSS for payment security and GDPR for data privacy.'
                },
                {
                    q: 'What happens if the internet goes down?',
                    a: 'RedSorm requires an internet connection to sync orders in real-time. We recommend having a backup internet connection (like a mobile hotspot). Offline mode is on our roadmap and will be available soon.'
                },
                {
                    q: 'Can I integrate RedSorm with my existing POS system?',
                    a: 'Yes! RedSorm offers API integrations with popular POS systems. Contact our support team to discuss your specific integration needs.'
                },
                {
                    q: 'Do you provide training for my staff?',
                    a: 'Yes! We provide onboarding training sessions, video tutorials, and documentation to help your staff get up to speed quickly. We can also conduct on-site training for larger teams (additional fees may apply).'
                }
            ]
        },
        {
            category: 'Kitchen & Operations',
            icon: 'fa-utensils',
            color: 'red',
            questions: [
                {
                    q: 'How does the Kitchen Display System (KDS) work?',
                    a: 'Orders appear instantly on the KDS screen as soon as customers place them. Orders are color-coded (red for new, yellow for preparing, green for ready) and include preparation instructions, timers, and quantity. Chefs can update status with a single tap.'
                },
                {
                    q: 'Can multiple devices access the KDS?',
                    a: 'Yes! You can have multiple KDS screens in different kitchen stations (e.g., one for grill, one for desserts). All screens sync in real-time.'
                },
                {
                    q: 'Does RedSorm track inventory automatically?',
                    a: 'Yes! Once you configure ingredients for each menu item, RedSorm automatically deducts stock when orders are placed. You\'ll receive low-stock alerts and can track consumption trends.'
                },
                {
                    q: 'Can I manage staff roles and permissions?',
                    a: 'Absolutely! You can create custom roles (e.g., Waiter, Chef, Manager, Admin) and assign specific permissions. This ensures staff only access features relevant to their job.'
                }
            ]
        },
        {
            category: 'Analytics & Reporting',
            icon: 'fa-chart-bar',
            color: 'indigo',
            questions: [
                {
                    q: 'What kind of analytics does RedSorm provide?',
                    a: 'RedSorm provides comprehensive analytics including total sales, revenue trends, top-selling items, peak hours, table performance, average order value, customer behavior, and more. All data is visualized with charts and graphs.'
                },
                {
                    q: 'Can I export reports?',
                    a: 'Yes! You can export all reports in PDF or Excel format for accounting, tax filing, or deeper analysis.'
                },
                {
                    q: 'Can I filter analytics by date or branch?',
                    a: 'Yes! You can filter data by date range (today, this week, this month, custom range), branch, category, or individual items.'
                }
            ]
        }
    ];

    const toggleFAQ = (categoryIndex, questionIndex) => {
        const key = `${categoryIndex}-${questionIndex}`;
        setOpenFAQ(openFAQ === key ? null : key);
    };

    const filteredCategories = searchTerm
        ? faqCategories.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q =>
                q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.a.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0)
        : faqCategories;

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
                            Frequently Asked Questions
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            Got Questions?<br />
                            <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                                We've Got Answers
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-10">
                            Everything you need to know about RedSorm. Can't find what you're looking for? Contact our support team.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <i className="fas fa-search absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
                                <input
                                    type="text"
                                    placeholder="Search for answers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-6 py-5 rounded-2xl shadow-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Categories */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto space-y-12">
                        {filteredCategories.map((category, catIndex) => (
                            <div key={catIndex}>
                                {/* Category Header */}
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${category.color === 'purple' ? '#9333EA' : category.color === 'blue' ? '#3B82F6' : category.color === 'green' ? '#10B981' : category.color === 'orange' ? '#F97316' : category.color === 'indigo' ? '#6366F1' : '#EF4444'}, ${category.color === 'purple' ? '#7E22CE' : category.color === 'blue' ? '#2563EB' : category.color === 'green' ? '#059669' : category.color === 'orange' ? '#EA580C' : category.color === 'indigo' ? '#4F46E5' : '#DC2626'})` }}>
                                        <i className={`fas ${category.icon} text-2xl text-white`}></i>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900">{category.category}</h2>
                                </div>

                                {/* Questions */}
                                <div className="space-y-4">
                                    {category.questions.map((faq, qIndex) => (
                                        <div
                                            key={qIndex}
                                            className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${openFAQ === `${catIndex}-${qIndex}` ? 'ring-2 ring-' + category.color + '-500' : ''}`}
                                        >
                                            {/* Question */}
                                            <button
                                                onClick={() => toggleFAQ(catIndex, qIndex)}
                                                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.q}</h3>
                                                <i className="fas fa-chevron-down text-xl transform transition-transform" style={{ color: category.color === 'purple' ? '#9333EA' : category.color === 'blue' ? '#3B82F6' : category.color === 'green' ? '#10B981' : category.color === 'orange' ? '#F97316' : category.color === 'indigo' ? '#6366F1' : '#EF4444', transform: openFAQ === `${catIndex}-${qIndex}` ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                                            </button>

                                            {/* Answer */}
                                            {openFAQ === `${catIndex}-${qIndex}` && (
                                                <div className="px-6 pb-6 text-gray-700 leading-relaxed animate-fade-in">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Still Have Questions? */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                <div className="container mx-auto px-4 text-center">
                    <i className="fas fa-question-circle text-6xl mb-6 opacity-80"></i>
                    <h2 className="text-4xl font-bold mb-4">Still Have Questions?</h2>
                    <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
                        Our support team is available 24/7 to help you with anything you need.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <button
                            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                        >
                            <i className="fas fa-comments mr-2"></i>Chat with Support
                        </button>
                        <button
                            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all border-2 border-white"
                        >
                            <i className="fas fa-envelope mr-2"></i>Email Us
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default FAQsPage;
