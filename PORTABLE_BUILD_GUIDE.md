# Orello ポータブル版ビルドガイド

Orelloデスクトップアプリケーションのポータブル版（インストール不要）を作成する手順です。

## 前提条件

- Node.js 18以上
- pnpm がインストールされている
- Windows 7以上
- 約3-5GB のディスク空き容量（ビルド中）

## ステップ1: 依存関係のインストール

```bash
cd d:\work_space\07_orello
pnpm install
```

## ステップ2: ビルド実行

```bash
cd d:\work_space\07_orello\apps\desktop
node scripts\build.js
```

**実行内容:**
1. Next.js ウェブアプリケーションをコンパイル（~2-3秒）
2. アプリケーションリソースをコピー（~1-2分）
   - Next.js standalone build
   - node_modules 依存関係（.pnpmから展開）
   - マイグレーションファイル（22個）
   - アイコンとその他リソース
3. TypeScript メインプロセスをコンパイル
4. Electron Builder でパッケージング（~2-3分）

**合計時間:** 約5-8分

## ステップ3: ビルド成果物の確認

ビルド完了後、以下のファイルが生成されます：

```
d:\work_space\07_orello\apps\desktop\dist_electron\
├── win-unpacked/              ← ポータブル版（このフォルダ全体を配布）
│   ├── Orello.exe             （メイン実行ファイル）
│   ├── resources/
│   │   ├── app/               （Next.js アプリケーション）
│   │   ├── migrations/        （22個のDBマイグレーション）
│   │   └── elevate.exe
│   ├── locales/               （多言語サポート）
│   ├── [その他のElectronランタイムファイル]
│   └── ...
└── builder-*.yml              （ビルド設定ファイル）
```

## ステップ4: ポータブル版のコピー

ビルドが完了したら、`win-unpacked` フォルダ全体を配布用の場所にコピーします。

### PowerShell での方法：

```powershell
# コピー先を設定
$source = "d:\work_space\07_orello\apps\desktop\dist_electron\win-unpacked"
$destination = "D:\Orello-v2.0.0-Portable"

# 既存の場合は削除
if (Test-Path $destination) {
    Remove-Item $destination -Recurse -Force
}

# コピー実行
Copy-Item -Path $source -Destination $destination -Recurse -Force

# 確認
Get-ChildItem "$destination\Orello.exe"
```

### CMD での方法：

```batch
robocopy "d:\work_space\07_orello\apps\desktop\dist_electron\win-unpacked" "D:\Orello-v2.0.0-Portable" /MIR
```

## ステップ5: ZIP ファイル化（配布用）

ポータブル版をZIPファイルに圧縮して配布します。

### PowerShell での方法：

```powershell
# ZIP化
Compress-Archive -Path "D:\Orello-v2.0.0-Portable" `
  -DestinationPath "D:\Orello-v2.0.0-Portable.zip" `
  -Force

# ファイルサイズ確認
Get-Item "D:\Orello-v2.0.0-Portable.zip" | Select-Object Name, Length
```

### ファイルサイズ目安：
- 展開前（ZIP）: 約600-800MB
- 展開後（フォルダ）: 約1.5-1.8GB

## ステップ6: 動作確認テスト

### 別の場所から実行してテストする：

```powershell
cd "D:\Orello-v2.0.0-Portable"
.\Orello.exe
```

**確認項目:**
- [ ] アプリケーションウィンドウが開く
- [ ] DevTools ウィンドウが自動開きされない（修正済み）
- [ ] Next.js サーバーがポート 55796+ で起動
- [ ] PGlite データベースが初期化される（22個のマイグレーション）
- [ ] ブラウザに UI が表示される

### ログでの確認：

実行時のログに以下が表示されれば正常です：

```
Found app resources at: D:\Orello-v2.0.0-Portable\resources\app
Found migrations at: D:\Orello-v2.0.0-Portable\resources\migrations
========== SERVER STARTUP ==========
Starting server on port XXXXX
...
✓ PGlite migrations completed successfully
✓ Database initialized successfully
✓ Auth initialized successfully
✓ Session retrieved: local@orello.app
```

