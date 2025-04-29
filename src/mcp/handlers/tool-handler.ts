/**
 * このファイルは、MCPツールハンドラーの責務を持ちます。
 * ツールリクエストの処理とレスポンス生成を担当します。
 */

import type { ToolRequest as SdkToolRequest } from '../types/sdk';
import type { ToolDefinition } from '../types';
import { logger } from '../../logger';

// MCPサーバーのコンテキスト付きロガー
const _mcpLogger = logger.withContext('MCP');

/**
 * ツールハンドラーラッパーを作成する
 * 
 * @param name ツール名
 * @param definition ツール定義
 * @returns ラップされたツールハンドラー
 */
export function createToolHandler(name: string, definition: ToolDefinition) {
  return async (request: SdkToolRequest) => {
    _mcpLogger.debug(`ツール実行: ${name}`);
    
    try {
      // ツールリクエストを変換
      const toolRequest = {
        name,
        arguments: request.arguments,
      };

      // ハンドラー実行
      const result = await definition.handler(toolRequest);
      
      if (result.success) {
        _mcpLogger.debug(`ツール成功: ${name}`);
        return result.value;
      }
      
      // 失敗の場合
      _mcpLogger.error(`ツール失敗: ${name}`, result.error);
      throw new Error(result.error.message);
    } catch (error) {
      _mcpLogger.error(`ツール例外: ${name}`, error);
      throw error;
    }
  };
}