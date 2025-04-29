/**
 * このファイルは、Result型を返す関数をリトライするための機能を提供します。
 */

import { isFailure, type Result, type ErrorInfo } from "../result/index.ts";
import type { RetryOptions, BackoffFunction } from "./types.ts";
import { exponentialBackoffWithJitter } from "./backoff.ts";

// 内部で使用する型定義
type AnyErrorInfo = ErrorInfo<string, string>;

/**
 * Result型を返す非同期関数をリトライする
 *
 * 失敗（isFailure）かつエラーが回復可能（error.recoverable === true）な場合のみリトライします。
 * リトライ回数が上限に達した場合や、回復不可能なエラーの場合は、最後の結果をそのまま返します。
 *
 * @param fn リトライする非同期関数
 * @param options リトライオプション
 * @returns 最終的なResult
 */
export async function retryResult<T, E extends AnyErrorInfo>(
  fn: () => Promise<Result<T, E>>,
  options: RetryOptions<E>
): Promise<Result<T, E>> {
  const { 
    maxRetries, 
    backoff = exponentialBackoffWithJitter(),
    // デフォルトのリトライ条件：失敗かつ回復可能なエラーの場合
    retryCondition = (error) => error.recoverable === true,
    onRetry
  } = options;

  // 初回実行
  let result = await fn();
  let attempts = 1;

  // 失敗かつリトライ条件を満たす場合、最大リトライ回数まで再試行
  while (
    isFailure(result) &&
    attempts <= maxRetries &&
    retryCondition(result.error, attempts)
  ) {
    // リトライコールバック（設定されている場合）
    if (onRetry) {
      onRetry(attempts, result.error);
    }

    // バックオフ処理（待機）
    await backoff(attempts);

    // 再試行
    result = await fn();
    attempts++;
  }

  // 最終結果を返す（成功または失敗）
  return result;
}