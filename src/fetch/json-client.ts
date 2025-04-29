/**
 * このファイルは、JSONに特化したFetchクライアント実装の責務を持ちます。
 */

import { z } from "zod";
import type { Result } from "../result/types.ts";
import { success, failure, isSuccess } from "../result/utils.ts";
import type { Logger } from "../logger/types.ts";
import { createLogger } from "../logger/index.ts";
import type {
  FetchClientOptions,
  RequestOptions,
  FetchErrorInfo,
  JsonClient as JsonClientInterface,
  HttpMethod,
} from "./types.ts";
import { FetchClient } from "./client.ts";
import { _fetchCreateParseError, _fetchCreateValidationError } from "./error.ts";

/**
 * JSONデータを取得して、zodスキーマで検証する
 * @param response Responseオブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @param logger ロガー
 * @returns 検証済みデータを含むResult
 */
export async function _fetchValidateJson<T>(
  response: Response,
  schema: z.ZodSchema<T>,
  url: string,
  method: string,
  logger?: Logger
): Promise<Result<T, FetchErrorInfo>> {
  try {
    logger?.debug("Parsing JSON response");
    const data = await response.json();
    
    try {
      logger?.debug("Validating response with zod schema");
      const validatedData = schema.parse(data);
      return success(validatedData);
    } catch (validationError) {
      logger?.debug("Validation error:", validationError);
      let errorMessage = "Response validation failed";
      
      if (validationError instanceof z.ZodError) {
        errorMessage = `Invalid response format: ${JSON.stringify(validationError.format())}`;
      } else if (validationError instanceof Error) {
        errorMessage = validationError.message;
      }
      
      return failure(
        _fetchCreateValidationError(errorMessage, url, method as HttpMethod, data)
      );
    }
  } catch (error) {
    logger?.debug("JSON parse error:", error);
    return failure(
      _fetchCreateParseError(error, url, method as HttpMethod)
    );
  }
}

/**
 * JSONクライアントクラス
 * zodスキーマによるレスポンス検証機能を提供
 */
export class JsonClient implements JsonClientInterface {
  private fetchClient: FetchClient;
  private logger: Logger;
  
  /**
   * JSONクライアントを初期化
   * @param options クライアントオプション
   */
  constructor(options: FetchClientOptions = {}) {
    const { logger = createLogger(), ...fetchOptions } = options;
    
    this.fetchClient = new FetchClient({
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...fetchOptions.headers,
      },
      logger,
    });
    
    this.logger = logger;
  }
  
  /**
   * JSONリクエストを送信し、zodスキーマでレスポンスを検証する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async request<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options: RequestOptions = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    const method = options.method || "GET";
    this.logger.debug(`JSON request: ${method} ${url}`);
    
    // Content-Typeヘッダーの設定
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    };
    
    // ボディのJSONシリアライズ
    const body = options.body !== undefined
      ? typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body)
      : undefined;
    
    // 基本クライアントでリクエスト実行
    const result = await this.fetchClient.request(url, {
      ...options,
      headers,
      body,
    });
    
    if (!isSuccess(result)) {
      return result;
    }
    
    // JSONパースと検証
    return _fetchValidateJson(
      result.value,
      schema,
      url,
      method,
      this.logger
    );
  }
  
  /**
   * GETリクエストを送信する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async get<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    return this.request(schema, url, { ...options, method: "GET" });
  }
  
  /**
   * POSTリクエストを送信する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async post<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    return this.request(schema, url, { ...options, method: "POST", body });
  }
  
  /**
   * PUTリクエストを送信する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async put<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    return this.request(schema, url, { ...options, method: "PUT", body });
  }
  
  /**
   * DELETEリクエストを送信する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async delete<T>(
    schema: z.ZodSchema<T>,
    url: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    return this.request(schema, url, { ...options, method: "DELETE" });
  }
  
  /**
   * PATCHリクエストを送信する
   * @param schema 検証に使用するzodスキーマ
   * @param url リクエストURL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns 検証済みデータを含むResult
   */
  async patch<T>(
    schema: z.ZodSchema<T>,
    url: string,
    body: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<Result<T, FetchErrorInfo>> {
    return this.request(schema, url, { ...options, method: "PATCH", body });
  }
}

/**
 * JSONクライアントを作成する
 * @param options クライアントオプション
 * @returns JSONクライアントインスタンス
 */
export function createJsonClient(options: FetchClientOptions = {}): JsonClient {
  return new JsonClient(options);
}