## ファイル構造の詳細

### `resources\app\` フォルダ

Next.js スタンドアロンビルドが含まれています：

```
resources\app\
├── .next/              （Next.js コンパイル済みファイル）
├── apps\web\           （ウェブアプリケーション）
│   ├── node_modules/   （展開済み依存関係 1321個パッケージ）
│   ├── pages/
│   ├── components/
│   └── public/
├── packages\           （共通パッケージ）
├── package.json
└── node_modules/       （ルートレベルの依存関係）
```

### `resources\migrations\` フォルダ

データベース初期化用のマイグレーションスクリプト（SQL）：

```
resources\migrations\
├── 20250508083758_SetupTables.sql
├── 20250522083748_AddEmailToWorkspaceMembers.sql
├── 20250527203813_AddDeletedAtToLabel.sql
├── ... （22個のマイグレーション）
└── 20251201204335_AddCardDueDates.sql
```

## トラブルシューティング

### Q: アプリケーションが起動しない

**A:** 以下を確認してください：

1. `Orello.exe` が実行可能であるか確認
2. `resources\migrations` フォルダが存在するか確認
3. ローカルのPGliteデータベースをリセット：
   ```powershell
   Remove-Item "$env:APPDATA\Orello\pgdata" -Recurse -Force -ErrorAction SilentlyContinue
   ```
4. 管理者権限で実行してみる

### Q: 「a.getSQL is not a function」エラーが表示される

**A:** これはアプリケーション初期化時のエラーで、ビルド問題ではありません。通常は自動的に処理されます。

### Q: ファイルサイズが大きすぎる

**A:** 以下で削減可能：

- `resources\app\node_modules` から不要なファイルを削除：
  - TypeScript ソースファイル（`.ts`）
  - テストファイル
  - ドキュメント
  - ビルドメタファイル（`.map`）

ただし、`electron-builder.yml` に既に最適化フィルターが設定されているため、通常は不要です。

## DevTools について

**DevTools は自動で開かなくなっています。**

- `apps\desktop\src\main.ts` で `mainWindow.webContents.openDevTools()` をコメントアウト済み
- デバッグが必要な場合は、アプリケーション実行後、F12キーで手動で開いてください

## 更新の配布

新しいバージョンを配布する場合：

1. ソースコードを更新
2. このガイドのステップ1-5を実行
3. 新しいZIPファイルをユーザーに提供
4. ユーザーは既存フォルダを削除して新しいZIPを解凍

**注意:** `%APPDATA%\Orello\pgdata` に保存されたユーザーデータは維持されます。

## ユーザー配布ガイド

ポータブル版をユーザーに配布する際は、以下の手順を伝えてください：

### インストール（解凍）

1. `Orello-v2.0.0-Portable.zip` をダウンロード
2. 任意のフォルダに解凍
3. `Orello.exe` をダブルクリック
4. 完了！

### データの保存位置

- ユーザーのワークスペースとカード情報：`%APPDATA%\Orello\pgdata`
  - Windows キー + R で `%APPDATA%` を開いて確認可能
  - 削除すると、次起動時に新しいデータベースが初期化される

### システム要件

- Windows 7 以上
- 約2GB のディスク空き容量
- インターネット接続不要（ローカル動作）

## 配布チェックリスト

- [ ] ビルドが `npm run build` で成功した
- [ ] `dist_electron\win-unpacked\Orello.exe` が存在する
- [ ] 別の場所でテスト実行して動作確認した
- [ ] DevTools が自動で開かれないことを確認した
- [ ] ZIP ファイルが作成できた
- [ ] ZIP ファイルを解凍して再度テストした

---

**最終更新:** 2025年12月7日
**Orello バージョン:** v2.0.0
**対応OS:** Windows 7以上
