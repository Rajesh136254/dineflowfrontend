// src/pages/QrCodesPage.js (Final, Clean Version)
import React, { useState, useEffect, useRef } from 'react';

function QrCodesPage() {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const qrRefs = useRef({});
    const BASE_URL = window.location.origin;
    const API_URL = 'http://localhost:5000'; // Force use of backend server

    const loadTables = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tables`);
            const data = await response.json();
            if (data.success) {
                setTables(data.data || []);
            } else {
                // Fallback to mock data if API fails
                setTables(Array.from({ length: 12 }, (_, i) => ({ 
                    id: i + 1, 
                    table_number: i + 1, 
                    table_name: `Table ${i + 1}`,
                    qr_code_data: `${BASE_URL}/customer.html?table=${i + 1}`
                })));
            }
        } catch (err) {
            console.error("Failed to load tables:", err);
            setError("Failed to load tables.");
            // Fallback to mock data if API fails
            setTables(Array.from({ length: 12 }, (_, i) => ({ 
                id: i + 1, 
                table_number: i + 1, 
                table_name: `Table ${i + 1}`,
                qr_code_data: `${BASE_URL}/customer.html?table=${i + 1}`
            })));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Load QRCode library
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.async = true;
        script.onload = () => {
            loadTables();
        };
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        // Ensure the library is ready and we have tables
        if (typeof window.QRCode === 'undefined' || tables.length === 0) {
            return;
        }
        tables.forEach(table => {
            const container = qrRefs.current[table.id];
            if (container && container.children.length === 0) {
                new window.QRCode(container, {
                    text: table.qr_code_data || `${BASE_URL}/customer.html?table=${table.table_number}`,
                    width: 200,
                    height: 200,
                });
            }
        });
    }, [tables]);

    const printQR = (tableId) => {
        const element = document.getElementById(`qr-${tableId}`)?.parentElement;
        if (!element) return;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head><title>Print QR Code</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;}.qr-print{text-align:center;padding:40px;}@page{margin:0;}</style></head>
                <body><div class="qr-print">${element.innerHTML}</div></body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    if (error) {
        return <div className="p-4 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
                <h1 className="text-3xl font-bold">📱 QR Codes for Tables</h1>
                <p className="text-indigo-100">Scan to Order</p>
            </div>
            <div className="p-4">
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800"><strong>Instructions:</strong> Print these QR codes and place them on respective tables.</p>
                </div>
                {isLoading ? (
                    <div className="text-center py-12"><p className="text-gray-500">Loading tables...</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tables.map(table => (
                            <div key={table.id} className="bg-white rounded-lg shadow-lg p-6 text-center">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">Table {table.table_number}</h3>
                                <div id={`qr-${table.id}`} ref={el => qrRefs.current[table.id] = el} className="flex justify-center mb-4"></div>
                                <p className="text-sm text-gray-600 mb-3">{table.table_name}</p>
                                <button onClick={() => printQR(table.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg w-full">
                                    🖨️ Print QR Code
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default QrCodesPage;