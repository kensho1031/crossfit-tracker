# Implementation Plan: BOX System & User Management

## Goal
Implement a multi-tenant style architecture where users belong to a "BOX" (gym) via invitation. Support distinct roles (admin, coach, member, visitor) and a "Personal Mode" for unattached users.

## Data Structure Changes

### [MODIFY] `src/types/user.ts`
- Add `boxId: string | null`
- Update `role` to include `'visitor'`
- Add `visitorExpiresAt?: string | null`
- Add `invitationStatus?: 'pending' | 'accepted'`

### [NEW] `src/types/box.ts`
```typescript
interface Box {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: string;
}
```

### [NEW] `src/types/invitation.ts`
```typescript
interface Invitation {
  id: string;
  email: string; // The key for matching Google Login
  boxId: string;
  role: 'admin' | 'coach' | 'member' | 'visitor';
  visitorExpiresInDays?: number;
  token: string; // Random string for URL or internal verify
  status: 'pending' | 'used' | 'expired';
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
}
```

## Component & Logic Updates

### 1. Invitation System (`src/services/invitationService.ts`)
- **Create**: Admin enters email/role. Sys generates doc in `invitations`.
- **Email**: (Simulation) Display invite link/code in Admin UI for now. SendGrid/Email integration later if needed.
- **Accept**: When user logs in with matching email:
  1. Search `invitations` where `email == user.email` AND `status == 'pending'`.
  2. If found -> Update User doc with `boxId`, `role`. Mark invite `used`.
  3. If not found -> Create User doc with `boxId: null` (Personal Mode).

### 2. Authorization Rules (`src/hooks/useRole.ts`)
- Add `boxId` check.
- Add `isVisitor` check.
- `useRole` should return permissions based on new matrix.

### 3. Data Isolation (Services)
- Update `getDailyClass`, `getScores`, etc. to accept `boxId`.
- **Crucial**: Most queries effectively become "Get all from collection where boxId == user.boxId".
- *Migration Note*: Existing data has no `boxId`. We might need a migration script or default `boxId` ('default_box') for existing dev data.

### 4. Firestore Rules
- Strict checks: `resource.data.boxId == request.invoking_user.boxId`.
- Admin creation restriction: Only specific UIDs (Super Admins) can set `role: 'admin'`.

## Super Admin Strategy
- Hardcode "Super Admin" email/UID in `firestore.rules` or a simplified helper.
- Only Super Admin can creating a *new* BOX or assigning the first Admin of a BOX.
- *For this task*: I will assume the current specific developer user is the Super Admin.

## Step-by-Step Implementation

1.  **Types**: logical foundation.
2.  **Invitation Service**: Backend logic.
3.  **Auth Context Upgrade**: Handling the invite-on-login flow.
4.  **UI Updates**: Admin Panel to Invite.
5.  **Service Isolation**: Updating all data fetchers.
6.  **Rules**: Locking it down.
