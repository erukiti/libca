/**
 * このファイルは、MCPクライアントマネージャーの責務を持ちます。
 * クライアントの作成と管理を行います。
 */

import type { McpClient, McpClientConfig } from './types';
import { createMockConnectionManager } from './connection';
import { McpClientImpl } from './client-impl';

/**
 * MCPクライアントを作成する
 * 
 * @param config クライアント設定または単純にサーバー名
 * @returns MCPクライアントインスタンス
 */
export function createMcpClient(
  config: McpClientConfig | string
): McpClient {
  // 文字列の場合はサーバー名として扱う
  const fullConfig: McpClientConfig = typeof config === 'string'
    ? { serverName: config }
    : config;
  
  // 接続マネージャーを作成（現状ではモックのみ）
  const connectionManager = createMockConnectionManager(fullConfig.serverName);
  
  return new McpClientImpl(fullConfig, connectionManager);
}