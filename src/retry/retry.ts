/**
 * このファイルは、通常の関数（Promise関数を含む）をリトライするための機能を提供する責務を持ちます。
 * 宣言的で関数型プログラミングスタイルの実装を採用しています。
 */

import type { RetryOptions, BackoffFunction } from "./types.ts";
import { exponentialBackoffWithJitter } from "./backoff.ts";

/**
 * デフォルトリトライオプションを実行時オプションとマージする
 * @param options ユーザー指定オプション
 * @returns 完全なオプション
 */
const prepareOptions = <E>(options: RetryOptions<E>) => {
  return {
    maxRetries: options.maxRetries,
    backoff: options.backoff ?? exponentialBackoffWithJitter(),
    retryCondition: options.retryCondition ?? ((error: E) => !!error),
    onRetry: options.onRetry,
  };
};

/**
 * 単一の実行を試みる関数
 * @param fn 実行する関数
 * @param attempt 現在の試行回数
 * @returns 成功した場合は値、失敗した場合はエラーを含むオブジェクト
 */
const attemptExecution = async <T>(fn: () => Promise<T>, attempt: number): Promise<{ success: true; value: T } | { success: false; error: unknown }> => {
  try {
    const value = await fn();
    return { success: true, value };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 非同期関数をリトライする再帰関数
 * @param fn 実行する関数
 * @param preparedOptions 準備済みオプション
 * @param attempt 現在の試行回数
 * @returns 最終結果
 */
const retryRecursive = async <T, E = Error>(
  fn: () => Promise<T>,
  preparedOptions: ReturnType<typeof prepareOptions<E>>,
  attempt: number = 1
): Promise<T> => {
  const { maxRetries, backoff, retryCondition, onRetry } = preparedOptions;
  
  // 試行実行
  const result = await attemptExecution(fn, attempt);
  
  // 成功した場合は結果を返す
  if (result.success) {
    return result.value;
  }
  
  const error = result.error as E;
  
  // 最大リトライ回数を超えた、またはリトライ条件を満たさない場合は例外をスロー
  if (attempt > maxRetries || !retryCondition(error, attempt)) {
    throw error;
  }
  
  // リトライコールバックの実行
  if (onRetry) {
    onRetry(attempt, error);
  }
  
  // バックオフ待機
  await backoff(attempt);
  
  // 再帰的にリトライ
  return retryRecursive(fn, preparedOptions, attempt + 1);
};

/**
 * 非同期関数をリトライする
 *
 * @param fn リトライする非同期関数
 * @param options リトライオプション
 * @returns 最終結果のPromise
 */
export const retryAsync = async <T, E = Error>(
  fn: () => Promise<T>,
  options: RetryOptions<E>
): Promise<T> => {
  const preparedOptions = prepareOptions(options);
  return retryRecursive(fn, preparedOptions);
};

/**
 * 同期関数をリトライする
 *
 * @param fn リトライする同期関数
 * @param options リトライオプション
 * @returns 関数の結果
 */
export const retry = async <T, E = Error>(
  fn: () => T,
  options: RetryOptions<E>
): Promise<T> => {
  // 同期関数を非同期関数としてラップし、retryAsyncを利用
  return retryAsync(
    () => Promise.resolve().then(() => fn()),
    options
  );
};