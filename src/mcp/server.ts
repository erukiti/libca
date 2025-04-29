/**
 * このファイルは、MCPサーバー機能のエントリーポイントの責務を持ちます。
 * MCPサーバーの作成と関連機能を提供します。
 */

import type { McpServer, McpServerConfig } from './types';
import { McpServerImpl } from './server-impl';

/**
 * MCPサーバーを作成する
 * 
 * @param config サーバー設定
 * @returns MCPサーバーインスタンス
 */
export function createMcpServer(config: McpServerConfig): McpServer {
  return new McpServerImpl(config);
}