/**
 * このファイルは、エラー関連の型と関数の責務を持ちます。
 */

import type { ErrorInfo } from "./types.ts";

/**
 * バリデーションエラー情報
 */
export type ValidationErrorInfo = ErrorInfo<
  "validation",
  string,
  { field?: string }
>;

/**
 * システムエラー情報
 */
export type SystemErrorInfo = ErrorInfo<"system", string>;

/**
 * ネットワークエラー情報
 */
export type NetworkErrorInfo = ErrorInfo<
  "network",
  string,
  { url?: string }
>;

/**
 * HTTPエラー情報
 */
export type HttpErrorInfo = ErrorInfo<
  "http",
  string,
  { statusCode: number; url?: string }
>;

/**
 * データベースエラー情報
 */
export type DatabaseErrorInfo = ErrorInfo<
  "database",
  string,
  { operation?: string; table?: string }
>;

/**
 * I/Oエラー情報
 */
export type IOErrorInfo = ErrorInfo<
  "io",
  string,
  { path?: string; operation?: string }
>;

/**
 * エラー情報を作成する
 * @template TType エラーの大分類
 * @template TCode エラーの小分類
 * @template TExtra 追加情報の型
 * @param params エラー情報のパラメータ
 * @returns 作成されたエラー情報
 */
export function createErrorInfo<
  TType extends string,
  TCode extends string,
  TExtra = Record<string, unknown>
>(
  params: { type: TType; code: TCode; message: string; recoverable?: boolean } & TExtra
): ErrorInfo<TType, TCode, TExtra> {
  const { type, code, message, recoverable = false, ...extra } = params;
  
  return {
    type,
    code,
    message,
    recoverable,
    ...extra as TExtra,
  } as ErrorInfo<TType, TCode, TExtra>;
}

/**
 * バリデーションエラーを作成する
 * @param message エラーメッセージ
 * @param field エラーが発生したフィールド名（オプション）
 * @returns バリデーションエラー情報
 */
export function createValidationError(
  message: string,
  field?: string
): ValidationErrorInfo {
  return {
    type: "validation",
    code: "validation_error",
    message,
    recoverable: true,
    field,
  };
}

/**
 * システムエラーを作成する
 * @param message エラーメッセージ
 * @param code エラーコード（オプション）
 * @returns システムエラー情報
 */
export function createSystemError(
  message: string,
  code = "system_error"
): SystemErrorInfo {
  return {
    type: "system",
    code,
    message,
    recoverable: false,
  };
}

/**
 * ネットワークエラーを作成する
 * @param message エラーメッセージ
 * @param url エラーが発生したURL（オプション）
 * @returns ネットワークエラー情報
 */
export function createNetworkError(
  message: string,
  url?: string
): NetworkErrorInfo {
  return {
    type: "network",
    code: "network_error",
    message,
    recoverable: true,
    url,
  };
}

/**
 * HTTPエラーを作成する
 * @param message エラーメッセージ
 * @param statusCode HTTPステータスコード
 * @param url エラーが発生したURL（オプション）
 * @returns HTTPエラー情報
 */
export function createHttpError(
  message: string,
  statusCode: number,
  url?: string
): HttpErrorInfo {
  return {
    type: "http",
    code: `http_${statusCode}`,
    message,
    recoverable: statusCode >= 500,
    statusCode,
    url,
  };
}

/**
 * データベースエラーを作成する
 * @param message エラーメッセージ
 * @param operation 実行していた操作（オプション）
 * @param table 対象テーブル名（オプション）
 * @returns データベースエラー情報
 */
export function createDatabaseError(
  message: string,
  operation?: string,
  table?: string
): DatabaseErrorInfo {
  return {
    type: "database",
    code: "database_error",
    message,
    recoverable: false,
    operation,
    table,
  };
}

/**
 * I/Oエラーを作成する
 * @param message エラーメッセージ
 * @param path 操作対象のパス（オプション）
 * @param operation 実行していた操作（オプション）
 * @returns I/Oエラー情報
 */
export function createIOError(
  message: string,
  path?: string,
  operation?: string
): IOErrorInfo {
  return {
    type: "io",
    code: "io_error",
    message,
    recoverable: false,
    path,
    operation,
  };
}