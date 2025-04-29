/**
 * このファイルは、基本的なFetchクライアント実装の責務を持ちます。
 */

import type { Result, ErrorInfo } from "../result/types.ts";
import { isSuccess, success, failure, mapError } from "../result/utils.ts";
import type { Logger } from "../logger/types.ts";
import { createLogger } from "../logger/index.ts";
import { retryResult } from "../retry/retry-result.ts";
import { exponentialBackoffWithJitter } from "../retry/backoff.ts";
import type {
  HttpMethod,
  FetchClientOptions,
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
 * FetchClientクラス
 * 基本的なHTTPリクエスト機能を提供
 */
export class FetchClient {
  private baseUrl?: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout?: number;
  private defaultRetry?: RetryOptions;
  private logger: Logger;
  
  /**
   * FetchClientを初期化
   * @param options クライアントオプション
   */
  constructor(options: FetchClientOptions = {}) {
    const {
      baseUrl,
      headers = {},
      timeout,
      retry,
      logger = createLogger(),
    } = options;
    
    this.baseUrl = baseUrl;
    this.defaultHeaders = headers;
    this.defaultTimeout = timeout;
    this.defaultRetry = retry;
    this.logger = logger;
  }
  
  /**
   * リクエストを送信する
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async request(
    url: string,
    options: RequestOptions = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    const mergedOptions = {
      ...options,
      baseUrl: this.baseUrl,
      headers: { ...this.defaultHeaders, ...options.headers },
      timeout: options.timeout ?? this.defaultTimeout,
      retry: options.retry ?? this.defaultRetry,
      logger: this.logger,
    };
    
    return _fetchProcessRequest(url, mergedOptions);
  }
  
  /**
   * GETリクエストを送信する
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async get(
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "GET" });
  }
  
  /**
   * POSTリクエストを送信する
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async post(
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "POST", body });
  }
  
  /**
   * PUTリクエストを送信する
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async put(
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "PUT", body });
  }
  
  /**
   * DELETEリクエストを送信する
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async delete(
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "DELETE" });
  }
  
  /**
   * PATCHリクエストを送信する
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async patch(
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "PATCH", body });
  }
  
  /**
   * HEADリクエストを送信する
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async head(
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "HEAD" });
  }
  
  /**
   * OPTIONSリクエストを送信する
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns レスポンスを含むResult
   */
  async options(
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<Response, FetchErrorInfo>> {
    return this.request(url, { ...options, method: "OPTIONS" });
  }
}

/**
 * デフォルトのFetchClientインスタンスを作成
 * @param options クライアントオプション
 * @returns FetchClientインスタンス
 */
export function createFetchClient(options: FetchClientOptions = {}): FetchClient {
  return new FetchClient(options);
}