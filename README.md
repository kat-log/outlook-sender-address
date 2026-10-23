# Outlook 差出人アドレス表示

Outlook on the web（`outlook.office.com` / `outlook.live.com` ほか）で、差出人名の右にメールアドレスを常に表示する Chrome 拡張機能です。
Outlook Web は標準では差出人名しか出さず、アドレスはホバーしないと見えません（設定でも変更不可）。

## 機能

- **開いたメール**: 閲覧ウィンドウの差出人名の右にアドレスを表示（既定 ON）
- **メール一覧**: 受信トレイ各行の差出人名の右にアドレスを表示（既定 OFF、ポップアップで切替）
- アドレスのドメイン部分を太字表示（なりすまし確認用）
- バッジをクリックでアドレスをコピー

## インストール（開発版）

1. `chrome://extensions` を開き「デベロッパーモード」を ON
2. 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選択
3. Outlook Web をリロード

## 仕組み

| 場所 | アドレスの取得元 |
| --- | --- |
| メール一覧 | 差出人 `<span>` の `title` 属性 |
| 閲覧ウィンドウ | DOM に無いため、`[id$="_FROM"]` 要素の React fiber props（`sender.Mailbox.EmailAddress` 等） |

React の内部データを読むため、`content-main.js` は `world: "MAIN"` で動作します。設定は `content-bridge.js`（isolated world）が `chrome.storage.sync` から読み、`<html data-osa-*>` 属性経由で渡します。

Outlook 側の DOM 変更で動かなくなる可能性があります。その場合は上記セレクタを見直してください。
