/**
 * このファイルは、MCPクライアント操作の責務を持ちます。
 * ツール呼び出しやリソースアクセスなどの操作ロジックを提供します。
 */

import type { McpErrorInfo, ToolResponse, ResourceResponse } from '../types';
import type { ConnectionManager } from './types';
import type { Result } from '../../result';
import { success, failure } from '../../result';
import { createCommunicationError } from './error';
import { logger } from '../../logger';

// コンテキスト付きロガー
const _mcpClientLogger = logger.withContext('McpClient');

/**
 * ツール呼び出し操作
 * 
 * @param connectionManager 接続マネージャー
 * @param serverName サーバー名
 * @param toolName ツール名
 * @param args 引数
 * @param timeout タイムアウト時間（ミリ秒）
 * @param availableTools 利用可能なツール一覧
 * @returns ツールレスポンス結果
 */
export async function callToolOperation(
  connectionManager: ConnectionManager,
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
  timeout: number,
  availableTools: string[]
): Promise<Result<ToolResponse, McpErrorInfo>> {
  _mcpClientLogger.debug(`ツール呼び出し: ${serverName}.${toolName}`, args);
  
  // ツールが利用可能かチェック
  if (!availableTools.includes(toolName)) {
    return failure(createCommunicationError(
      `ツール "${toolName}" は ${serverName} で利用できません`,
      undefined,
      false
    ));
  }
  
  // リクエストを作成
  const request = {
    type: 'tool_call',
    tool: toolName,
    arguments: args,
    correlation_id: generateCorrelationId(),
  };
  
  // リクエスト送信
  const sendResult = await connectionManager.sendMessage(request);
  if (!sendResult.success) {
    return failure(sendResult.error);
  }
  
  // レスポンス待機
  const responseResult = await connectionManager.waitForResponse(
    request.correlation_id,
    timeout
  );
  
  if (!responseResult.success) {
    return failure(responseResult.error);
  }
  
  // レスポンスを変換
  try {
    const response = responseResult.value as ToolResponse;
    _mcpClientLogger.debug(`ツール成功: ${serverName}.${toolName}`);
    return success(response);
  } catch (error) {
    _mcpClientLogger.error(`ツールレスポンス変換エラー: ${serverName}.${toolName}`, error);
    return failure(createCommunicationError(
      `ツールレスポンスのフォーマットが不正です: ${toolName}`,
      error instanceof Error ? error : undefined,
      false
    ));
  }
}

/**
 * リソースアクセス操作
 * 
 * @param connectionManager 接続マネージャー
 * @param serverName サーバー名
 * @param uri リソースURI
 * @param timeout タイムアウト時間（ミリ秒）
 * @param availableResources 利用可能なリソース一覧
 * @returns リソースレスポンス結果
 */
export async function accessResourceOperation(
  connectionManager: ConnectionManager,
  serverName: string,
  uri: string,
  timeout: number,
  availableResources: string[]
): Promise<Result<ResourceResponse, McpErrorInfo>> {
  _mcpClientLogger.debug(`リソースアクセス: ${serverName} ${uri}`);
  
  // リソースが利用可能かチェック
  if (!availableResources.includes(uri)) {
    return failure(createCommunicationError(
      `リソース "${uri}" は ${serverName} で利用できません`,
      undefined,
      false
    ));
  }
  
  // リクエストを作成
  const request = {
    type: 'resource_access',
    uri: uri,
    correlation_id: generateCorrelationId(),
  };
  
  // リクエスト送信
  const sendResult = await connectionManager.sendMessage(request);
  if (!sendResult.success) {
    return failure(sendResult.error);
  }
  
  // レスポンス待機
  const responseResult = await connectionManager.waitForResponse(
    request.correlation_id,
    timeout
  );
  
  if (!responseResult.success) {
    return failure(responseResult.error);
  }
  
  // レスポンスを変換
  try {
    const response = { content: responseResult.value } as ResourceResponse;
    _mcpClientLogger.debug(`リソース成功: ${serverName} ${uri}`);
    return success(response);
  } catch (error) {
    _mcpClientLogger.error(`リソースレスポンス変換エラー: ${serverName} ${uri}`, error);
    return failure(createCommunicationError(
      `リソースレスポンスのフォーマットが不正です: ${uri}`,
      error instanceof Error ? error : undefined,
      false
    ));
  }
}

/**
 * 固有の相関IDを生成する
 * 
 * @returns 相関ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}