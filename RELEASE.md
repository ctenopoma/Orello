# GitHub Release 作成ガイド

## 概要
このドキュメントでは、Trello-like Desktop AppをGitHub Releasesで配布する方法を説明します。

## 前提条件
- GitHubリポジトリが作成されていること
- ローカルリポジトリがGitHubリポジトリと紐付けられていること

## リリース手順

### 1. EXEファイルをビルド

```bash
cd frontend
npm run build:electron
```

### 2. ビルド成果物の確認

以下のファイルが生成されていることを確認：
- `frontend/dist-electron/win-unpacked/TaskManager.exe`
- `frontend/dist-electron/TaskManager Setup 1.0.0.exe` (インストーラー)

### 3. Gitコミットとタグ作成（完了）

```bash
# すべての変更をコミット
git add -A
git commit -m "Initial release v1.0.0"

# タグを作成
git tag v1.0.0

# リモートにプッシュ
git push origin main
git push origin v1.0.0
```

### 4. GitHub Releaseの作成

#### 方法A: GitHub Web UI を使用（推奨）

1. GitHubリポジトリページにアクセス
2. 右側の「Releases」セクションをクリック
3. 「Create a new release」または「Draft a new release」をクリック
4. 以下の情報を入力：
   - **Tag**: `v1.0.0` (既存のタグを選択)
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**:
     ```markdown
     ## Trello-like Desktop App v1.0.0
     
     ### 新機能
     - ボード、リスト、カードの作成・管理
     - ドラッグ&ドロップでカードを移動
     - SQLiteによるデータ永続化
     - Python (FastAPI) + Electron + React アーキテクチャ
     
     ### ダウンロード
     
     **Windows向け:**
     - `TaskManager-Setup-1.0.0.exe` - インストーラー（推奨）
     - `TaskManager-1.0.0-win-portable.zip` - ポータブル版
     
     ### システム要件
     - Windows 10以上
     - Python 3.8以上がインストールされていること
     
     ### インストール方法
     1. `TaskManager-Setup-1.0.0.exe` をダウンロード
     2. 実行してインストール
     3. デスクトップのショートカットから起動
     
     ### 初回起動時の注意
     - Pythonがインストールされていない場合、エラーが発生します
     - Windowsファイアウォールの許可が必要な場合があります
     ```

5. 以下のファイルをアップロード（Drag & Drop or "Attach binaries"）：
   - `frontend/dist-electron/TaskManager Setup 1.0.0.exe`
   - （オプション）`frontend/dist-electron/win-unpacked/` フォルダをZIP圧縮してアップロード

6. 「Publish release」をクリック

#### 方法B: GitHub CLI を使用

```bash
# GitHub CLIをインストール（未インストールの場合）
# https://cli.github.com/

# リリースを作成
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "初回リリース。詳細はREADME.mdを参照。" \
  "frontend/dist-electron/TaskManager Setup 1.0.0.exe#TaskManager-Setup-1.0.0.exe"
```

## リリース後の配布

### ユーザーがダウンロードする方法

1. GitHubリポジトリの「Releases」ページにアクセス
2. 最新バージョン（v1.0.0）を選択
3. 「Assets」セクションから `TaskManager-Setup-1.0.0.exe` をダウンロード
4. ダウンロードしたEXEを実行してインストール

### 直接リンク

リリースが公開されると、以下のような直接ダウンロードリンクが利用可能：
```
https://github.com/<username>/<repository>/releases/download/v1.0.0/TaskManager-Setup-1.0.0.exe
```

## 次回以降のリリース

### バージョン番号の更新

1. `frontend/package.json` の `version` を更新（例：1.1.0）
2. ビルド
3. コミット・タグ作成
4. GitHub Releaseを作成

```bash
# バージョン更新
# package.json の version を 1.1.0 に変更

# ビルド
cd frontend
npm run build:electron

# コミットとタグ
git add -A
git commit -m "Release v1.1.0"
git tag v1.0.0
git push origin main
git push origin v1.1.0

# GitHub Releaseを作成（Web UI または CLI）
```

## ベストプラクティス

1. **セマンティックバージョニング** を使用
   - MAJOR.MINOR.PATCH (例: 1.0.0)
   - 破壊的変更: MAJOR を上げる
   - 新機能追加: MINOR を上げる
   - バグフィックス: PATCH を上げる

2. **リリースノート** を充実させる
   - 新機能
   - バグ修正
   - 破壊的変更
   - 既知の問題

3. **チェックサム** を提供（セキュリティ向上）
   ```bash
   certutil -hashfile "TaskManager Setup 1.0.0.exe" SHA256
   ```

4. **Pre-release** を使用してベータテストを行う
   - GitHub Releaseの「This is a pre-release」チェックボックスを使用

## トラブルシューティング

### タグが既に存在する場合
```bash
# ローカルタグを削除
git tag -d v1.0.0

# リモートタグを削除
git push origin :refs/tags/v1.0.0

# 新しいタグを作成
git tag v1.0.0
git push origin v1.0.0
```

### EXEファイルのサイズが大きすぎる場合
- GitHubは1ファイルあたり2GBまで
- それ以上の場合は、ZIP圧縮または外部ストレージ（OneDrive、Google Drive等）を使用
