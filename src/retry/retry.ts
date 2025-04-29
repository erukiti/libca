/**
 * このファイルは、通常の関数（Promise関数を含む）をリトライするための機能を提供します。
 */

import type { RetryOptions, BackoffFunction } from "./types.ts";
import { exponentialBackoffWithJitter } from "./backoff.ts";

/**
 * 非同期関数をリトライする
 *
 * @param fn リトライする非同期関数
 * @param options リトライオプション
 * @returns 最終結果のPromise
 */
export async function retryAsync<T, E = Error>(
  fn: () => Promise<T>,
  options: RetryOptions<E>
): Promise<T> {
  const { 
    maxRetries, 
    backoff = exponentialBackoffWithJitter(),
    retryCondition = (error) => !!error,
    onRetry
  } = options;

  let attempts = 0;
  let lastError: unknown;

  while (true) {
    try {
      attempts++;
      return await fn();
    } catch (error) {
      lastError = error;
      const typedError = error as E;

      // 最大リトライ回数を超えた、またはリトライ条件を満たさない場合は例外をスロー
      if (attempts > maxRetries || !retryCondition(typedError, attempts)) {
        throw error;
      }

      // リトライコールバック（設定されている場合）
      if (onRetry) {
        onRetry(attempts, typedError);
      }

      // バックオフ待機
      await backoff(attempts);
    }
  }
}

/**
 * 同期関数をリトライする
 *
 * @param fn リトライする同期関数
 * @param options リトライオプション
 * @returns 関数の結果
 */
export async function retry<T, E = Error>(
  fn: () => T,
  options: RetryOptions<E>
): Promise<T> {
  // 同期関数を非同期関数としてラップし、retryAsyncを利用
  return await retryAsync(
    () => Promise.resolve().then(() => fn()),
    options
  );
}