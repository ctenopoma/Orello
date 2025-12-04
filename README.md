# Trello-like Desktop App(ver1.0.0)

Windows向けタスク管理デスクトップアプリケーション（Trelloライク）

## 📥 ダウンロード（エンドユーザー向け）

最新バージョンのインストーラーは [Releases](../../releases) ページからダウンロードできます。

**現在のバージョン: v1.0.0**

### インストール手順
1. [Releases](../../releases) ページから `Orello-Setup-1.0.0.exe` をダウンロード
2. ダウンロードしたEXEファイルを実行
3. インストールウィザードに従ってインストール
4. デスクトップのショートカットから起動

> [!IMPORTANT]
> **Python 3.8以上が必要です**
> 
> アプリケーション実行前に、[Python公式サイト](https://www.python.org/downloads/)からPythonをインストールしてください。

## 必要な環境

- **Node.js**: v18以上推奨（v16でも動作可能だが、いくつかの依存関係をダウングレード済み）
- **Python**: 3.8以上

## 📦 実行ファイル（EXE）の使い方

### 最も簡単な起動方法

1. `frontend/dist-electron/win-unpacked/` フォルダを開く
2. **Orello.exe** をダブルクリックして起動

これだけでアプリケーションが起動し、Pythonバックエンドも自動的に起動されます。

### 重要な注意点

> [!IMPORTANT]
> **Python環境が必要です**
> 
> このアプリケーションを実行するには、システムにPythonがインストールされている必要があります。
> - Python 3.8以上
> - `python` コマンドがPATHに含まれていること

### 初回起動時

- Windowsファイアウォールの警告が表示される場合があります。「アクセスを許可する」を選択してください。
- アプリケーションが起動するまで数秒かかる場合があります（Pythonバックエンドの起動を待っています）。

### トラブルシューティング

**アプリが起動しない場合:**

1. **Pythonがインストールされているか確認**
   ```bash
   python --version
   ```
   Python 3.8以上が表示されればOKです。

2. **コマンドプロンプトから手動で起動してエラーを確認**
   ```bash
   cd frontend/dist-electron/win-unpacked
   Orello.exe
   ```
   エラーメッセージが表示される場合は、そのメッセージを確認してください。

3. **依存関係が不足している場合**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## 🛠️ 開発環境でのセットアップと実行

### セットアップ

#### 1. Pythonバックエンドの依存関係をインストール

```bash
cd backend
pip install -r requirements.txt
```

#### 2. フロントエンドの依存関係をインストール

```bash
cd frontend
npm install
```

### 開発環境での実行

#### 方法1: 別々のターミナルで起動（推奨）

**ターミナル1 - Pythonバックエンド**
```bash
cd c:/Users/naoki/Documents/Work/desktop_app
python -m backend.main
```

**ターミナル2 - フロントエンド（Electron + React）**  
```bash
cd frontend
npm run dev
```

この方法では、`SKIP_PYTHON=true`環境変数によりElectronは既存のPythonプロセスを使用します。

#### 方法2: 統合起動

```bash
cd frontend
npm run dev
```

Electronが自動的にPythonバックエンドを起動します（開発中はポート競合を避けるため方法1を推奨）。

## 📦 実行ファイル（EXE）のビルド

```bash
cd frontend
npm run build:electron
```

ビルドが完了すると、以下の場所に実行ファイルが作成されます：
- `frontend/dist-electron/win-unpacked/Orello.exe` - 実行ファイル
- `frontend/dist-electron/Orello Setup 1.0.0.exe` - インストーラー（NSISフォーマット）

## 🚀 リリース方法（開発者向け）

詳細は [RELEASE.md](RELEASE.md) を参照してください。

### 簡単な手順

1. バージョン番号を更新（`frontend/package.json`）
2. ビルド: `npm run build:electron`
3. コミット・タグ作成: `git tag v1.x.x`
4. GitHub Releasesでインストーラーを公開
