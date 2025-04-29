/**
 * このファイルは、@modelcontextprotocol/sdkの型定義の責務を持ちます。
 * SDKの型定義が不足している場合に使用するため、必要な型を定義しています。
 */

/**
 * MCPサーバー
 */
export declare class McpServer {
  constructor(config: ServerConfig);
  tool(name: string, definition: ToolDefinition, handler: ToolHandler): void;
  resource(uri: string, definition: ResourceDefinition, handler: ResourceHandler): void;
  prompt(name: string, definition: PromptDefinition): void;
  use(middleware: Middleware): void;
  connect(transport: ServerTransport): void;
}

/**
 * サーバー設定
 */
export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
}

/**
 * スキーマ定義
 */
export interface Schema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

/**
 * ツール定義
 */
export interface ToolDefinition {
  description: string;
  input_schema: Schema;
}

/**
 * リソース定義
 */
export interface ResourceDefinition {
  description: string;
}

/**
 * プロンプト定義
 */
export interface PromptDefinition {
  description: string;
  template: string;
  param_schema?: Schema;
}

/**
 * ツールハンドラー
 */
export type ToolHandler = (request: ToolRequest) => Promise<ToolResponse>;

/**
 * リソースハンドラー
 */
export type ResourceHandler = () => Promise<unknown>;

/**
 * ツールリクエスト
 */
export interface ToolRequest {
  arguments: Record<string, unknown>;
}

/**
 * ツールレスポンス
 */
export interface ToolResponse {
  content: Array<ToolResponseContent>;
}

/**
 * ツールレスポンスコンテンツ
 */
export interface ToolResponseContent {
  type: string;
  [key: string]: unknown;
}

/**
 * サーバートランスポート
 */
export interface ServerTransport {
  // これは実際のインターフェースのスタブです。
  // 実際には@modelcontextprotocol/sdkが内部で使用する
  // メソッドが定義されていますが、ここでは必要最小限の型定義のみを提供します。
  readonly type: string;
}

/**
 * ミドルウェア
 */
export type Middleware = (
  request: MiddlewareRequest,
  next: (request: MiddlewareRequest) => Promise<unknown>
) => Promise<unknown>;

/**
 * ミドルウェアリクエスト
 */
export interface MiddlewareRequest {
  type: string;
  [key: string]: unknown;
}

/**
 * Stdio サーバートランスポート
 */
export declare class StdioServerTransport implements ServerTransport {
  readonly type: string;
  constructor();
}

/**
 * SSE サーバートランスポート
 */
export declare class SseServerTransport implements ServerTransport {
  readonly type: string;
  constructor();
}