/**
 * このファイルは、MCPクライアント実装の責務を持ちます。
 */

import type { McpClient, McpClientConfig, ConnectionInfo, ConnectionManager } from './types';
import type { McpErrorInfo, ToolResponse, ResourceResponse } from '../types';
import type { Result } from '../../result';
import { success, failure } from '../../result';
import { createConnectionError } from './error';
import { logger } from '../../logger';
import { callToolOperation, accessResourceOperation } from './operations';

// プライベートプレフィックス
const _mcpClientPrefix = '_mcpClient';

// コンテキスト付きロガー
const _mcpClientLogger = logger.withContext('McpClient');

/**
 * デフォルトのタイムアウト (5秒)
 */
const _mcpClientDefaultTimeout = 5000;

/**
 * MCPクライアント実装クラス
 */
export class McpClientImpl implements McpClient {
  /**
   * クライアント設定
   */
  private readonly _config: McpClientConfig;
  
  /**
   * 接続マネージャー
   */
  private readonly _connectionManager: ConnectionManager;
  
  /**
   * 利用可能なツール一覧
   */
  private _availableTools: string[] = [];
  
  /**
   * 利用可能なリソース一覧
   */
  private _availableResources: string[] = [];
  
  /**
   * 最終接続時刻
   */
  private _lastConnectedAt?: Date;
  
  /**
   * コンストラクタ
   * 
   * @param config クライアント設定
   * @param connectionManager 接続マネージャー
   */
  constructor(
    config: McpClientConfig,
    connectionManager: ConnectionManager
  ) {
    this._config = {
      timeout: _mcpClientDefaultTimeout,
      autoReconnect: false,
      maxReconnectAttempts: 3,
      ...config
    };
    this._connectionManager = connectionManager;
    
    _mcpClientLogger.debug(`クライアント作成: ${config.serverName}`);
  }
  
  /**
   * サーバーに接続する
   */
  async connect(): Promise<Result<void, McpErrorInfo>> {
    _mcpClientLogger.info(`接続開始: ${this._config.serverName}`);
    
    const result = await this._connectionManager.connect();
    
    if (result.success) {
      this._lastConnectedAt = new Date();
      _mcpClientLogger.info(`接続成功: ${this._config.serverName}`);
      
      // 利用可能なツールとリソースを取得
      await this._fetchCapabilities();
    } else {
      _mcpClientLogger.error(`接続失敗: ${this._config.serverName}`, result.error);
    }
    
    return result;
  }
  
  /**
   * サーバーから切断する
   */
  async disconnect(): Promise<Result<void, McpErrorInfo>> {
    _mcpClientLogger.info(`切断開始: ${this._config.serverName}`);
    
    const result = await this._connectionManager.disconnect();
    
    if (result.success) {
      _mcpClientLogger.info(`切断成功: ${this._config.serverName}`);
    } else {
      _mcpClientLogger.error(`切断失敗: ${this._config.serverName}`, result.error);
    }
    
    return result;
  }
  
  /**
   * ツールを呼び出す
   * 
   * @param name ツール名
   * @param args 引数
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<Result<ToolResponse, McpErrorInfo>> {
    return callToolOperation(
      this._connectionManager,
      this._config.serverName,
      name,
      args,
      this._config.timeout || _mcpClientDefaultTimeout,
      this._availableTools
    );
  }
  
  /**
   * リソースにアクセスする
   * 
   * @param uri リソースURI
   */
  async accessResource(
    uri: string
  ): Promise<Result<ResourceResponse, McpErrorInfo>> {
    return accessResourceOperation(
      this._connectionManager,
      this._config.serverName,
      uri,
      this._config.timeout || _mcpClientDefaultTimeout,
      this._availableResources
    );
  }
  
  /**
   * 接続情報を取得する
   */
  getConnectionInfo(): ConnectionInfo {
    const status = this._connectionManager.getStatus();
    
    return {
      serverName: this._config.serverName,
      status,
      type: 'stdio', // 現状では常にstdio
      lastConnectedAt: this._lastConnectedAt,
      availableTools: this._availableTools,
      availableResources: this._availableResources,
    };
  }
  
  /**
   * 利用可能なツール一覧を取得する
   */
  async getAvailableTools(): Promise<Result<string[], McpErrorInfo>> {
    return this._checkConnectionAndReturn(this._availableTools);
  }
  
  /**
   * 利用可能なリソース一覧を取得する
   */
  async getAvailableResources(): Promise<Result<string[], McpErrorInfo>> {
    return this._checkConnectionAndReturn(this._availableResources);
  }
  
  /**
   * 接続チェックを行い、接続されていれば指定された値を返す
   * 
   * @param value 返す値
   * @returns 接続されていれば指定された値、そうでなければエラー
   */
  private async _checkConnectionAndReturn<T>(value: T): Promise<Result<T, McpErrorInfo>> {
    if (this._connectionManager.getStatus() !== 'connected') {
      return failure(createConnectionError(
        `サーバー ${this._config.serverName} に接続されていません`,
        undefined,
        false
      ));
    }
    
    // 配列の場合はコピーを返す（引数の型がT[]の場合）
    return success(value);
  }
  
  /**
   * サーバーの機能（ツール、リソース）を取得する
   */
  private async _fetchCapabilities(): Promise<void> {
    _mcpClientLogger.debug(`機能取得: ${this._config.serverName}`);
    
    // 現状ではモックデータを使用
    this._availableTools = ['echo', 'calculate', 'search'];
    this._availableResources = [
      `${this._config.serverName}://info`,
      `${this._config.serverName}://status`,
    ];
    
    _mcpClientLogger.debug(`機能取得完了: ${this._config.serverName}`);
  }
}