/**
 * fetch - Fetchクライアントモジュール
 * 
 * このモジュールは、汎用的かつ堅牢なHTTPクライアント機能を提供します。
 * 基本的なFetchクライアント、JSONクライアント、ストリーミングクライアントの
 * 3種類のクライアントを提供し、それぞれ異なるユースケースに対応します。
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
  FetchClientOptions,
  RequestOptions,
  FetchErrorInfo,
  RetryOptions,
  StreamingOptions,
  FetchErrorCode,
} from "./types.ts";

// client.tsからのエクスポート
export {
  FetchClient,
  createFetchClient,
} from "./client.ts";

// json-client.tsからのエクスポート - JsonClientの型はtypes.tsからエクスポート
export {
  JsonClient,
  createJsonClient,
} from "./json-client.ts";

// streaming.tsからのエクスポート
export {
  StreamingClient,
  createStreamingClient,
} from "./streaming.ts";

/**
 * 使用例:
 *
 * ```ts
 * // 基本的なFetchクライアント
 * const fetchClient = createFetchClient({
 *   baseUrl: "https://api.example.com",
 *   timeout: 5000,
 * });
 * 
 * const result = await fetchClient.get("/users/1");
 * if (isSuccess(result)) {
 *   const response = result.value;
 *   const data = await response.json();
 *   console.log(data);
 * }
 * 
 * // JSONクライアント
 * const jsonClient = createJsonClient({
 *   baseUrl: "https://api.example.com",
 * });
 * 
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 * 
 * const userResult = await jsonClient.get(userSchema, "/users/1");
 * if (isSuccess(userResult)) {
 *   // 型安全なデータアクセス
 *   console.log(userResult.value.name);
 * }
 * 
 * // ストリーミングクライアント
 * const streamingClient = createStreamingClient({
 *   baseUrl: "https://api.example.com",
 * });
 * 
 * await streamingClient.stream("/events", {
 *   onChunk: (chunk) => {
 *     const event = StreamingClient.parseSSE(chunk);
 *     console.log("イベント:", event);
 *   },
 *   onComplete: () => console.log("ストリーム完了"),
 * });
 * ```
 */