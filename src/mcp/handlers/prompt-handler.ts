/**
 * このファイルは、MCPプロンプトハンドラーの責務を持ちます。
 * プロンプト定義の処理と登録を担当します。
 */

import type { Schema } from '../types/sdk';
import type { PromptDefinition } from '../types';
import { convertZodSchemaToJsonSchema } from '../utils/schema-converter';
import { logger } from '../../logger';

// MCPサーバーのコンテキスト付きロガー
const _mcpLogger = logger.withContext('MCP');

/**
 * プロンプト定義からSDK用のプロンプト定義を作成する
 * 
 * @param name プロンプト名
 * @param definition プロンプト定義
 * @returns SDK用のプロンプト定義
 */
export function createSdkPromptDefinition(
  name: string,
  definition: PromptDefinition
): { description: string; template: string; param_schema?: Schema } {
  _mcpLogger.debug(`プロンプト定義作成: ${name}`);

  // パラメータスキーマの変換（オプション）
  let paramSchema: Schema | undefined;
  
  if (definition.paramSchema) {
    try {
      // Zodスキーマからスキーマに変換
      paramSchema = convertZodSchemaToJsonSchema(definition.paramSchema.shape);
    } catch (error) {
      _mcpLogger.error(`プロンプトスキーマ変換エラー: ${name}`, error);
    }
  }

  // SDKサーバー用にプロンプト定義を返す
  return {
    description: definition.description,
    template: definition.template,
    param_schema: paramSchema,
  };
}