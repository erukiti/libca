/**
 * このファイルは、Result型を返す関数をリトライするための機能を提供する責務を持ちます。
 * Result型と関数型プログラミングアプローチを活用した宣言的な実装です。
 */

import { isSuccess, type Result, type ErrorInfo } from "../result/index.ts";
import type { RetryResultOptions } from "./types.ts";
import { exponentialBackoffWithJitter } from "./backoff.ts";

// 内部で使用する型定義
type AnyErrorInfo = ErrorInfo<string, string>;

/**
 * デフォルトリトライオプションを実行時オプションとマージする
 * @param options ユーザー指定オプション
 * @returns 完全なオプション
 */
const prepareResultOptions = <E extends AnyErrorInfo>(options: RetryResultOptions<E>) => {
  return {
    maxRetries: options.maxRetries,
    backoff: options.backoff ?? exponentialBackoffWithJitter(),
    // デフォルトのリトライ条件：失敗かつ回復可能なエラーの場合
    retryCondition: options.retryCondition ?? ((error: E) => error.recoverable === true),
    onRetry: options.onRetry,
  };
};

/**
 * Result型関数をリトライする再帰実装
 * @param fn 実行する関数
 * @param preparedOptions 準備済みオプション
 * @param attempt 現在の試行回数
 * @returns 最終Result
 */
const retryResultRecursive = async <T, E extends AnyErrorInfo>(
  fn: () => Promise<Result<T, E>>,
  preparedOptions: ReturnType<typeof prepareResultOptions<E>>,
  attempt: number = 1
): Promise<Result<T, E>> => {
  const { maxRetries, backoff, retryCondition, onRetry } = preparedOptions;
  
  // 関数実行
  const result = await fn();
  
  // 成功した場合はそのまま結果を返す
  if (isSuccess(result)) {
    return result;
  }
  
  // 最大リトライ回数を超えた、またはリトライ条件を満たさない場合は結果を返す
  if (attempt >= maxRetries || !retryCondition(result.error, attempt)) {
    return result;
  }
  
  // リトライコールバックの実行
  if (onRetry) {
    onRetry(attempt, result.error);
  }
  
  // バックオフ待機
  await backoff(attempt);
  
  // 再帰的にリトライ
  return retryResultRecursive(fn, preparedOptions, attempt + 1);
};

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
export const retryResult = async <T, E extends AnyErrorInfo>(
  fn: () => Promise<Result<T, E>>,
  options: RetryResultOptions<E>
): Promise<Result<T, E>> => {
  const preparedOptions = prepareResultOptions(options);
  return retryResultRecursive(fn, preparedOptions);
};