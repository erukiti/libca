/**
 * このファイルは、Result型に関連するユーティリティ関数の責務を持ちます。
 */

import type { Result, Success, Failure } from "./types.ts";

/**
 * Resultが成功かどうかをチェックする型ガード
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result チェックするResult
 * @returns 成功の場合はtrue
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Resultが失敗かどうかをチェックする型ガード
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result チェックするResult
 * @returns 失敗の場合はtrue
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * 成功のResultを作成する
 * @template T 成功時の値の型
 * @param value 成功時の値
 * @returns 成功のResult
 */
export function success<T>(value: T): Success<T> {
  return { success: true, value };
}

/**
 * 失敗のResultを作成する
 * @template E 失敗時のエラーの型
 * @param error 失敗時のエラー
 * @returns 失敗のResult
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Resultから値を取り出す。失敗の場合はフォールバック値を返す
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result Result
 * @param fallback 失敗時に返すデフォルト値
 * @returns 成功時は結果の値、失敗時はフォールバック値
 */
export function unwrap<T, E>(result: Result<T, E>, fallback: T): T {
  return isSuccess(result) ? result.value : fallback;
}

/**
 * Resultから値を取り出す。失敗の場合は例外をスローする
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result Result
 * @param errorTransformer エラーをErrorオブジェクトに変換する関数（オプション）
 * @returns 成功時の値
 * @throws 失敗時にはエラーが例外としてスローされる
 */
export function unwrapOrThrow<T, E>(
  result: Result<T, E>,
  errorTransformer: (error: E) => Error = (e) => new Error(String(e))
): T {
  if (isSuccess(result)) {
    return result.value;
  }
  throw errorTransformer(result.error);
}

/**
 * Result内の値を変換する
 * @template T 元の成功時の値の型
 * @template U 変換後の成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result 元のResult
 * @param fn 値を変換する関数
 * @returns 変換された値を含むResult
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.value));
  }
  return failure(result.error);
}

/**
 * Result内の値を別のResultに変換する
 * @template T 元の成功時の値の型
 * @template U 変換後の成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result 元のResult
 * @param fn 値を別のResultに変換する関数
 * @returns 変換された新しいResult
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.value);
  }
  return failure(result.error);
}

/**
 * Result内のエラーを変換する
 * @template T 成功時の値の型
 * @template E 元の失敗時のエラーの型
 * @template F 変換後の失敗時のエラーの型
 * @param result 元のResult
 * @param fn エラーを変換する関数
 * @returns エラーが変換されたResult
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isSuccess(result)) {
    return success(result.value);
  }
  return failure(fn(result.error));
}

/**
 * Result内の値を非同期に変換する
 * @template T 元の成功時の値の型
 * @template U 変換後の成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result 元のResult
 * @param fn 値を非同期に変換する関数
 * @returns 非同期に変換された値を含むResultのPromise
 */
export async function mapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> {
  if (isSuccess(result)) {
    return success(await fn(result.value));
  }
  return failure(result.error);
}

/**
 * Result内の値を非同期に別のResultに変換する
 * @template T 元の成功時の値の型
 * @template U 変換後の成功時の値の型
 * @template E 失敗時のエラーの型
 * @param result 元のResult
 * @param fn 値を非同期に別のResultに変換する関数
 * @returns 非同期に変換された新しいResultのPromise
 */
export async function flatMapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (isSuccess(result)) {
    return await fn(result.value);
  }
  return failure(result.error);
}

/**
 * 非同期関数の実行結果をResultでラップする
 * @template T 関数の戻り値の型
 * @template Args 関数の引数の型
 * @param fn 実行する非同期関数
 * @param args 関数に渡す引数
 * @returns 関数の実行結果をResultでラップしたPromise
 */
export async function tryAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  ...args: Args
): Promise<Result<T, Error>> {
  try {
    return success(await fn(...args));
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 複数のResultを結合する。すべて成功した場合は値の配列、一つでも失敗した場合は最初の失敗を返す
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 * @param results Resultの配列
 * @returns すべて成功した場合は値の配列を含むSuccess、一つでも失敗した場合はその失敗
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!isSuccess(result)) {
      return result;
    }
    values.push(result.value);
  }
  return success(values);
}