/**
 * このファイルは、ストリーミング処理の実装の責務を持ちます。
 */

import type { Result } from "../result/types.ts";
import { success, failure, isSuccess } from "../result/utils.ts";
import type { Logger } from "../logger/types.ts";
import { createLogger } from "../logger/index.ts";
import type { StreamingOptions, FetchErrorInfo } from "./types.ts";
import { _fetchCreateNetworkError, _fetchCreateErrorFromResponse } from "./error.ts";
import { FetchClient } from "./client.ts";

/**
 * ストリーミングリクエストを送信する
 * @param url リクエストURL
 * @param options ストリーミングオプション
 * @returns 成功時はvoid、失敗時はFetchErrorInfo
 */
export async function _fetchStreamRequest(
  url: string,
  options: StreamingOptions & { baseUrl?: string }
): Promise<Result<void, FetchErrorInfo>> {
  const {
    baseUrl,
    method = "GET",
    headers = {},
    params,
    body,
    onChunk,
    onComplete,
    onError,
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
  const fetchOptions: RequestInit = {
    method,
    headers: {
      // SSEの場合、text/event-streamを受け入れる
      Accept: "text/event-stream",
      ...headers,
    },
  };
  
  // ボディの設定
  if (body !== undefined) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  
  try {
    logger.debug(`Stream request: ${method} ${fullUrl}`);
    const response = await fetch(fullUrl, fetchOptions);
    
    if (!response.ok) {
      const error = await _fetchCreateErrorFromResponse(response, fullUrl, method);
      logger.debug(`Stream error: ${error.code} - ${error.message}`);
      if (onError) onError(error);
      return failure(error);
    }
    
    if (!response.body) {
      const error = _fetchCreateNetworkError(
        new Error("Response body is null"),
        fullUrl,
        method
      );
      logger.debug(`Stream error: ${error.code} - ${error.message}`);
      if (onError) onError(error);
      return failure(error);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = "";
    let done = false;
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (done) {
        // バッファに残っているデータを処理
        if (buffer.trim() && onChunk) {
          onChunk(buffer);
        }
        
        if (onComplete) {
          onComplete();
        }
        break;
      }
      
      // 新しいチャンクをデコード
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // SSE形式の場合は、イベントの区切り文字で分割して処理
      if (buffer.includes("\n\n")) {
        const events = buffer.split("\n\n");
        // 最後の不完全なイベントを除いて処理
        for (let i = 0; i < events.length - 1; i++) {
          const event = events[i];
          if (event?.trim() && onChunk) {
            onChunk(event);
          }
        }
        // 最後の部分を次の処理のためにバッファに残す
        const lastEvent = events[events.length - 1];
        buffer = lastEvent || "";
      }
    }
    
    logger.debug("Stream completed successfully");
    return success(undefined);
  } catch (error) {
    const errorInfo = _fetchCreateNetworkError(error, fullUrl, method);
    logger.debug(`Stream network error: ${errorInfo.message}`);
    if (onError) onError(errorInfo);
    return failure(errorInfo);
  }
}

/**
 * ストリーミングクライアントクラス
 * SSEなどのストリーミングデータの処理機能を提供
 */
export class StreamingClient {
  private fetchClient: FetchClient;
  private logger: Logger;
  
  /**
   * ストリーミングクライアントを初期化
   * @param options クライアントオプション
   */
  constructor(options: {
    baseUrl?: string;
    headers?: Record<string, string>;
    logger?: Logger;
  } = {}) {
    const { baseUrl, headers, logger = createLogger() } = options;
    
    this.fetchClient = new FetchClient({
      baseUrl,
      headers,
      logger,
    });
    
    this.logger = logger;
  }
  
  /**
   * ストリーミングリクエストを送信する
   * @param url リクエストURL
   * @param options ストリーミングオプション
   * @returns 成功時はvoid、失敗時はFetchErrorInfo
   */
  async stream(
    url: string,
    options: StreamingOptions = {}
  ): Promise<Result<void, FetchErrorInfo>> {
    const client = this.fetchClient;
    // FetchClientのprivateプロパティにアクセスするが、設計上は合理的
    // FetchClientのprivateプロパティにアクセス
    // 設計上は問題ないが、TypeScriptの型安全性のためにunknownを経由してキャスト
    const baseUrl = ((client as unknown) as { baseUrl?: string }).baseUrl;
    
    return _fetchStreamRequest(url, {
      ...options,
      baseUrl,
      logger: this.logger,
    });
  }
  
  /**
   * SSE形式のデータをパースする
   * @param eventData SSEイベントデータ
   * @returns パースされたイベントデータ
   */
  static parseSSE(eventData: string): {
    event?: string;
    data?: string;
    id?: string;
    retry?: number;
  } {
    const result: {
      event?: string;
      data?: string;
      id?: string;
      retry?: number;
    } = {};
    
    // イベントを行ごとに分割して処理
    const lines = eventData.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // フィールド名とその値を取得
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      
      const field = line.substring(0, colonIndex);
      // 先頭のスペースをスキップ
      const value = line.substring(colonIndex + 1).trim();
      
      switch (field) {
        case "event":
          result.event = value;
          break;
        case "data":
          result.data = result.data ? `${result.data}\n${value}` : value;
          break;
        case "id":
          result.id = value;
          break;
        case "retry":
          result.retry = Number.parseInt(value, 10);
          break;
      }
    }
    
    return result;
  }
}

/**
 * ストリーミングクライアントを作成する
 * @param options クライアントオプション
 * @returns ストリーミングクライアントインスタンス
 */
export function createStreamingClient(options: {
  baseUrl?: string;
  headers?: Record<string, string>;
  logger?: Logger;
} = {}): StreamingClient {
  return new StreamingClient(options);
}