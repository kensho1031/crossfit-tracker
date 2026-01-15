import type { UserRole } from './user';

export type InvitationStatus = 'pending' | 'used' | 'expired';

export interface Invitation {
    id: string;
    email: string;
    boxId: string;
    role: UserRole | 'visitor'; // 'visitor' is added to roles in logic, or we update UserRole
    visitorExpiresInDays?: number; // Only for visitor
    token: string;
    status: InvitationStatus;
    invitedBy: string; // UID of the admin who invited
    createdAt: string;
    expiresAt: string; // Logic expiration (e.g. 7 days for invite validity)
    email_log?: { sentAt: string; success: boolean }[];
}
