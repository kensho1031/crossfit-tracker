# BOX User Management & Data Isolation

BOX（ジム）所属ベースのユーザー管理・認証システムを実装しました。

## 実装内容

### 1. BOX所属とデータ分離
- 全てのデータ（クラス、スコア、出席）は所属する `boxId` に基づいて分離されました。
- `boxes/{boxId}/...` というサブコレクション構造を導入し、厳格なデータアクセス制御を実現しました。

### 2. 招待システム
- 管理者が `UserManagement` 画面からメールアドレスを指定してユーザーを招待できるようになりました。
- 招待時に役割（admin, coach, member, visitor）と、ビジターの場合は有効期限を設定可能です。
- 新規ユーザーがログインした際、招待があれば自動的にBOXに紐付けられ、権限が付与されます。

### 3. 権限システムとビジター対応
- `visitor` ロールを導入しました。
- `useRole` フックでビジターの有効期限チェックを行い、期限切れの場合はBOXデータへのアクセスを制限するメッセージを表示します。
- `canManageClasses`, `canManageUsers` などの権限フラグを整理しました。

### 4. Firestore セキュリティルール
- `boxId` に基づく厳格なアクセス制御ルールを定義しました。
- ユーザーは自分のBOX以外のデータには一切アクセスできません。
- **Super Admin** 権限を導入し、システムの初期セットアップや全データへのアクセスを可能にしました。

## 修正・更新されたファイル

### サービス (`src/services/`)
- `classService.ts`: クラスデータのBOX分離対応
- `scoreService.ts`: スコアデータのBOX分離対応
- `attendanceService.ts`: 出席データのBOX分離対応
- `invitationService.ts`: 招待機能の実装
- `userService.ts`: ユーザー同期ロジックの整理

### コンポーネント & ページ
- `src/pages/Admin/UserManagement.tsx`: 招待UIの追加、ユーザーリストのBOXフィルタリング
- `src/pages/Admin/AdminTodayManager.tsx`: クラス管理のBOX対応
- `src/pages/ClassDetail.tsx`: クラス詳細のBOX対応、ビジター期限切れ表示
- `src/pages/CheckInHandler.tsx`: チェックインのBOX対応
- `src/pages/ScoreInputPage.tsx` / `src/components/class/ScoreInputModal.tsx`: スコア登録のBOX対応
- `src/contexts/AuthContext.tsx`: 招待承諾ロジックの統合

### プラットフォーム
- `firestore.rules`: boxIdベースのセキュリティルール実装

## 検証結果
- [x] 招待作成および一覧表示の動作確認
- [x] `boxId` を使用したデータ取得・保存のパス確認
- [x] 権限（admin/coach）によるアクセス制限の確認
- [x] セキュリティルールによる不正アクセス防止の定義
