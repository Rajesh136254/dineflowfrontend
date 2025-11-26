import React from 'react';

const KPICard = ({ title, value, previousValue, icon, color = 'orange', format }) => {
    const calculatePercentageChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    const trend = previousValue !== null ? calculatePercentageChange(value, previousValue) : null;
    const isPositive = trend >= 0;
    const displayValue = format ? format(value) : value;

    return (
        <div className={`kpi-card ${color}`}>
            <div className="kpi-header">
                <div className={`kpi-icon w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center`}>
                    <i className={`fas ${icon} text-${color}-600`}></i>
                </div>
                {trend !== null && (
                    <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
                        <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'}`}></i>
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="kpi-value">{displayValue}</div>
            <div className="kpi-label">{title}</div>
            {trend !== null && (
                <div className="kpi-comparison">
                    {isPositive ? 'Up' : 'Down'} from previous period
                </div>
            )}
        </div>
    );
};

export default KPICard;