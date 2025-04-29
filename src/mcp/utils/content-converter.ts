/**
 * このファイルは、MCPコンテンツ変換ユーティリティの責務を持ちます。
 * 内部形式と外部形式の間でコンテンツを変換する機能を提供します。
 */

import type { ToolResponseContent, TextContent, ImageContent } from '../types';

// MCPユーティリティのプライベートプレフィックス
const _mcpUtilsPrefix = '_mcpUtils';

/**
 * テキストコンテンツを作成する
 * 
 * @param text テキスト内容
 * @returns テキストコンテンツオブジェクト
 */
export function createTextContent(text: string): TextContent {
  return {
    type: 'text',
    text,
  };
}

/**
 * 画像コンテンツを作成する
 * 
 * @param data 画像データ (base64エンコード)
 * @param mimeType MIMEタイプ (例: 'image/png')
 * @returns 画像コンテンツオブジェクト
 */
export function createImageContent(data: string, mimeType: string): ImageContent {
  return {
    type: 'image',
    data,
    mimeType,
  };
}

/**
 * 複数のコンテンツアイテムからレスポンスを作成する
 * 
 * @param contents コンテンツアイテムの配列
 * @returns ツールレスポンス
 */
export function createToolResponse(contents: ToolResponseContent[]) {
  return {
    content: contents,
  };
}

/**
 * テキストからシンプルなレスポンスを作成する
 * 
 * @param text テキスト内容
 * @returns ツールレスポンス
 */
export function createSimpleTextResponse(text: string) {
  return createToolResponse([createTextContent(text)]);
}

/**
 * オブジェクトをJSON文字列に変換してレスポンスを作成する
 * 
 * @param data 任意のオブジェクト
 * @returns ツールレスポンス
 */
export function createJsonResponse(data: unknown) {
  try {
    const json = JSON.stringify(data, null, 2);
    return createSimpleTextResponse(json);
  } catch (error) {
    return createSimpleTextResponse('Error: Could not convert to JSON');
  }
}

/**
 * エラーメッセージからエラーレスポンスを作成する
 * 
 * @param message エラーメッセージ
 * @returns ツールレスポンス
 */
export function createErrorResponse(message: string) {
  return createSimpleTextResponse(`Error: ${message}`);
}

/**
 * Base64エンコードされた画像データを検証する
 * 
 * @param data Base64エンコードされたデータ
 * @returns 有効なBase64データかどうか
 */
export function _mcpUtilsIsValidBase64(data: string): boolean {
  // Base64のパターンをチェック
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(data);
}

/**
 * MIMEタイプが画像タイプかどうかを検証する
 * 
 * @param mimeType MIMEタイプ
 * @returns 画像MIMEタイプかどうか
 */
export function _mcpUtilsIsImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}