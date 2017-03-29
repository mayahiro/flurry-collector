# flurry-collector

## 使い方

0. FlurryからAnalytics Reporting APIのトークンを取得します。
1. データベースを用意します。
2. schema.sqlを流し込みます。
3. appsテーブルに `https://api-metrics.flurry.com/public/v1/dimensions/app/values` で取得したアプリケーションのデータをInsertします。
4. `settings.json.sample` を `settings.json` とリネームして、取得したFlurry Analytics Reporting APIのトークン、用意したデータベースの情報を記述します。
5. `npm install` しましょう。
6. `node index.js` でデータ収集開始です。
