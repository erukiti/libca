/**
 * このファイルは、MCP（Model Context Protocol）の型定義の責務を持ちます。
 */

import type { ErrorInfoBase } from '../result';
import type { z } from 'zod';

/**
 * MCPサーバーの設定オプション
 */
export interface McpServerConfig {
  /** サーバー名 */
  name: string;
  /** サーバーバージョン */
  version: string;
  /** サーバーの説明（オプション） */
  description?: string;
}

/**
 * MCPエラー種別
 */
export type McpErrorKind =
  | 'connection'
  | 'communication'
  | 'timeout'
  | 'parsing'
  | 'validation'
  | 'execution';

/**
 * MCPエラー情報
 */
export interface McpErrorInfo extends ErrorInfoBase {
  /** エラータイプ */
  type: 'mcp';
  /** エラー種別 */
  kind: McpErrorKind;
  /** エラーが回復可能かどうか */
  recoverable: boolean;
}

/**
 * MCPツールのレスポンス型
 */
export interface ToolResponse {
  /** ツールの実行結果 */
  content: ToolResponseContent[];
}

/**
 * MCPツールのレスポンスコンテンツ型
 */
export type ToolResponseContent = TextContent | ImageContent;

/**
 * テキストコンテンツ
 */
export interface TextContent {
  /** コンテンツタイプ */
  type: 'text';
  /** テキスト内容 */
  text: string;
  /** インデックスシグネチャ対応 */
  [key: string]: unknown;
}

/**
 * 画像コンテンツ
 */
export interface ImageContent {
  /** コンテンツタイプ */
  type: 'image';
  /** 画像データ (base64エンコード) */
  data: string;
  /** MIMEタイプ */
  mimeType: string;
  /** インデックスシグネチャ対応 */
  [key: string]: unknown;
}

/**
 * リソースレスポンス型
 */
export interface ResourceResponse {
  /** リソースの内容 */
  content: unknown;
}

/**
 * ツール定義
 */
export interface ToolDefinition {
  /** ツールの説明 */
  description: string;
  /** 入力スキーマ（Zodスキーマオブジェクト） */
  inputSchema: z.ZodObject<z.ZodRawShape>;
  /** ツールハンドラー関数 */
  handler: ToolHandler;
}

/**
 * ツールハンドラー型
 */
export type ToolHandler = (
  request: ToolRequest
) => Promise<ToolHandlerResult>;

/**
 * ツールリクエスト
 */
export interface ToolRequest {
  /** ツール名 */
  name: string;
  /** 引数 */
  arguments: Record<string, unknown>;
}

/**
 * ツールハンドラーの結果
 */
export type ToolHandlerResult = import('../result').Result<ToolResponse, McpErrorInfo>;

/**
 * リソース定義
 */
export interface ResourceDefinition {
  /** リソースの説明 */
  description: string;
  /** リソースハンドラー関数 */
  handler: ResourceHandler;
}

/**
 * リソースハンドラー型
 */
export type ResourceHandler = (
  uri: string
) => Promise<ResourceHandlerResult>;

/**
 * リソースハンドラーの結果
 */
export type ResourceHandlerResult = import('../result').Result<ResourceResponse, McpErrorInfo>;

/**
 * プロンプト定義
 */
export interface PromptDefinition {
  /** プロンプトの説明 */
  description: string;
  /** プロンプトテンプレート */
  template: string;
  /** プロンプトパラメータスキーマ（オプション） */
  paramSchema?: z.ZodObject<z.ZodRawShape>;
}

/**
 * MCPサーバーインターフェース
 */
export interface McpServer {
  /** サーバーを実行する */
  run(transport: 'stdio' | 'sse'): Promise<import('../result').Result<void, McpErrorInfo>>;
  /** ツールを追加する */
  addTool(name: string, definition: ToolDefinition): void;
  /** リソースを追加する */
  addResource(uri: string, definition: ResourceDefinition): void;
  /** プロンプトを追加する */
  addPrompt(name: string, definition: PromptDefinition): void;
}