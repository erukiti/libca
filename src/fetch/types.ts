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
 * Fetch設定オブジェクト
 */
export interface FetchConfig {
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
 * JSON設定オブジェクト
 */
export interface JsonConfig extends FetchConfig {
  /** JSON特有の設定オプションがあれば追加 */
}

/**
 * ストリーミング設定オブジェクト
 */
export interface StreamConfig extends FetchConfig {
  /** ストリーミング特有の設定オプションがあれば追加 */
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

// 他のモジュールからインポートするが、循環参照を避けるために再エクスポートはしない
import type { Result } from "../result/types.ts";
import type { Logger } from "../logger/types.ts";