/**
 * MCPサーバーの単体テスト
 */

import { test, expect, beforeEach, afterEach } from 'bun:test';
import { z } from 'zod';
import { createMcpServer } from './server';
import { enableStdoutGuard, disableStdoutGuard } from './utils/stdout-guard';
import { isSuccess, success } from '../result';
import type { ToolRequest, ToolResponse, ResourceResponse } from './types';

// テスト用のサーバー設定
const testServerConfig = {
  name: 'test-server',
  version: '1.0.0',
  description: 'Test MCP Server',
};

// テスト前に標準出力保護を有効にする
beforeEach(() => {
  enableStdoutGuard();
});

// テスト後に標準出力保護を無効にする
afterEach(() => {
  disableStdoutGuard();
});

test('MCPサーバーが正しく作成される', () => {
  const server = createMcpServer(testServerConfig);
  
  expect(server).toBeDefined();
  expect(typeof server.run).toBe('function');
  expect(typeof server.addTool).toBe('function');
  expect(typeof server.addResource).toBe('function');
  expect(typeof server.addPrompt).toBe('function');
});

test('サーバーにツールを追加できる', () => {
  const server = createMcpServer(testServerConfig);
  
  // 定義するツールのスキーマ
  const echoToolSchema = z.object({
    message: z.string().describe('エコーするメッセージ'),
  });
  
  // ツールのハンドラー関数
  const echoToolHandler = async (request: ToolRequest) => {
    const { message } = request.arguments as { message: string };
    const response: ToolResponse = {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
    return success(response);
  };
  
  // ツールを追加
  expect(() => {
    server.addTool('echo', {
      description: 'テキストをそのまま返すエコーツール',
      inputSchema: echoToolSchema,
      handler: echoToolHandler,
    });
  }).not.toThrow();
});

test('サーバーにリソースを追加できる', () => {
  const server = createMcpServer(testServerConfig);
  
  // リソースのハンドラー関数
  const infoResourceHandler = async (uri: string) => {
    const response: ResourceResponse = {
      content: {
        name: testServerConfig.name,
        version: testServerConfig.version,
        timestamp: new Date().toISOString(),
      }
    };
    return success(response);
  };
  
  // リソースを追加
  expect(() => {
    server.addResource('test://info', {
      description: 'サーバー情報を提供するリソース',
      handler: infoResourceHandler,
    });
  }).not.toThrow();
});

test('サーバーにプロンプトを追加できる', () => {
  const server = createMcpServer(testServerConfig);
  
  // プロンプトのパラメータスキーマ
  const greetingPromptSchema = z.object({
    name: z.string().describe('挨拶する相手の名前'),
    language: z.enum(['en', 'ja']).default('en').describe('挨拶の言語'),
  });
  
  // プロンプトを追加
  expect(() => {
    server.addPrompt('greeting', {
      description: '挨拶プロンプト',
      template: '{{#if (eq language "ja")}}こんにちは、{{name}}さん！{{else}}Hello, {{name}}!{{/if}}',
      paramSchema: greetingPromptSchema,
    });
  }).not.toThrow();
});

test('サーバーを実行できる', async () => {
  const server = createMcpServer(testServerConfig);
  
  // stdio トランスポートでの実行テスト
  // 注: 実際には接続処理はモック化されている
  const result = await server.run('stdio');
  
  expect(isSuccess(result)).toBe(true);
});