/**
 * mcp - Model Context Protocol モジュール
 * 
 * このモジュールは、Model Context Protocol (MCP) のサーバー作成・設定・実行機能、
 * ツール、リソース、プロンプトの定義と管理、クライアント接続管理とツール実行、
 * エラーハンドリングとロギング連携、拡張性を考慮した設計を提供します。
 *
 * private prefix: `_mcp`
 */

// サーバー関連のエクスポート
export { createMcpServer } from './server';
export { McpServerImpl } from './server-impl';

// クライアント関連のエクスポート
export {
  createMcpClient,
  createProcessManager,
  createMockProcessManager,
  createMockConnectionManager,
} from './client';

// 型定義のエクスポート
export type {
  // サーバー関連の型
  McpServer,
  McpServerConfig,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  ToolRequest,
  ToolResponse,
  ToolResponseContent,
  TextContent,
  ImageContent,
  ResourceResponse,
  
  // ハンドラー関連の型
  ToolHandler,
  ToolHandlerResult,
  ResourceHandler,
  ResourceHandlerResult,
} from './types';

// クライアント関連の型のエクスポート
export type {
  McpClient,
  McpClientConfig,
  ConnectionInfo,
  ConnectionStatus,
  ConnectionType,
  ProcessManager,
  ConnectionManager,
} from './client/types';

// エラー関連の型のエクスポート
export type {
  McpErrorInfo,
  McpErrorKind,
} from './types';

// ユーティリティ関連のエクスポート
export {
  // コンテンツ変換ユーティリティ
  createTextContent,
  createImageContent,
  createToolResponse,
  createSimpleTextResponse,
  createJsonResponse,
  createErrorResponse,
} from './utils/content-converter';

// 標準出力保護機能のエクスポート
export {
  enableStdoutGuard,
  disableStdoutGuard,
  isStdoutGuardEnabled,
} from './utils/stdout-guard';

// エラー関連のエクスポート
export {
  createConnectionError,
  createCommunicationError,
  createTimeoutError,
  createParsingError,
  // createValidationError は result モジュールと名前が衝突するためコメントアウト
  // createValidationError,
  createExecutionError,
  createMcpError,
} from './client/error';