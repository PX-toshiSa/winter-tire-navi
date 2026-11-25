# 冬タイヤ交換ナビ PWA版（Windowsで公開準備できます）

このフォルダは、Windowsだけで公開準備できるWebアプリ（PWA）の試作版です。iPhoneではSafariから開き「ホーム画面に追加」すると、アプリアイコンから起動できます。

## できること
- 初期地域は富山市
- Open-Meteoの週間予報（7日間）を取得
- 最低気温・氷点下・降雪予報でCのバランス型判定
- 全国の市区町村を検索して複数地域を登録
- 地域別に独立した判定
- 交換済み状態を端末内に保存
- 基本画面ファイルをキャッシュ（予報API自体はオンライン接続が必要）

## Windowsだけで公開する手順（GitHub Pagesの例）
1. WindowsでZIPを展開します。
2. GitHubアカウントを作成／ログインします。
3. GitHubで新しいPublic repositoryを作成します。例：`winter-tire-navi`
4. このフォルダ内のファイル（index.html、app.js、style.css、manifest.webmanifest、service-worker.js、icon-192.png、icon-512.png）をリポジトリの直下にアップロードします。ZIPそのものではなく、中身をアップロードしてください。
5. リポジトリの Settings → Pages を開き、Build and deployment の Source を「Deploy from a branch」、Branchを「main」、Folderを「/(root)」にしてSaveします。
6. 数分後、表示された `https://ユーザー名.github.io/winter-tire-navi/` のURLをiPhoneへ送ります。
7. iPhoneのSafariでURLを開き、共有ボタン →「ホーム画面に追加」→「追加」を選びます。
8. ホーム画面の「冬タイヤナビ」をタップして起動します。

GitHub Pagesの画面や項目名は変更されることがあります。公開リポジトリに置いたファイルは誰でも閲覧できます。個人情報や秘密情報を含めないでください。

## iPhoneへの追加
必ずSafariでHTTPSの公開URLを開きます。アプリ内ブラウザではなくSafariを使ってください。
- 共有ボタンをタップ
- 「ホーム画面に追加」を選択（見当たらない場合は共有メニュー下部を編集）
- 名前を確認して「追加」

## 重要な制約
- これはPWA試作版で、App Storeアプリではありません。
- iOSのWeb Push通知はこの版には実装していません。毎朝の自動チェック／プッシュ通知を一般提供するには、通知許可だけでなく、Push API・Service Worker・サーバー・APNs連携などの追加開発が必要です。
- この版はアプリを開いたときに天気を取得します。iOSがアプリを閉じたまま毎朝確実に予報を取得するものではありません。
- 地域検索はOpen-Meteoのジオコーディング結果を使います。候補から正しい市区町村を選んでください。
- Weather API利用規約・帰属表示・利用制限を公開前に確認してください。Open-Meteoの無料APIは個人・非商用利用向け条件が適用される場合があります。一般公開・商用利用前にプランとライセンスを確認してください。
- 交換判定は参考目安です。路面凍結の直接予測ではありません。

## データ提供
予報：Open-Meteo（https://open-meteo.com/）
地名検索：Open-Meteo Geocoding API（https://open-meteo.com/en/docs/geocoding-api）
