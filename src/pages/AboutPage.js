import React from 'react';
import { useNavigate } from 'react-router-dom';

function AboutPage() {
    const navigate = useNavigate();

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
                            About RedSorm
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            Restaurant dining &<br />
                            <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                                Smart order management
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            RedSorm is revolutionizing the restaurant industry with our comprehensive QR-based ordering and management platform. We empower restaurants to deliver exceptional dining experiences while streamlining operations.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-10 shadow-lg">
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <i className="fas fa-bullseye text-3xl text-white"></i>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Mission</h2>
                            <p className="text-gray-700 text-lg leading-relaxed">
                                To transform traditional dining into seamless, technology-driven experiences. We're committed to helping restaurants increase efficiency, reduce costs, and delight customers with innovative solutions.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-10 shadow-lg">
                            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <i className="fas fa-eye text-3xl text-white"></i>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Vision</h2>
                            <p className="text-gray-700 text-lg leading-relaxed">
                                To become the world's leading restaurant management platform, powering millions of dining experiences globally. We envision a future where every restaurant leverages technology to maximize potential.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Story</h2>
                        <div className="bg-white rounded-3xl p-10 shadow-xl">
                            <p className="text-gray-700 text-lg leading-relaxed mb-6">
                                RedSorm was born from a simple observation: restaurants were struggling with outdated ordering systems, inefficient kitchen workflows, and limited customer insights. In 2023, our founders—experienced technologists and restaurant professionals—came together to create a solution.
                            </p>
                            <p className="text-gray-700 text-lg leading-relaxed mb-6">
                                What started as a QR code ordering system quickly evolved into a comprehensive restaurant operating system. Today, RedSorm powers everything from customer ordering to kitchen management, analytics, inventory control, and staff coordination.
                            </p>
                            <p className="text-gray-700 text-lg leading-relaxed">
                                We've helped hundreds of restaurants increase their revenue by an average of 25%, reduce order processing time by 40%, and deliver superior customer experiences. Our journey is just beginning, and we're excited to continue innovating for the restaurant industry.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-orange-500">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-white">Our Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: 'fa-rocket',
                                title: 'Innovation',
                                description: 'We constantly push boundaries, leveraging cutting-edge technology to solve real problems for restaurants.'
                            },
                            {
                                icon: 'fa-heart',
                                title: 'Customer-Centric',
                                description: 'Every feature we build is designed with restaurant owners, staff, and diners in mind.'
                            },
                            {
                                icon: 'fa-shield-alt',
                                title: 'Reliability',
                                description: 'We ensure 99.9% uptime and enterprise-grade security to protect your business.'
                            },
                            {
                                icon: 'fa-users',
                                title: 'Partnership',
                                description: 'We see ourselves as partners in your success, providing ongoing support and guidance.'
                            },
                            {
                                icon: 'fa-chart-line',
                                title: 'Growth',
                                description: 'We are dedicated to helping restaurants scale and achieve sustainable growth.'
                            },
                            {
                                icon: 'fa-lightbulb',
                                title: 'Transparency',
                                description: 'We believe in honest communication, clear pricing, and open collaboration.'
                            }
                        ].map((value, index) => (
                            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className={`fas ${value.icon} text-3xl`}></i>
                                </div>
                                <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                                <p className="text-white/90">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Meet Our Team</h2>
                    <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
                        RedSorm is powered by a diverse team of engineers, designers, and restaurant industry veterans.
                    </p>
                    <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {[
                            { name: 'Alex Martinez', role: 'CEO & Co-Founder', image: 'https://picsum.photos/seed/ceo/300/300' },
                            { name: 'Sarah Chen', role: 'CTO', image: 'https://picsum.photos/seed/cto/300/300' },
                            { name: 'Michael Johnson', role: 'Head of Product', image: 'https://picsum.photos/seed/product/300/300' },
                            { name: 'Emily Rodriguez', role: 'Head of Customer Success', image: 'https://picsum.photos/seed/success/300/300' }
                        ].map((member, index) => (
                            <div key={index} className="text-center group">
                                <div className="relative mb-4 overflow-hidden rounded-2xl">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                <p className="text-purple-600 font-medium">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Restaurant?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join hundreds of restaurants already using RedSorm to streamline operations and delight customers.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                        >
                            Start Free Trial
                        </button>
                        <button
                            onClick={() => navigate('/features')}
                            className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
                        >
                            Explore Features
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutPage;
