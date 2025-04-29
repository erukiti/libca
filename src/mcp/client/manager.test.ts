/**
 * MCPクライアントマネージャーの単体テスト
 */

import { test, expect, beforeEach } from 'bun:test';
import { createMcpClient } from './manager';
import { isSuccess } from '../../result';

// テスト用のクライアント設定
const testClientConfig = {
  serverName: 'test-server',
  timeout: 1000,
};

test('MCPクライアントが正しく作成される', () => {
  const client = createMcpClient(testClientConfig);
  
  expect(client).toBeDefined();
  expect(typeof client.connect).toBe('function');
  expect(typeof client.disconnect).toBe('function');
  expect(typeof client.callTool).toBe('function');
  expect(typeof client.accessResource).toBe('function');
  expect(typeof client.getConnectionInfo).toBe('function');
});

test('文字列からMCPクライアントを作成できる', () => {
  const client = createMcpClient('simple-server');
  
  expect(client).toBeDefined();
  expect(client.getConnectionInfo().serverName).toBe('simple-server');
});

test('クライアントは接続情報を提供する', () => {
  const client = createMcpClient(testClientConfig);
  const info = client.getConnectionInfo();
  
  expect(info).toBeDefined();
  expect(info.serverName).toBe(testClientConfig.serverName);
  expect(info.status).toBe('disconnected'); // 初期状態は未接続
  expect(Array.isArray(info.availableTools)).toBe(true);
  expect(Array.isArray(info.availableResources)).toBe(true);
});

test('クライアントは接続と切断ができる', async () => {
  const client = createMcpClient(testClientConfig);
  
  // 初期状態を確認
  expect(client.getConnectionInfo().status).toBe('disconnected');
  
  // 接続を試みる
  const connectResult = await client.connect();
  expect(isSuccess(connectResult)).toBe(true);
  expect(client.getConnectionInfo().status).toBe('connected');
  
  // 利用可能なツールとリソースを確認
  const toolsResult = await client.getAvailableTools();
  expect(isSuccess(toolsResult)).toBe(true);
  if (isSuccess(toolsResult)) {
    expect(Array.isArray(toolsResult.value)).toBe(true);
  }
  
  const resourcesResult = await client.getAvailableResources();
  expect(isSuccess(resourcesResult)).toBe(true);
  if (isSuccess(resourcesResult)) {
    expect(Array.isArray(resourcesResult.value)).toBe(true);
  }
  
  // 切断を試みる
  const disconnectResult = await client.disconnect();
  expect(isSuccess(disconnectResult)).toBe(true);
  expect(client.getConnectionInfo().status).toBe('disconnected');
});

test('クライアントはツールを呼び出せる', async () => {
  const client = createMcpClient(testClientConfig);
  
  // 先に接続する
  await client.connect();
  
  // モックツールの呼び出し
  const echoResult = await client.callTool('echo', { message: 'Hello, MCP!' });
  
  // モック実装では常に成功する
  expect(isSuccess(echoResult)).toBe(true);
  
  // 切断
  await client.disconnect();
});

test('クライアントはリソースにアクセスできる', async () => {
  const client = createMcpClient(testClientConfig);
  
  // 先に接続する
  await client.connect();
  
  // モックリソースへのアクセス
  const uri = `${testClientConfig.serverName}://info`;
  const resourceResult = await client.accessResource(uri);
  
  // モック実装では常に成功する
  expect(isSuccess(resourceResult)).toBe(true);
  
  // 切断
  await client.disconnect();
});