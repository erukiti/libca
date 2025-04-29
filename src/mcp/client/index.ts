/**
 * このファイルは、MCPクライアント機能のエントリーポイントの責務を持ちます。
 * クライアント関連の機能や型をエクスポートします。
 */

// 型定義のエクスポート
export type {
  McpClient,
  McpClientConfig,
  ConnectionInfo,
  ConnectionStatus,
  ConnectionType,
  ProcessManager,
  ConnectionManager,
} from './types';

// クライアント作成関数
export { createMcpClient } from './manager';

// クライアント実装クラス（内部実装用）
export { McpClientImpl } from './client-impl';

// プロセス管理関連
export { createProcessManager, createMockProcessManager } from './process';

// 接続管理関連
export { 
  createMockConnectionManager,
  _McpClientBaseConnectionManager,
  _McpClientMockConnectionManager
} from './connection';

// 操作関連
export {
  callToolOperation,
  accessResourceOperation,
  generateCorrelationId
} from './operations';

// エラー関連
export {
  createConnectionError,
  createCommunicationError,
  createTimeoutError,
  createParsingError,
  createValidationError,
  createExecutionError,
  createMcpError
} from './error';