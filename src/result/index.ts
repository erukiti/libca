/**
 * result - リザルト型モジュール
 * 
 * このモジュールは、例外を使わずに成功・失敗を表現するResult型とその操作関数を提供します。
 * Result型を使うことで、関数が失敗する可能性を型情報として表現し、
 * コンパイル時に適切なエラーハンドリングを強制することができます。
 *
 * private prefix: `_result`
 */

// types.ts からのエクスポート
export type {
  Result,
  Success,
  Failure,
  ErrorInfoBase,
  ErrorInfo,
  GeneralErrorInfo,
} from "./types.ts";

// utils.ts からのエクスポート
export {
  isSuccess,
  isFailure,
  success,
  failure,
  unwrap,
  unwrapOrThrow,
  map,
  flatMap,
  mapError,
  mapAsync,
  flatMapAsync,
  tryAsync,
  all,
} from "./utils.ts";

// error.ts からのエクスポート
export type {
  ValidationErrorInfo,
  SystemErrorInfo,
  NetworkErrorInfo,
  HttpErrorInfo,
  DatabaseErrorInfo,
  IOErrorInfo,
} from "./error.ts";

export {
  createErrorInfo,
  createValidationError,
  createSystemError,
  createNetworkError,
  createHttpError,
  createDatabaseError,
  createIOError,
} from "./error.ts";