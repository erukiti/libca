/**
 * このファイルは、Result型とエラー情報の型定義の責務を持ちます。
 */

/**
 * 成功または失敗を表すResult型
 * @template T 成功時の値の型
 * @template E 失敗時のエラーの型
 */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * 成功を表すSuccess型
 * @template T 成功時の値の型
 */
export interface Success<T> {
  /** 成功したことを表すフラグ */
  success: true;
  /** 成功時の値 */
  value: T;
}

/**
 * 失敗を表すFailure型
 * @template E 失敗時のエラーの型
 */
export interface Failure<E> {
  /** 成功しなかったことを表すフラグ */
  success: false;
  /** 失敗時のエラー情報 */
  error: E;
}

/**
 * エラー情報の基本インターフェース
 */
export interface ErrorInfoBase {
  /** エラーメッセージ */
  message: string;
  /** エラーが回復可能かどうか */
  recoverable: boolean;
  /** エラーの原因となったオリジナルのErrorオブジェクト（オプション） */
  cause?: Error | undefined;
  /** エラーのスタックトレース（オプション） */
  stack?: string | undefined;
}

/**
 * 拡張可能なエラー情報型
 * @template TType エラーの大分類
 * @template TCode エラーの小分類
 * @template TExtra 追加情報の型
 */
export type ErrorInfo<
  TType extends string,
  TCode extends string,
  TExtra = Record<string, unknown>
> = ErrorInfoBase & {
  type: TType;
  code: TCode;
} & TExtra;

/**
 * 一般的なエラー情報型
 */
export type GeneralErrorInfo = ErrorInfo<string, string>;