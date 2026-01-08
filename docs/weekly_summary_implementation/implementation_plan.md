# データ構造統合 & 週間サマリー実装計画

AIスキャン記録と手動ログの保存先を `calendar_entries` コレクションに統合し、週間サマリーで共通の集計ロジックを使用できるようにします。

## ユーザーレビューが必要な項目

> [!IMPORTANT]
> コレクション名の変更について
> `logs` から `calendar_entries` へ移行するため、既存のログデータは表示されなくなります。

## 変更内容

### 1. データ構造の統一
- `calendar_entries` コレクションへ統一。
- `source` ("scan" or "log"), `raw_text`, `exercises`, `categories` フィールドを追加。

### 2. 保存処理の更新
- `WorkoutLog.tsx` (手動ログ) と `SmartEditModal.tsx` (AIスキャン) の両方を新しい構造に更新。

### 3. 週間サマリーの実装
- 共通のカスタムフック `useWeeklySummary.ts` を作成。
- 3種類のサマリーカードコンポーネントを作成。

### 4. ページへの統合
- Dashboard (Overview) と Calendar ページにサマリーを表示。

## 検証計画
- 保存時のデータ構造が正しいか確認。
- 週間サマリーの集計ロジックが正しいか確認。
- 遷移が正常に動作するか確認。
