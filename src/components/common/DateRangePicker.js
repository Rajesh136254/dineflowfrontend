import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    const handleStartDateChange = (date) => {
        setLocalStartDate(date);
        if (date > localEndDate) {
            setLocalEndDate(date);
        }
        onChange({ startDate: date, endDate: localEndDate });
    };

    const handleEndDateChange = (date) => {
        setLocalEndDate(date);
        if (date < localStartDate) {
            setLocalStartDate(date);
        }
        onChange({ startDate: localStartDate, endDate: date });
    };

    const handlePresetClick = (preset) => {
        const now = new Date();
        let startDate, endDate;

        switch (preset) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setDate(now.getDate() - now.getDay() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'lastWeek':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setDate(now.getDate() - now.getDay() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'lastYear':
                startDate = new Date(now.getFullYear() - 1, 0, 1);
                endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
            default:
                return;
        }

        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
        onChange({ startDate, endDate });
    };

    return (
        <div className="date-range-picker">
            <div className="date-inputs">
                <div className="date-input-group">
                    <label>From:</label>
                    <DatePicker
                        selected={localStartDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={localStartDate}
                        endDate={localEndDate}
                        dateFormat="MMM d, yyyy"
                        className="form-control"
                    />
                </div>
                <div className="date-input-group">
                    <label>To:</label>
                    <DatePicker
                        selected={localEndDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={localStartDate}
                        endDate={localEndDate}
                        minDate={localStartDate}
                        dateFormat="MMM d, yyyy"
                        className="form-control"
                    />
                </div>
            </div>
            <div className="date-presets">
                <button onClick={() => handlePresetClick('today')}>Today</button>
                <button onClick={() => handlePresetClick('yesterday')}>Yesterday</button>
                <button onClick={() => handlePresetClick('thisWeek')}>This Week</button>
                <button onClick={() => handlePresetClick('lastWeek')}>Last Week</button>
                <button onClick={() => handlePresetClick('thisMonth')}>This Month</button>
                <button onClick={() => handlePresetClick('lastMonth')}>Last Month</button>
                <button onClick={() => handlePresetClick('thisYear')}>This Year</button>
                <button onClick={() => handlePresetClick('lastYear')}>Last Year</button>
            </div>
        </div>
    );
};

export default DateRangePicker;