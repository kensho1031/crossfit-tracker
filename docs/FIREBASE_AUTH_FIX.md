# Firebase Auth 「承認済みドメイン」エラーの解決方法

スマホ（`192.168.68.110` など）からアクセスした際にログインに失敗するのは、Firebaseのセキュリティ設定で、許可されたドメイン（localhost以外）からのログインが制限されているためです。

以下の手順で、スマホからのログインを許可できます。

## 解決手順 A: ローカルIPを許可する（最も早い方法）

1. **[Firebase Console](https://console.firebase.google.com/)** にアクセスします。
2. プロジェクト **`crossfit-tracker-48563`** を選択します。
3. 左メニューの **「Authentication」** をクリックします。
4. 上部タブの **「Settings」** (設定) をクリックします。
5. 左側のリストから **「Authorized domains」** (承認済みドメイン) を選択します。
6. **「Add domain」** (ドメインの追加) をクリックします。
7. 入力欄に現在のPCのIPアドレス **`192.168.68.110`** を入力し、「Add」をクリックします。

これで、スマホからそのIPアドレスでログインできるようになります。

---

## 解決手順 B: Firebase Hosting に公開する（推奨）

IPアドレスが変わるたびに設定するのは大変なため、Firebase Hosting に無料で公開することをお勧めします。公開された専用のURL（`xxxx.web.app`）は自動的に許可されます。

### 公開の手順（PCのターミナルで実行）

1. **Firebase CLI のインストール (未実施の場合のみ)**
   ```bash
   npm install -g firebase-tools
   ```

2. **ログイン**
   ```bash
   firebase login
   ```

3. **初期設定**
   ```bash
   firebase init hosting
   ```
   - `Use an existing project` を選択
   - `crossfit-tracker-48563` を選択
   - `What do you want to use as your public directory?` に **`dist`** と入力
   - `Configure as a single-page app` に **`Yes`** と入力
   - `Set up automatic builds and deploys with GitHub?` に **`No`** と入力

4. **ビルドとデプロイ**
   ```bash
   npm run build
   firebase deploy
   ```

完了すると `https://crossfit-tracker-48563.web.app` のようなURLが表示されます。スマホからこのURLにアクセスすれば、設定不要でログインしてアプリとして利用（ホーム画面に追加）できます。
