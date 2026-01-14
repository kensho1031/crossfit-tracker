# Task: BOX・権限・招待システムの実装

## Concept
- **BOX所属**: 招待制。box_idで全データを分離。
- **Personal Mode**: BOX未所属でも利用可能。
- **Roles**: admin, coach, member, visitor(期限付き)。
- **Auth**: Googleログイン可（招待メールと一致が必要）。

## TODO List

### 1. Data Modeling & Types
- [x] Create `types/box.ts` (Box interface)
- [x] Update `types/user.ts` (Add boxId, visitor fields)
- [x] Create `types/invitation.ts`

### 2. Invitation System
- [x] Create `invitationService.ts`
- [x] Update `UserManagement` UI (招待機能追加)

### 3. Authentication & Onboarding
- [x] Update `AuthContext.tsx` (招待チェック、Personal Mode対応)
- [x] Update `useRole` hook (boxId追加)

### 4. Data Isolation
- [x] Update `classService.ts` (boxId対応)
- [x] Update `AdminTodayManager.tsx`
- [x] Update `ClassDetail.tsx`
- [x] Update `TodayClassCard.tsx`
- [x] Update remaining services (scoreService, attendanceService, userService)
- [x] Update Firestore Security Rules (BOX分離ルール)

### 5. Testing & Verification
- [x] Test invitation flow
- [x] Test data isolation
- [x] Test visitor expiration
