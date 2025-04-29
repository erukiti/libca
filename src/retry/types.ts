/**
 * このファイルは、リトライ・バックオフモジュールの型定義の責務を持ちます。
 */

/**
 * バックオフ関連のオプション
 */
export type BackoffOptions = {
  /** ベース時間（ミリ秒） */
  readonly baseMs?: number;
  /** 最大待機時間（ミリ秒） */
  readonly maxMs?: number;
  /** ジッター係数（0～1） */
  readonly jitterFactor?: number;
};

/**
 * バックオフ関数の型
 * @param attempt 試行回数
 * @returns 待機を表すPromise
 */
export type BackoffFunction = (attempt: number) => Promise<void>;

/**
 * リトライ条件を判定する関数の型
 * @param error エラーオブジェクト
 * @param attempt 現在の試行回数
 * @returns リトライするかどうか
 */
export type RetryCondition<E = unknown> = (error: E, attempt: number) => boolean;

/**
 * 通常のリトライ用オプション
 */
export type RetryOptions<E = unknown> = {
  /** 最大リトライ回数 */
  readonly maxRetries: number;
  /** バックオフ関数 */
  readonly backoff?: BackoffFunction;
  /** リトライ条件（エラーとリトライ回数から判断） */
  readonly retryCondition?: RetryCondition<E>;
  /** 各リトライの前に呼ばれるコールバック */
  readonly onRetry?: (attempt: number, error: E) => void;
};

/**
 * Result型リトライ用のオプション
 */
export type RetryResultOptions<E> = RetryOptions<E>;