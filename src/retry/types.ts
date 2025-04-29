/**
 * このファイルは、リトライ・バックオフモジュールの型定義の責務を持ちます。
 */

// バックオフ関連の型
export interface BackoffOptions {
  /** ベース時間（ミリ秒） */
  baseMs?: number;
  /** 最大待機時間（ミリ秒） */
  maxMs?: number;
  /** ジッター係数（0～1） */ 
  jitterFactor?: number;
}

// バックオフ関数の型
export type BackoffFunction = (attempt: number) => Promise<void>;

// リトライ条件の型
export type RetryCondition<E = unknown> = (error: E, attempt: number) => boolean;

// 通常のリトライ用オプション
export interface RetryOptions<E = unknown> {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** バックオフ関数 */
  backoff?: BackoffFunction;
  /** リトライ条件（エラーとリトライ回数から判断） */
  retryCondition?: RetryCondition<E>;
  /** 各リトライの前に呼ばれるコールバック */
  onRetry?: (attempt: number, error: E) => void;
}

// Result型リトライ用の関数型
export interface RetryResultOptions<E> extends RetryOptions<E> {
  // Result型特有のオプションがあれば追加
}