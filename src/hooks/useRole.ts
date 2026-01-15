import { useAuth } from '../contexts/AuthContext';

export function useRole() {
    const { user, userStats, currentBox, memberships, loading: authLoading } = useAuth();

    // Developer Check (Global System Owner)
    const developerUid = 'sljuwV64DYb9AnZJ8WxBmKRblYz1';
    const isDeveloper = user?.uid === developerUid;
    const isSuperAdmin = isDeveloper; // Legacy alias for compatibility

    // Determine Role in Current Box
    let roleInCurrentBox: string = 'member';

    if (currentBox) {
        const membership = memberships.find((m) => m.boxId === currentBox.id);
        if (membership) {
            roleInCurrentBox = membership.role;
        } else if (userStats?.role && userStats.boxId === currentBox.id) {
            // Legacy Fallback
            roleInCurrentBox = userStats.role;
        }
    } else {
        roleInCurrentBox = 'member';
    }

    const isExpired = false;

    return {
        role: roleInCurrentBox, // Role in the CURRENT active box
        currentBox, // The full box object
        boxId: currentBox?.id || (memberships.length > 0 ? memberships[0].boxId : null),
        loading: authLoading,
        isDeveloper,
        isSuperAdmin, // Legacy support

        isAdmin: roleInCurrentBox === 'admin' || isDeveloper,
        isCoach: roleInCurrentBox === 'coach' || roleInCurrentBox === 'admin' || isDeveloper,
        isMember: roleInCurrentBox === 'member',
        isVisitor: roleInCurrentBox === 'visitor',
        isVisitorExpired: isExpired,
        visitorExpiresAt: null,

        canManageBoxes: isDeveloper,
        canManageClasses: (roleInCurrentBox === 'admin' || roleInCurrentBox === 'coach' || isDeveloper) && (!!currentBox || isDeveloper) && !isExpired,
        canManageUsers: (roleInCurrentBox === 'admin' || isDeveloper) && (!!currentBox || isDeveloper) && !isExpired,
        canAccessBoxData: (!!currentBox || isDeveloper) && !isExpired,
    };
}
