@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

_/ を参考にして、
汎用ライブラリを作成します。

まずは `result` モジュールを `src/result` 以下に作成してください。
必ずコーディングガイドラインを遵守してください。



----

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-result-module-1.md 
resultモジュールを作成して

----

@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

_/ を参考にして、
汎用ライブラリを作成します。

loggerモジュールを src/logger 以下に作成してください。
必ずコーディングガイドラインを遵守してください。

---

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-logger-module-1.md 
loggerモジュールを作成して

----

@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

_/ を参考にして、
汎用ライブラリを作成します。

リトライ・バックオフ関連のモジュールを src/retry につくりたいです

---

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-retry-module-1.md 
retryモジュールを実装して

---

@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

_/ を参考にして、
汎用ライブラリを作成します。

src/mcp に MCP 関連のコードを入れてほしい

---

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-mcp-implementation-1.md 

---

@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

_/ から、
汎化できそうなものをライブラリとして実装したいです。

HTTPクライアントがほしいです。
* JSON前提でzodスキーマバリデーションまでできるもの
* より汎用的なHTTPクライアント

---

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-http-client-module-1.md 

---

いまこのリポジトリの src/ に実装されているモジュールの、APIドキュメントを作成してほしい

APIドキュメントに必要なもの:
* モジュールごとの明瞭な説明文
* モジュール内の関数や型の説明
    * 概要
    * パラメータなどの説明
    * あるなら制約条件
    * 使い方のサンプル
    * 必要に応じてシーケンス図、フロー図

用途としては _/ 以下にある3つのプロジェクトへの組み込みを想定している。

**まず最初に上述の通りのものでドキュメントとして、過不足があれば指摘してほしい**

---

@/docs/design-rule.md
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、設計手順を実行せよ

src/fetchのコードを、classを使わないように書き直して
互換性維持は不要です。絶対に禁じる。
設計書にも必ず「後方互換性を用意することを絶対に禁じる」の文言を出力せよ

---

@/docs/coding-rule.md 
@/docs/coding-guideline.md
コーディングガイドラインを遵守し、コーディング手順に沿ってコーディングせよ

@/plans/20250429-fetch-refactor-2.md 