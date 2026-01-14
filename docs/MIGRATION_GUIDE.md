# 開発環境移行ガイド

このプロジェクト（CrossFit Tracker）を別のPCに移行し、引き続き Antigravity や Node.js で開発を続けるための手順です。

## 1. 事前準備（移行先PC）
以下のツールがインストールされていることを確認してください。
- **Node.js**: (LTS版推奨)
- **Git**: (Git Bashなど)
- **エディタ**: Cursor / VS Code + Antigravity (インストール済みとのことですのでOKです)

## 2. プロジェクトの移動

### 方法A: GitHub 経由 (推奨)
1. **移行元PC**で、GitHubに新しいリポジトリを作成し、コードをプッシュします。
   ```bash
   git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
   git branch -M main
   git push -u origin main
   ```
2. **移行先PC**で、リポジトリをクローンします。
   ```bash
   git clone https://github.com/あなたのユーザー名/リポジトリ名.git
   ```

### 方法B: 直接コピー (フォルダごと移動)
1. `tensor-triangulum` フォルダを丸ごと（`.git` や `node_modules` も含めて）USBメモリ等でコピーします。
   - ※ `node_modules` は容量が大きいため、除外してコピーし、移行先で再インストールするのが一般的です。

## 3. 環境設定 (移行先PC)

### 3.1 依存関係のインストール
プロジェクトフォルダ内で以下のコマンドを実行します。
```bash
npm install
```

### 3.2 環境変数 (.env) の作成 ※重要
`.env` ファイルはセキュリティのため Git の管理から除外されています。**手動でコピーするか再作成**する必要があります。

1. プロジェクト直下に `.env` ファイルを作成します。
2. 以下の内容を入力します（以前のPCから値をコピーしてください）。
   ```
   VITE_GEMINI_API_KEY=あなたのGemini_APIキー
   ```

### 3.3 Firebase の連携
Firebase へのデプロイ等を行う場合、再ログインが必要です。
```bash
npx firebase login
```

## 4. Antigravity の利用
移行先PCでも Antigravity は非常に簡単に使い始められます。

1. フォルダをエディタで開きます。
2. Antigravity を立ち上げます。
3. すでに `docs/` フォルダ内に実装記録 (`walkthrough.md`, `task.md`) があるため、Antigravity は「これまで何をどのような方針で進めてきたか」をすぐに理解し、引き続き文脈を保ったままアシスト可能です。

## まとめ
最も重要なのは **`.env` ファイルの復元** です。これがないと Gemini API が動かないため注意してください。
コード自体は Git で管理しているため、移行先でも `git pull` やクローンですぐに最新の状態を再現できます。
