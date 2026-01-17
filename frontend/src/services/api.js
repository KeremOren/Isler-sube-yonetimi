import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API Functions
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getMe: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
        api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const branchesAPI = {
    getAll: (params) => api.get('/branches', { params }),
    getById: (id) => api.get(`/branches/${id}`),
    getSales: (id, params) => api.get(`/branches/${id}/sales`, { params }),
    getExpenses: (id, params) => api.get(`/branches/${id}/expenses`, { params }),
    getDistricts: () => api.get('/branches/meta/districts'),
};

export const analyticsAPI = {
    getKPIs: (params) => api.get('/analytics/kpis', { params }),
    getMonthlyTrend: (params) => api.get('/analytics/monthly-trend', { params }),
    getRevenueExpense: (params) => api.get('/analytics/revenue-expense', { params }),
    getMarginByBranch: (params) => api.get('/analytics/margin-by-branch', { params }),
    getBranchComparison: (branchIds, year) =>
        api.get('/analytics/branch-comparison', { params: { branch_ids: branchIds.join(','), year } }),
    getRisk: () => api.get('/analytics/risk'),
    getOpportunity: () => api.get('/analytics/opportunity'),
    getCategories: (params) => api.get('/analytics/categories', { params }),
    getAlerts: () => api.get('/analytics/alerts'),
};

export const mapAPI = {
    getBranches: (params) => api.get('/map/branches', { params }),
    getDistricts: () => api.get('/map/districts'),
    getHeatmapData: () => api.get('/map/heatmap-data'),
    getOpportunityOverlay: () => api.get('/map/opportunity-overlay'),
};

export const exportAPI = {
    getPDF: (params) => api.get('/export/pdf', { params, responseType: 'blob' }),
    getCSV: (type, params) => api.get('/export/csv', { params: { type, ...params }, responseType: 'blob' }),
};
