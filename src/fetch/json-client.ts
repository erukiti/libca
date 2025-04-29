/**
 * このファイルは、JSONに特化したFetch機能実装の責務を持ちます。
 */

import { z } from "zod";
import type { Result } from "../result/types.ts";
import { success, failure, isSuccess } from "../result/utils.ts";
import type { Logger } from "../logger/types.ts";
import { createLogger } from "../logger/index.ts";
import type {
  JsonConfig,
  RequestOptions,
  FetchErrorInfo,
  HttpMethod,
} from "./types.ts";
import { createFetchConfig, fetchRequest } from "./client.ts";
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
 * JSON設定オブジェクトを作成する
 * @param options 設定オプション
 * @returns JSON設定オブジェクト
 */
export function createJsonConfig(options: Partial<JsonConfig> = {}): JsonConfig {
  const { logger = createLogger(), ...fetchOptions } = options;
  
  return {
    ...createFetchConfig({
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...fetchOptions.headers,
      },
      logger,
    }),
  };
}

/**
 * JSONリクエストを送信し、zodスキーマでレスポンスを検証する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonRequest<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  options: RequestOptions = {}
): Promise<Result<T, FetchErrorInfo>> {
  const method = options.method || "GET";
  config.logger?.debug(`JSON request: ${method} ${url}`);
  
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
  
  // 基本リクエスト実行
  const result = await fetchRequest(config, url, {
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
    config.logger
  );
}

/**
 * GET JSONリクエストを送信する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonGet<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<T, FetchErrorInfo>> {
  return jsonRequest(config, schema, url, { ...options, method: "GET" });
}

/**
 * POST JSONリクエストを送信する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonPost<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<T, FetchErrorInfo>> {
  return jsonRequest(config, schema, url, { ...options, method: "POST", body });
}

/**
 * PUT JSONリクエストを送信する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonPut<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<T, FetchErrorInfo>> {
  return jsonRequest(config, schema, url, { ...options, method: "PUT", body });
}

/**
 * DELETE JSONリクエストを送信する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonDelete<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  options: Omit<RequestOptions, "method"> = {}
): Promise<Result<T, FetchErrorInfo>> {
  return jsonRequest(config, schema, url, { ...options, method: "DELETE" });
}

/**
 * PATCH JSONリクエストを送信する関数
 * @param config JSON設定オブジェクト
 * @param schema 検証に使用するzodスキーマ
 * @param url リクエストURL
 * @param body リクエストボディ
 * @param options リクエストオプション
 * @returns 検証済みデータを含むResult
 */
export async function jsonPatch<T>(
  config: JsonConfig,
  schema: z.ZodSchema<T>,
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
): Promise<Result<T, FetchErrorInfo>> {
  return jsonRequest(config, schema, url, { ...options, method: "PATCH", body });
}
