/**
 * このファイルは、スキーマ変換ユーティリティの責務を持ちます。
 * Zodスキーマ定義からMCP SDKのJSONスキーマへの変換機能を提供します。
 */

import type { Schema } from '../types/sdk';

// プライベートプレフィックス
const _mcpSchemaPrefix = '_mcpSchema';

/**
 * Zodフィールドの型定義
 * 簡易的な実装のためインターフェースを定義
 */
export interface ZodField {
  _def?: {
    typeName?: string;
  };
  isOptional?: () => boolean;
}

/**
 * Zodスキーマを基本的なJSONスキーマに変換する
 * 
 * @param zodSchema Zodスキーマオブジェクト
 * @returns JSONスキーマオブジェクト
 */
export function convertZodSchemaToJsonSchema(zodSchema: Record<string, ZodField>): Schema {
  const schema: Schema = {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  };

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(zodSchema)) {
    const isOptional = field.isOptional?.();
    properties[key] = { type: getZodFieldType(field) };
    
    if (!isOptional) {
      required.push(key);
    }
  }

  schema.properties = properties;
  schema.required = required;

  return schema;
}

/**
 * Zodフィールドタイプを取得する
 * 簡易的な実装で、一部の基本的な型のみをサポート
 *
 * @param field Zodフィールド
 * @returns JSONスキーマの型
 */
export function getZodFieldType(field: ZodField): string {
  if (field._def?.typeName === 'ZodString') return 'string';
  if (field._def?.typeName === 'ZodNumber') return 'number';
  if (field._def?.typeName === 'ZodBoolean') return 'boolean';
  if (field._def?.typeName === 'ZodArray') return 'array';
  if (field._def?.typeName === 'ZodObject') return 'object';
  return 'string'; // デフォルト
}