/**
 * このファイルは、Fetchクライアント特有のエラー型と、エラー生成関数の責務を持ちます。
 */

import type { FetchErrorInfo, FetchErrorCode, HttpMethod } from "./types.ts";
import { createErrorInfo } from "../result/error.ts";

/**
 * Fetchエラー情報を作成する
 * @param code エラーコード
 * @param message エラーメッセージ
 * @param details エラーの詳細情報
 * @returns Fetchエラー情報
 */
export function _fetchCreateErrorInfo(
  code: FetchErrorCode,
  message: string,
  details: {
    url: string;
    method: HttpMethod;
    statusCode?: number;
    response?: unknown;
    recoverable?: boolean;
    cause?: Error;
  }
): FetchErrorInfo {
  const { url, method, statusCode, response, recoverable = false, cause } = details;
  
  return createErrorInfo({
    type: "fetch",
    code,
    message,
    recoverable,
    url,
    method,
    statusCode,
    response,
    cause,
  }) as FetchErrorInfo;
}

/**
 * タイムアウトエラーを作成する
 * @param timeout タイムアウト時間（ミリ秒）
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @returns Fetchエラー情報
 */
export function _fetchCreateTimeoutError(
  timeout: number,
  url: string,
  method: HttpMethod
): FetchErrorInfo {
  return _fetchCreateErrorInfo(
    "timeout",
    `Request timed out after ${timeout}ms`,
    {
      url,
      method,
      recoverable: true,  // タイムアウトは再試行可能
    }
  );
}

/**
 * ネットワークエラーを作成する
 * @param error 原因となったエラー
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @returns Fetchエラー情報
 */
export function _fetchCreateNetworkError(
  error: unknown,
  url: string,
  method: HttpMethod
): FetchErrorInfo {
  const message = error instanceof Error
    ? error.message
    : String(error);
  
  return _fetchCreateErrorInfo(
    "network_error",
    `Network error: ${message}`,
    {
      url,
      method,
      cause: error instanceof Error ? error : undefined,
      recoverable: true,  // ネットワークエラーは再試行可能
    }
  );
}

/**
 * HTTPエラーを作成する
 * @param response レスポンスオブジェクト
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @returns Fetchエラー情報
 */
export function _fetchCreateHttpError(
  response: Response,
  url: string,
  method: HttpMethod
): FetchErrorInfo {
  return _fetchCreateErrorInfo(
    "http_error",
    `HTTP error: ${response.status} ${response.statusText}`,
    {
      url,
      method,
      statusCode: response.status,
      response: response,
      // 5xxエラーは一時的な問題である可能性があるため再試行可能
      recoverable: response.status >= 500 && response.status < 600,
    }
  );
}

/**
 * レスポンスのパースエラーを作成する
 * @param error パースエラー
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @returns Fetchエラー情報
 */
export function _fetchCreateParseError(
  error: unknown,
  url: string,
  method: HttpMethod
): FetchErrorInfo {
  const message = error instanceof Error
    ? error.message
    : String(error);
  
  return _fetchCreateErrorInfo(
    "parse_error",
    `Failed to parse response: ${message}`,
    {
      url,
      method,
      cause: error instanceof Error ? error : undefined,
      recoverable: false,  // パースエラーは通常再試行しても解決しない
    }
  );
}

/**
 * バリデーションエラーを作成する
 * @param message エラーメッセージ
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @param response レスポンスデータ
 * @returns Fetchエラー情報
 */
export function _fetchCreateValidationError(
  message: string,
  url: string,
  method: HttpMethod,
  response: unknown
): FetchErrorInfo {
  return _fetchCreateErrorInfo(
    "validation_error",
    `Validation error: ${message}`,
    {
      url,
      method,
      response,
      recoverable: false,  // バリデーションエラーは通常再試行しても解決しない
    }
  );
}

/**
 * レスポンスからエラー情報を作成する
 * @param response レスポンスオブジェクト
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @returns Fetchエラー情報
 */
export async function _fetchCreateErrorFromResponse(
  response: Response,
  url: string,
  method: HttpMethod
): Promise<FetchErrorInfo> {
  const error = _fetchCreateHttpError(response, url, method);
  
  try {
    // レスポンスボディがJSONの場合は詳細情報を追加
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const errorData = await response.json();
      error.response = errorData;
    }
  } catch (e) {
    // JSONパースに失敗しても元のエラー情報を返す
  }
  
  return error;
}