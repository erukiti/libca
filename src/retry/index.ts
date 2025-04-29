/**
 * retry - リトライ・バックオフモジュール
 *
 * このモジュールは、失敗した操作を設定可能なバックオフ戦略で再試行するための機能を提供します。
 * バックオフとは、リトライの間隔を徐々に広げていく戦略で、指数バックオフやジッター機能をサポートします。
 *
 * このモジュールは以下の特徴があります：
 * - 関数型プログラミングスタイルによる宣言的な実装
 * - 通常の関数とResult型を返す関数の両方のリトライをサポート
 * - カスタマイズ可能なバックオフ戦略
 * - リトライ条件やコールバックによる詳細な制御
 *
 * private prefix: `_retry`
 */

export type {
  RetryOptions,
  BackoffOptions,
  BackoffFunction,
  RetryCondition,
  RetryResultOptions,
} from "./types.ts";

export {
  createBackoff,
  exponentialBackoffWithJitter,
  exponentialBackoff,
} from "./backoff.ts";

export {
  retry,
  retryAsync,
} from "./retry.ts";

export {
  retryResult,
} from "./retry-result.ts";