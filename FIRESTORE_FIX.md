# Firestore 修正手順

## 問題

1. **権限エラー**: `logs`コレクションへの書き込みが失敗
2. **インデックスエラー**: クエリに必要なインデックスが未作成

---

## 修正手順

### 1. Firestoreルールの確認と修正

Firebase Console → Firestore Database → ルール

**現在のルールを以下に置き換えてください：**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /logs/{logId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    match /draftLogs/{draftId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

**「公開」をクリック**

---

### 2. Firestoreインデックスの作成

以下のリンクをクリックして、自動的にインデックスを作成してください：

#### draftLogsインデックス
https://console.firebase.google.com/v1/r/project/crossfit-tracker-48563/firestore/indexes?create_composite=Clhwcm9qZWN0cy9jcm9zc2ZpdC10cmFja2VyLTQ4NTYzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9kcmFmdExvZ3MvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaBwoDdWlkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

#### logsインデックス
https://console.firebase.google.com/v1/r/project/crossfit-tracker-48563/firestore/indexes?create_composite=ClNwcm9qZWN0cy9jcm9zc2ZpdC10cmFja2VyLTQ4NTYzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9sb2dzL2luZGV4ZXMvXxABGgcKA3VpZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI

**各リンクをクリックして「作成」ボタンをクリックしてください。**

インデックスの作成には数分かかる場合があります。

---

### 3. 確認

1. インデックスが「有効」になるまで待つ（数分）
2. ブラウザをリロード（`Ctrl + Shift + R`）
3. もう一度「完了して保存」を試す

---

## トラブルシューティング

### インデックス作成が失敗する場合

Firebase Console → Firestore Database → インデックス タブ

手動で以下のインデックスを作成：

**draftLogsコレクション:**
- フィールド: `status` (昇順)
- フィールド: `uid` (昇順)
- フィールド: `createdAt` (降順)

**logsコレクション:**
- フィールド: `uid` (昇順)
- フィールド: `createdAt` (降順)
