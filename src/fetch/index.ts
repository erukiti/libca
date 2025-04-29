/**
 * fetch - Fetch機能モジュール
 *
 * このモジュールは、汎用的かつ堅牢なHTTP機能を提供します。
 * 基本的なFetch機能、JSON機能、ストリーミング機能を純粋関数として提供し、
 * それぞれ異なるユースケースに対応します。
 *
 * - タイムアウト機能
 * - リトライ機能
 * - エラーハンドリング
 * - レスポンスのバリデーション
 * - ストリーミング処理
 *
 * private prefix: `_fetch`
 */

// types.tsからの型エクスポート
export type {
  HttpMethod,
  FetchConfig,
  JsonConfig,
  StreamConfig,
  RequestOptions,
  FetchErrorInfo,
  RetryOptions,
  StreamingOptions,
  FetchErrorCode,
} from "./types.ts";

// client.tsからのエクスポート
export {
  createFetchConfig,
  fetchRequest,
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  fetchPatch,
  fetchHead,
  fetchOptions,
} from "./client.ts";

// json-client.tsからのエクスポート
export {
  createJsonConfig,
  jsonRequest,
  jsonGet,
  jsonPost,
  jsonPut,
  jsonDelete,
  jsonPatch,
} from "./json-client.ts";

// streaming.tsからのエクスポート
export {
  createStreamConfig,
  streamRequest,
  parseSSE,
} from "./streaming.ts";

/**
 * 使用例:
 *
 * ```ts
 * // 基本的なFetch関数
 * const config = createFetchConfig({
 *   baseUrl: "https://api.example.com",
 *   timeout: 5000,
 * });
 *
 * const result = await fetchGet(config, "/users/1");
 * if (isSuccess(result)) {
 *   const response = result.value;
 *   const data = await response.json();
 *   console.log(data);
 * }
 *
 * // JSON関数
 * const jsonConfig = createJsonConfig({
 *   baseUrl: "https://api.example.com",
 * });
 *
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * const userResult = await jsonGet(jsonConfig, userSchema, "/users/1");
 * if (isSuccess(userResult)) {
 *   // 型安全なデータアクセス
 *   console.log(userResult.value.name);
 * }
 *
 * // ストリーミング関数
 * const streamConfig = createStreamConfig({
 *   baseUrl: "https://api.example.com",
 * });
 *
 * await streamRequest(streamConfig, "/events", {
 *   onChunk: (chunk) => {
 *     const event = parseSSE(chunk);
 *     console.log("イベント:", event);
 *   },
 *   onComplete: () => console.log("ストリーム完了"),
 * });
 * ```
 */