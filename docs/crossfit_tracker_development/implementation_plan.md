# WOD Edit UI Refinements

ユーザーフィードバックに基づき、WOD編集画面 (`SmartEditModal`) のレイアウトと視認性を改善します。

## Issues & Solutions

1.  **Issue**: プルダウン（カテゴリー選択）のせいで項目名（種目名）が見切れる。
    - **Solution**: レイアウトを1行から2行に変更します。
        - **Row 1**: 種目名 (幅100%)
        - **Row 2**: レップ数入力 | カテゴリー選択 | 削除ボタン
    - これにより、種目名が常にフル幅で表示され、見切れを防ぎます。

2.  **Issue**: セクションタイトル (WARMUP等) が見にくい。
    - **Solution**:
        - 中央揃え (`justify-content: center`)
        - フォントサイズ拡大
        - 背景色や下線を追加して区切りを明確化

3.  **Issue**: 文字が小さくて見づらい。
    - **Solution**:
        - 各入力欄（種目名、Reps、重量）のフォントサイズを `16px` (1rem) 以上に拡大。
        - コントラスト調整。

## Implementation Details (SmartEditModal.tsx)

### New Item Layout
```tsx
<div className="exercise-card">
  {/* Row 1: Name */}
  <div className="row-name" style={{ width: '100%', marginBottom: '8px' }}>
     <Input value={name} fontSize="1.1rem" ... />
  </div>

  {/* Row 2: Controls */}
  <div className="row-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
     <Input value={reps} style={{ flex: 1 }} ... />
     <Select value={category} ... />
     <Button onClick={delete} ... />
  </div>
</div>
```

## Verification Plan
- **Mobile View**: スマホ幅で種目名が折り返されずに（または十分な幅で）表示されるか。
- **Visibility**: 老眼等でも見やすい文字サイズになっているか。
