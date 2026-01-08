# CrossFit Tracker Development Tasks

- [x] プロジェクトの計画とセットアップ
    - [x] 実装計画の作成と承認
    - [x] 開発環境の構築 (Vite + React)
- [/] 基本UIとデザインシステムの実装
    - [x] GitHub 導入と移行 (Data Loss Prevention)
        - [x] Gitリポジトリ作成 (init)
        - [x] .gitignore 設定
        - [x] 初回コミット
        - [x] GitHubリモートリポジトリ接続 & Push
    - [x] グローバルスタイルとCSS変数の定義 (ダークモード、アクセントカラー)
    - [x] レイアウトコンポーネント (ヘッダー、ナビゲーション)
    - [ ] 共通コンポーネント (ボタン、カード、入力フォーム)

- [/] コア機能の実装
    - [/] Firebaseプロジェクトの作成と接続設定
    - [/] ユーザー認証 (Firebase Auth - Google Login)
        - [x] PCでの基本的なログイン実装
        - [x] モバイル向けレイテンシ対策 (AuthProvider改修)
        - [x] Redirect URI Mismatch エラー (Error 400) の修正
            - [x] 不足ファイルの復元 (AuthContext, Login, ProtectedRoute, Data, Services)
            - [x] Redirect URI 設定のデバッグと修正 (AuthContextにログ追加)

    - [ ] データベース設計と接続 (Firestore)
    - [ ] ダッシュボード (ステータス・アバター・Lv表示)


- [/] 身体管理 & ステータス機能
    - [x] BIG3・WL重量記録フォーム
    - [x] アバター進化ロジックの実装
    - [x] 月間レベルアップ機能 (出席日数カウント)
    - [x] ピクセルアートアバター画像の生成 (簡易実装完了)
    - [x] 体重・体脂肪入力フォーム



    - [ ] グラフ表示機能
- [x] ワークアウト記録機能 (Smart Logger)
    - [x] Cloudinary設定 (Unsigned Preset作成)
    - [x] 画像アップロードコンポーネント実装
    - [x] ホワイトボード画像表示UI (Smart Logger内に実装済)
    - [x] フリーテキスト入力 (メモ帳)
    - [x] 負荷(RPE)・体調入力スライダー/セレクター
    - [x] ワークアウト履歴リスト
    - [x] WOD保存エラー修正 (analysisLogs権限追加)
    - [x] WOD編集UI改善（削除、移動ドロップダウン、レイアウト修正）

- [ ] ユーティリティ機能
    - [ ] 重量変換機能 (lbs <-> kg)
    - [x] 1RM計算機
    - [x] ランダムWOD生成 (EMOM, AMRAP)
- [x] ワークアウトログ機能拡張
    - [x] 振り返り入力欄追加 (課題・改善点)
    - [x] 前回課題のリマインド表示
- [x] デザイン刷新: Clean Light Dashboard (Visual Reference)
    - [x] テーマ変更 (Off-White/Charcoal/Blue)
    - [x] ライブラリ導入 (Recharts)
    - [x] 新コンポーネント実装 (Tabs, StatusCard, TrendChart)
    - [x] 日本語化対応 (Contents in JP, Menus in EN)
- [x] デザイン刷新: Minimal Luxury Theme
    - [x] フォント変更 (Merriweather, Inter, Noto Sans JP)
    - [x] カラーパレット変更 (Off-Black/Charcoal, Silver/Gold)
    - [x] 共通スタイル適用 (Glassmorphism, Thin Borders)
    - [x] コンポーネントスタイル修正
    - [x] PRカード モバイル表示改善 (2列グリッド化)



- [x] 週間サマリー機能の実装
    - [x] Overview（SCAN WOD直下）に「週間サマリー（簡易版）」
    - [x] Overview（PR直上）に「週間サマリー（小カード）」
    - [x] Calendarタブ上部に「週間サマリー（詳細版）」
    - [x] データ集計ロジックとAI分析コメントの実装
- [ ] 各タブのレイアウトと余白の調整
    - [ ] Stats, Log, Tools, Calendarタブへの共通コンテナスタイルの適用
    - [ ] モバイル表示での水平パディングの最適化
    - [ ] レイアウト変更によるUI崩れのチェックと修正
- [ ] ヘッダーのモバイル向け再設計
    - [ ] デザイン案の作成と提案
    - [ ] 選択された案の実装（Layout.tsx, Layout.cssの修正）
    - [ ] モバイル実機想定での表示確認
