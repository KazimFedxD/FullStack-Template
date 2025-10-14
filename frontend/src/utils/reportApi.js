import { apiGet, apiPostAuth } from './apiClient';

// Get weather reports for a location
export const getWeatherReports = async (location, date) => {
  try {
    const response = await apiGet(`/api/report/?location=${encodeURIComponent(location)}&date=${date}`, {
      requireAuth: false
    });
    return response;
  } catch (error) {
    console.error('Error fetching weather reports:', error);
    return { ok: false, error };
  }
};

// Submit a weather report (authenticated users only)
export const submitWeatherReport = async (location, date, report) => {
  try {
    const response = await apiPostAuth('/api/report/', {
      location,
      date,
      report
    });
    return response;
  } catch (error) {
    console.error('Error submitting weather report:', error);
    return { ok: false, error };
  }
};

// Weather report options with emojis and display names
export const REPORT_OPTIONS = [
  { value: 'severe_storm', label: 'Severe Storm', emoji: '⛈️' },
  { value: 'heavy_rain', label: 'Heavy Rain', emoji: '🌧️' },
  { value: 'strong_winds', label: 'Strong Winds', emoji: '💨' },
  { value: 'light_rain', label: 'Light Rain', emoji: '🌦️' },
  { value: 'cloudy', label: 'Cloudy', emoji: '☁️' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', emoji: '⛅' },
  { value: 'clear_sky', label: 'Clear Sky', emoji: '☀️' }
];

// Get display info for a report value
export const getReportDisplayInfo = (reportValue) => {
  return REPORT_OPTIONS.find(option => option.value === reportValue) || 
         { value: reportValue, label: reportValue, emoji: '🌤️' };
};
