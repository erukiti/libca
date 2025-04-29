/**
 * このファイルは、Fetchクライアントに関する型定義の責務を持ちます。
 */

import type { z } from "zod";
import type { ErrorInfo } from "../result/types.ts";

/**
 * HTTPメソッド
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/**
 * Fetchクライアントのオプション
 */
export interface FetchClientOptions {
  /** ベースURL */
  baseUrl?: string;
  /** デフォルトのヘッダー */
  headers?: Record<string, string>;
  /** デフォルトのタイムアウト（ミリ秒） */
  timeout?: number;
  /** リトライオプション */
  retry?: RetryOptions;
  /** ロガー */
  logger?: Logger;
}

/**
 * リトライオプション
 * retryモジュールのRetryOptionsを拡張
 */
export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** ベース時間（ミリ秒） */
  baseMs?: number;
  /** 最大待機時間（ミリ秒） */
  maxMs?: number;
  /** ジッター係数（0～1） */
  jitterFactor?: number;
  /** 各リトライの前に呼ばれるコールバック */
  onRetry?: (attempt: number, error: FetchErrorInfo) => void;
}

/**
 * リクエストオプション
 */
export interface RequestOptions {
  /** リクエストメソッド */
  method?: HttpMethod;
  /** URLパラメータ */
  params?: Record<string, string | number | boolean | undefined>;
  /** リクエストヘッダー */
  headers?: Record<string, string>;
  /** リクエストボディ */
  body?: unknown;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** リトライオプション */
  retry?: RetryOptions;
}

/**
 * Fetchクライアントのエラーコード
 */
export type FetchErrorCode =
  | "timeout"          // タイムアウトエラー
  | "network_error"    // ネットワークエラー
  | "http_error"       // HTTPエラー
  | "parse_error"      // レスポンスのパースエラー
  | "validation_error" // バリデーションエラー
  | "fetch_error";     // その他のFetchエラー

/**
 * Fetchエラー情報型
 */
export type FetchErrorInfo = ErrorInfo<
  "fetch",
  FetchErrorCode,
  {
    statusCode?: number;
    url: string;
    method: HttpMethod;
    response?: unknown;
    recoverable: boolean;
    cause?: Error;
  }
>;

/**
 * ストリーミングオプション
 */
export interface StreamingOptions extends RequestOptions {
  /** チャンクデータを受け取るコールバック */
  onChunk?: (chunk: string) => void;
  /** ストリーム終了時のコールバック */
  onComplete?: () => void;
  /** エラー発生時のコールバック */
  onError?: (error: FetchErrorInfo) => void;
  /** ロガー */
  logger?: Logger;
}

/**
 * JSONクライアントのインターフェース
 */
export interface JsonClient {
  /**
   * リクエストを送信し、zodスキーマでレスポンスを検証する
   */
  request<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options?: RequestOptions
  ): Promise<Result<T, FetchErrorInfo>>;
  
  /**
   * GETリクエストを送信する
   */
  get<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<Result<T, FetchErrorInfo>>;
  
  /**
   * POSTリクエストを送信する
   */
  post<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<Result<T, FetchErrorInfo>>;
  
  /**
   * PUTリクエストを送信する
   */
  put<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<Result<T, FetchErrorInfo>>;
  
  /**
   * DELETEリクエストを送信する
   */
  delete<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<Result<T, FetchErrorInfo>>;
  
  /**
   * PATCHリクエストを送信する
   */
  patch<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<Result<T, FetchErrorInfo>>;
}

// 他のモジュールからインポートするが、循環参照を避けるために再エクスポートはしない
import type { Result } from "../result/types.ts";
import type { Logger } from "../logger/types.ts";