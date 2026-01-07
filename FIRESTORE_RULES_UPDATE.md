# Firestore セキュリティルールの更新手順

## 手順

1. **Firebase Consoleを開く**
   - https://console.firebase.google.com/
   - プロジェクト「crossfit tracker」を選択

2. **Firestoreに移動**
   - 左メニューから「Firestore Database」をクリック

3. **ルールタブを開く**
   - 上部の「ルール」タブをクリック

4. **以下のルールをコピペ**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ユーザードキュメント
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ワークアウトログ
    match /logs/{logId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    
    // 未完了ログ（Draft Logs）
    match /draftLogs/{draftId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

5. **「公開」ボタンをクリック**

6. **ブラウザをリロード**
   - `Ctrl + Shift + R`

7. **もう一度試す**
   - SCAN WODボタン → 画像アップロード → 「後で入力する」

---

## 変更内容

- `draftLogs` コレクションへの読み書き権限を追加
- 認証済みユーザーが自分のデータのみアクセス可能
- `users` コレクションの権限も追加（AuthProviderのエラー修正）

---

## トラブルシューティング

### それでもエラーが出る場合

ブラウザのコンソール（F12）で新しいエラーメッセージを確認してください。

### ルールの公開に失敗する場合

構文エラーがないか確認してください。上記のルールをそのままコピペすれば問題ありません。
