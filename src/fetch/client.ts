/**
 * このファイルは、基本的なFetch機能実装の責務を持ちます。
 */

import type { Result, ErrorInfo } from "../result/types.ts";
import { isSuccess, success, failure, mapError } from "../result/utils.ts";
import type { Logger } from "../logger/types.ts";
import { createLogger } from "../logger/index.ts";
import { retryResult } from "../retry/retry-result.ts";
import { exponentialBackoffWithJitter } from "../retry/backoff.ts";
import type {
  HttpMethod,
  FetchConfig,
  RequestOptions,
  FetchErrorInfo,
  RetryOptions,
} from "./types.ts";
import {
  _fetchCreateTimeoutError,
  _fetchCreateNetworkError,
  _fetchCreateHttpError,
  _fetchCreateErrorFromResponse,
} from "./error.ts";

/**
 * タイムアウト付きのfetch関数
 * @param url リクエストURL
 * @param options fetchオプション（タイムアウト含む）
 * @returns レスポンスを含むResult
 */
export async function _fetchFetchWithTimeout(
  url: string,
  options: RequestInit & {
    timeout?: number;
    method?: string;
    logger?: Logger;
  }
): Promise<Result<Response, FetchErrorInfo>> {
  const { timeout, logger, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET") as HttpMethod;
  
  logger?.debug(`Fetch request: ${method} ${url}`);
  
  if (!timeout) {
    try {
      const response = await fetch(url, fetchOptions);
      logger?.debug(`Fetch response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const error = await _fetchCreateErrorFromResponse(response, url, method);
        logger?.debug(`Fetch error: ${error.code} - ${error.message}`);
        return failure(error);
      }
      
      return success(response);
    } catch (error) {
      const errorInfo = _fetchCreateNetworkError(error, url, method);
      logger?.debug(`Fetch network error: ${errorInfo.message}`);
      return failure(errorInfo);
    }
  }
  
  // AbortControllerを使用したタイムアウト処理
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    logger?.debug(`Fetch response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await _fetchCreateErrorFromResponse(response, url, method);
      logger?.debug(`Fetch error: ${error.code} - ${error.message}`);
      return failure(error);
    }
    
    return success(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = _fetchCreateTimeoutError(timeout, url, method);
      logger?.debug(`Fetch timeout: ${timeoutError.message}`);
      return failure(timeoutError);
    }
    
    const networkError = _fetchCreateNetworkError(error, url, method);
    logger?.debug(`Fetch network error: ${networkError.message}`);
    return failure(networkError);
  }
}

/**
 * リクエスト処理の共通ヘルパー関数
 * URLクエリパラメータの構築やリトライ機能を含む
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function _fetchProcessRequest(
  url: string,
  options: RequestOptions & { baseUrl?: string; logger?: Logger }
): Promise<Result<Response, FetchErrorInfo>> {
  const {
    baseUrl,
    params,
    method = "GET",
    headers = {},
    body,
    timeout,
    retry,
    logger = createLogger(),
  } = options;
  
  // URLの構築
  let fullUrl = url;
  if (baseUrl) {
    // 重複するスラッシュを避ける
    if (baseUrl.endsWith("/") && url.startsWith("/")) {
      fullUrl = `${baseUrl}${url.substring(1)}`;
    } else if (!baseUrl.endsWith("/") && !url.startsWith("/")) {
      fullUrl = `${baseUrl}/${url}`;
    } else {
      fullUrl = `${baseUrl}${url}`;
    }
  }
  
  // クエリパラメータの追加
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      fullUrl = `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}${queryString}`;
    }
  }
  
  // fetchオプションの構築
  const fetchOptions: RequestInit & {
    timeout?: number;
    method?: string;
    logger?: Logger;
  } = {
    method,
    headers,
    timeout,
    logger,
  };
  
  // ボディの設定
  if (body !== undefined) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  
  // リトライなしの場合は直接リクエスト
  if (!retry) {
    return _fetchFetchWithTimeout(fullUrl, fetchOptions);
  }
  
  // リトライ機能を使用したリクエスト
  const { maxRetries, baseMs = 100, maxMs = 10000, jitterFactor = 0.1, onRetry } = retry;
  
  logger.debug(`Fetch with retry: maxRetries=${maxRetries}, baseMs=${baseMs}, maxMs=${maxMs}`);
  
  // ここで型キャストを使って、型の互換性問題を解決
  type AnyErrorInfo = ErrorInfo<string, string>;
  
  const result = await retryResult<Response, AnyErrorInfo>(
    async () => {
      const res = await _fetchFetchWithTimeout(fullUrl, fetchOptions);
      if (isSuccess(res)) {
        return success(res.value);
      }
      // FetchErrorInfoをAnyErrorInfoとして扱う
      return failure(res.error as unknown as AnyErrorInfo);
    },
    {
      maxRetries,
      backoff: exponentialBackoffWithJitter({
        baseMs,
        maxMs,
        jitterFactor,
      }),
      retryCondition: (error) => error.recoverable,
      onRetry: onRetry
        ? (attempt, error) => onRetry(attempt, error as unknown as FetchErrorInfo)
        : (attempt, error) =>
            logger.debug(`Fetch retry ${attempt}/${maxRetries}: ${error.message}`),
    }
  );
  
  // 再び元の型に戻す
  if (isSuccess(result)) {
    return success(result.value);
  }
  return failure(result.error as unknown as FetchErrorInfo);
}

/**
 * Fetch設定オブジェクトを作成する
 * @param options 設定オプション
 * @returns Fetch設定オブジェクト
 */
export function createFetchConfig(options: Partial<FetchConfig> = {}): FetchConfig {
  const {
    baseUrl,
    headers = {},
    timeout,
    retry,
    logger = createLogger(),
  } = options;
  
  return {
    baseUrl,
    headers,
    timeout,
    retry,
    logger,
  };
}

/**
 * リクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchRequest(
  config: FetchConfig,
  url: string,
  options: RequestOptions = {}
): Promise<Result<Response, FetchErrorInfo>> {
  const mergedOptions = {
    ...options,
    baseUrl: config.baseUrl,
    headers: { ...config.headers, ...options.headers },
    timeout: options.timeout ?? config.timeout,
    retry: options.retry ?? config.retry,
    logger: config.logger,
  };
  
  return _fetchProcessRequest(url, mergedOptions);
}

/**
 * GETリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchGet(
  config: FetchConfig,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "GET" });
}

/**
 * POSTリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchPost(
  config: FetchConfig,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "POST", body });
}

/**
 * PUTリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchPut(
  config: FetchConfig,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "PUT", body });
}

/**
 * DELETEリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchDelete(
  config: FetchConfig,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "DELETE" });
}

/**
 * PATCHリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchPatch(
  config: FetchConfig,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "PATCH", body });
}

/**
 * HEADリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchHead(
  config: FetchConfig,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "HEAD" });
}

/**
 * OPTIONSリクエストを送信する関数
 * @param config Fetch設定オブジェクト
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns レスポンスを含むResult
 */
export async function fetchOptions(
  config: FetchConfig,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<Response, FetchErrorInfo>> {
  return fetchRequest(config, url, { ...options, method: "OPTIONS" });
}
