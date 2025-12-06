---
description: Orelloデスクトップアプリのビルド手順
---

# Orello デスクトップアプリ ビルド手順

## 前提条件
- Node.js >= 20.18.1
- pnpm 9.14.2

## ビルドコマンド

### 1. 依存関係のインストール（初回のみ）
```bash
pnpm install
```

### 2. デスクトップアプリのビルド
```bash
# PowerShellで実行ポリシーの問題がある場合はcmd経由で実行
cmd /c "npx pnpm turbo run build --filter=@orello/desktop"
```

### 3. 出力ファイル
ビルド成功後、以下のファイルが生成されます：
- `apps/desktop/dist_electron/Orello Setup 2.0.0.exe` - Windowsインストーラー
- `apps/desktop/dist_electron/win-unpacked/Orello.exe` - インストーラーなしの実行ファイル

## 開発サーバー

### ローカル開発
```bash
cmd /c "npx pnpm dev:next"
```

## トラブルシューティング

### PGliteデータのリセット
データベースに問題がある場合：
```bash
rmdir /s /q apps\web\pgdata
```

### キャッシュのクリア
ビルドキャッシュをクリアする場合：
```bash
rmdir /s /q apps\web\.next
rmdir /s /q apps\desktop\build
```