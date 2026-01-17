import { useAuth } from '../context/AuthContext';

/**
 * Role-based permissions hook
 * 
 * Roles:
 * - Admin: Full access to everything
 * - Manager: Can view all, can edit decisions/notes, cannot manage users
 * - Viewer: Read-only access, cannot create/edit/delete anything
 */

const PERMISSIONS = {
    // User Management
    'users.view': ['Admin'],
    'users.create': ['Admin'],
    'users.edit': ['Admin'],
    'users.delete': ['Admin'],

    // Decisions
    'decisions.view': ['Admin', 'Manager', 'Viewer'],
    'decisions.create': ['Admin', 'Manager'],
    'decisions.edit': ['Admin', 'Manager'],
    'decisions.delete': ['Admin'],
    'decisions.vote': ['Admin', 'Manager'],
    'decisions.comment': ['Admin', 'Manager'],

    // Reports
    'reports.view': ['Admin', 'Manager', 'Viewer'],
    'reports.export': ['Admin', 'Manager'],

    // Scenarios
    'scenarios.view': ['Admin', 'Manager', 'Viewer'],
    'scenarios.simulate': ['Admin', 'Manager'],

    // Analytics (all can view)
    'analytics.view': ['Admin', 'Manager', 'Viewer'],

    // Map
    'map.view': ['Admin', 'Manager', 'Viewer'],

    // Forecast
    'forecast.view': ['Admin', 'Manager', 'Viewer'],
};

export function usePermissions() {
    const { user } = useAuth();
    const role = user?.role || 'Viewer';

    /**
     * Check if user has permission for an action
     */
    const can = (permission) => {
        const allowedRoles = PERMISSIONS[permission];
        if (!allowedRoles) return false;
        return allowedRoles.includes(role);
    };

    /**
     * Check if user has any of the given permissions
     */
    const canAny = (permissions) => {
        return permissions.some(p => can(p));
    };

    /**
     * Check if user has all of the given permissions
     */
    const canAll = (permissions) => {
        return permissions.every(p => can(p));
    };

    /**
     * Check if user is admin
     */
    const isAdmin = () => role === 'Admin';

    /**
     * Check if user is manager or higher
     */
    const isManagerOrAbove = () => ['Admin', 'Manager'].includes(role);

    /**
     * Check if user is viewer (read-only)
     */
    const isViewer = () => role === 'Viewer';

    /**
     * Get role display label
     */
    const getRoleLabel = () => {
        switch (role) {
            case 'Admin': return 'Yönetici';
            case 'Manager': return 'Müdür';
            case 'Viewer': return 'İzleyici';
            default: return role;
        }
    };

    /**
     * Get role badge color
     */
    const getRoleColor = () => {
        switch (role) {
            case 'Admin': return { bg: '#fee2e2', color: '#dc2626' };
            case 'Manager': return { bg: '#dbeafe', color: '#2563eb' };
            case 'Viewer': return { bg: '#f3f4f6', color: '#6b7280' };
            default: return { bg: '#f3f4f6', color: '#6b7280' };
        }
    };

    return {
        role,
        can,
        canAny,
        canAll,
        isAdmin,
        isManagerOrAbove,
        isViewer,
        getRoleLabel,
        getRoleColor
    };
}

export default usePermissions;
