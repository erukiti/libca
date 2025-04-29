/**
 * このファイルは、MCPクライアント接続管理の責務を持ちます。
 */

import type { ConnectionManager, ConnectionStatus } from './types';
import type { McpErrorInfo } from '../types';
import type { Result } from '../../result';
import { success, failure } from '../../result';
import { createConnectionError, createCommunicationError, createTimeoutError } from './error';
import { logger } from '../../logger';

// プライベートプレフィックス
const _mcpClientPrefix = '_mcpClient';

// コンテキスト付きロガー
const _mcpClientLogger = logger.withContext('McpClient');

/**
 * 基本的な接続マネージャークラス
 * これは実際の接続実装のベースクラスとして機能します
 */
export abstract class _McpClientBaseConnectionManager implements ConnectionManager {
  /**
   * サーバー名
   */
  protected readonly _serverName: string;
  
  /**
   * 接続状態
   */
  protected _status: ConnectionStatus = 'disconnected';
  
  /**
   * コンストラクタ
   * 
   * @param serverName サーバー名
   */
  constructor(serverName: string) {
    this._serverName = serverName;
    _mcpClientLogger.debug(`接続マネージャー作成: ${serverName}`);
  }
  
  /**
   * 接続を確立する
   */
  abstract connect(): Promise<Result<void, McpErrorInfo>>;
  
  /**
   * 接続を切断する
   */
  abstract disconnect(): Promise<Result<void, McpErrorInfo>>;
  
  /**
   * メッセージを送信する
   * 
   * @param message 送信するメッセージ
   */
  abstract sendMessage(message: unknown): Promise<Result<void, McpErrorInfo>>;
  
  /**
   * レスポンスを待機する
   * 
   * @param correlationId 相関ID
   * @param timeout タイムアウト時間（ミリ秒）
   */
  abstract waitForResponse(correlationId: string, timeout: number): Promise<Result<unknown, McpErrorInfo>>;
  
  /**
   * 接続状態を取得する
   * 
   * @returns 現在の接続状態
   */
  getStatus(): ConnectionStatus {
    return this._status;
  }
  
  /**
   * 接続状態を設定する
   * 
   * @param status 新しい接続状態
   */
  protected _setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      _mcpClientLogger.debug(`接続状態変更: ${this._serverName} ${this._status} -> ${status}`);
      this._status = status;
    }
  }
  
  /**
   * メッセージを送信できる状態かどうかを確認する
   * 
   * @returns 送信可能な場合はtrue、そうでない場合はResult.failure
   */
  protected _checkCanSend(): Result<void, McpErrorInfo> | true {
    if (this._status !== 'connected') {
      return failure(createConnectionError(
        `サーバー ${this._serverName} に接続されていません (現在の状態: ${this._status})`,
        undefined,
        false
      ));
    }
    return true;
  }
}

/**
 * モック接続マネージャー
 * テスト用の簡易実装
 */
export class _McpClientMockConnectionManager extends _McpClientBaseConnectionManager {
  /**
   * メッセージ応答マッピング
   */
  private readonly _responses = new Map<string, unknown>();
  
  // 親クラスのコンストラクタを継承
  
  /**
   * モック応答を設定する
   * 
   * @param correlationId 相関ID
   * @param response 応答データ
   */
  setMockResponse(correlationId: string, response: unknown): void {
    this._responses.set(correlationId, response);
  }
  
  /**
   * モック接続を確立する
   */
  async connect(): Promise<Result<void, McpErrorInfo>> {
    _mcpClientLogger.info(`モック接続開始: ${this._serverName}`);
    this._setStatus('connecting');
    
    // 擬似的な遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this._setStatus('connected');
    _mcpClientLogger.info(`モック接続確立: ${this._serverName}`);
    return success(undefined);
  }
  
  /**
   * モック接続を切断する
   */
  async disconnect(): Promise<Result<void, McpErrorInfo>> {
    _mcpClientLogger.info(`モック切断開始: ${this._serverName}`);
    
    // 擬似的な遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this._setStatus('disconnected');
    _mcpClientLogger.info(`モック切断完了: ${this._serverName}`);
    return success(undefined);
  }
  
  /**
   * モックメッセージを送信する
   * 
   * @param message 送信するメッセージ
   */
  async sendMessage(message: unknown): Promise<Result<void, McpErrorInfo>> {
    const canSend = this._checkCanSend();
    if (canSend !== true) {
      return canSend as Result<void, McpErrorInfo>;
    }
    
    _mcpClientLogger.debug(`モックメッセージ送信: ${this._serverName}`, message);
    return success(undefined);
  }
  
  /**
   * モックレスポンスを待機する
   * 
   * @param correlationId 相関ID
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async waitForResponse(correlationId: string, timeout: number): Promise<Result<unknown, McpErrorInfo>> {
    const canSend = this._checkCanSend();
    if (canSend !== true) {
      return canSend as Result<void, McpErrorInfo>;
    }
    
    _mcpClientLogger.debug(`モックレスポンス待機: ${this._serverName} correlationId=${correlationId}`);
    
    // 擬似的な遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // モックレスポンスを取得
    const response = this._responses.get(correlationId);
    if (response) {
      _mcpClientLogger.debug(`モックレスポンス受信: ${this._serverName} correlationId=${correlationId}`);
      return success(response);
    }
    
    // デフォルトのモックレスポンス
    _mcpClientLogger.debug(`モックレスポンス生成: ${this._serverName} correlationId=${correlationId}`);
    return success({
      result: `Mock response for ${correlationId}`,
      serverName: this._serverName
    });
  }
}

/**
 * モック接続マネージャーを作成する
 * 
 * @param serverName サーバー名
 * @returns 接続マネージャー
 */
export function createMockConnectionManager(serverName: string): ConnectionManager {
  return new _McpClientMockConnectionManager(serverName);
}