/**
 * このファイルは、MCPクライアントの型定義の責務を持ちます。
 */

import type { Result } from '../../result';
import type { McpErrorInfo, ToolResponse, ResourceResponse } from '../types';

/**
 * MCPクライアント設定オプション
 */
export interface McpClientConfig {
  /** サーバー名 */
  serverName: string;
  /** コマンド（プロセス起動時に使用） */
  command?: string;
  /** タイムアウト設定（ミリ秒） */
  timeout?: number;
  /** 自動再接続を有効にするかどうか */
  autoReconnect?: boolean;
  /** 最大再接続試行回数 */
  maxReconnectAttempts?: number;
}

/**
 * MCPクライアント接続情報
 */
export interface ConnectionInfo {
  /** サーバー名 */
  serverName: string;
  /** 接続状態 */
  status: ConnectionStatus;
  /** 接続タイプ */
  type: ConnectionType;
  /** 最終接続時刻 */
  lastConnectedAt?: Date;
  /** 利用可能なツール */
  availableTools?: string[];
  /** 利用可能なリソース */
  availableResources?: string[];
}

/**
 * 接続状態
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * 接続タイプ
 */
export type ConnectionType = 'stdio' | 'sse' | 'unknown';

/**
 * MCPクライアントインターフェース
 */
export interface McpClient {
  /** サーバーに接続する */
  connect(): Promise<Result<void, McpErrorInfo>>;
  
  /** サーバーから切断する */
  disconnect(): Promise<Result<void, McpErrorInfo>>;
  
  /** ツールを呼び出す */
  callTool(
    name: string, 
    args: Record<string, unknown>
  ): Promise<Result<ToolResponse, McpErrorInfo>>;
  
  /** リソースにアクセスする */
  accessResource(
    uri: string
  ): Promise<Result<ResourceResponse, McpErrorInfo>>;
  
  /** 接続情報を取得する */
  getConnectionInfo(): ConnectionInfo;
  
  /** 利用可能なツール一覧を取得する */
  getAvailableTools(): Promise<Result<string[], McpErrorInfo>>;
  
  /** 利用可能なリソース一覧を取得する */
  getAvailableResources(): Promise<Result<string[], McpErrorInfo>>;
}

/**
 * プロセス管理インターフェース
 */
export interface ProcessManager {
  /** プロセスを開始する */
  start(command: string): Promise<Result<void, McpErrorInfo>>;
  
  /** プロセスを停止する */
  stop(): Promise<Result<void, McpErrorInfo>>;
  
  /** プロセスが実行中かどうかを確認する */
  isRunning(): boolean;
}

/**
 * クライアント接続マネージャーインターフェース
 */
export interface ConnectionManager {
  /** 接続を確立する */
  connect(): Promise<Result<void, McpErrorInfo>>;
  
  /** 接続を切断する */
  disconnect(): Promise<Result<void, McpErrorInfo>>;
  
  /** メッセージを送信する */
  sendMessage(message: unknown): Promise<Result<void, McpErrorInfo>>;
  
  /** レスポンスを待機する */
  waitForResponse(
    correlationId: string, 
    timeout: number
  ): Promise<Result<unknown, McpErrorInfo>>;
  
  /** 接続状態を取得する */
  getStatus(): ConnectionStatus;
}