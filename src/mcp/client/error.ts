/**
 * このファイルは、MCPクライアントのエラー定義の責務を持ちます。
 */

import type { McpErrorInfo, McpErrorKind } from '../types';
import { createErrorInfo } from '../../result/error';

/**
 * MCPエラー情報を作成する
 * 
 * @param kind エラー種別
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか
 * @returns MCPエラー情報
 */
export function createMcpError(
  kind: McpErrorKind,
  message: string,
  cause?: Error,
  recoverable = false
): McpErrorInfo {
  return {
    type: 'mcp',
    kind,
    message,
    recoverable,
    cause,
    stack: cause?.stack,
  };
}

/**
 * 接続エラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: true）
 * @returns MCPエラー情報
 */
export function createConnectionError(
  message: string,
  cause?: Error,
  recoverable = true
): McpErrorInfo {
  return createMcpError('connection', message, cause, recoverable);
}

/**
 * 通信エラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: true）
 * @returns MCPエラー情報
 */
export function createCommunicationError(
  message: string,
  cause?: Error,
  recoverable = true
): McpErrorInfo {
  return createMcpError('communication', message, cause, recoverable);
}

/**
 * タイムアウトエラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: true）
 * @returns MCPエラー情報
 */
export function createTimeoutError(
  message: string,
  cause?: Error,
  recoverable = true
): McpErrorInfo {
  return createMcpError('timeout', message, cause, recoverable);
}

/**
 * パースエラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: false）
 * @returns MCPエラー情報
 */
export function createParsingError(
  message: string,
  cause?: Error,
  recoverable = false
): McpErrorInfo {
  return createMcpError('parsing', message, cause, recoverable);
}

/**
 * バリデーションエラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: false）
 * @returns MCPエラー情報
 */
export function createValidationError(
  message: string,
  cause?: Error,
  recoverable = false
): McpErrorInfo {
  return createMcpError('validation', message, cause, recoverable);
}

/**
 * 実行エラーを作成する
 * 
 * @param message エラーメッセージ
 * @param cause エラーの原因
 * @param recoverable 回復可能かどうか（デフォルト: false）
 * @returns MCPエラー情報
 */
export function createExecutionError(
  message: string,
  cause?: Error,
  recoverable = false
): McpErrorInfo {
  return createMcpError('execution', message, cause, recoverable);
}