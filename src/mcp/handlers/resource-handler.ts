/**
 * このファイルは、MCPリソースハンドラーの責務を持ちます。
 * リソースリクエストの処理とレスポンス生成を担当します。
 */

import type { ResourceDefinition } from '../types';
import { logger } from '../../logger';

// MCPサーバーのコンテキスト付きロガー
const _mcpLogger = logger.withContext('MCP');

/**
 * リソースハンドラーラッパーを作成する
 * 
 * @param uri リソースURI
 * @param definition リソース定義
 * @returns ラップされたリソースハンドラー
 */
export function createResourceHandler(uri: string, definition: ResourceDefinition) {
  return async () => {
    _mcpLogger.debug(`リソースアクセス: ${uri}`);
    
    try {
      // ハンドラー実行
      const result = await definition.handler(uri);
      
      if (result.success) {
        _mcpLogger.debug(`リソース成功: ${uri}`);
        return result.value.content;
      }
      
      // 失敗の場合
      _mcpLogger.error(`リソース失敗: ${uri}`, result.error);
      throw new Error(result.error.message);
    } catch (error) {
      _mcpLogger.error(`リソース例外: ${uri}`, error);
      throw error;
    }
  };
}