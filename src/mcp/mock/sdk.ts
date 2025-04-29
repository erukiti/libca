/**
 * このファイルは、MCPのSDKのモック実装の責務を持ちます。
 * 開発・テスト用のモックSDK実装を提供します。
 */

import type {
  McpServer as SdkServerType,
  StdioServerTransport as StdioTransportType,
  SseServerTransport as SseTransportType,
  Schema,
  Middleware,
  ToolRequest as SdkToolRequest
} from '../types/sdk';

/**
 * モックSDKサーバー実装
 */
export class MockSdkServer implements SdkServerType {
  readonly config: { name: string; version: string; description?: string };

  constructor(config: { name: string; version: string; description?: string }) {
    this.config = config;
  }

  tool(
    name: string,
    definition: { description: string; input_schema: Schema },
    handler: (request: SdkToolRequest) => Promise<unknown>
  ): void {
    // 実装は省略
  }

  resource(
    uri: string,
    definition: { description: string },
    handler: () => Promise<unknown>
  ): void {
    // 実装は省略
  }

  prompt(
    name: string,
    definition: { description: string; template: string; param_schema?: Schema }
  ): void {
    // 実装は省略
  }

  use(middleware: Middleware): void {
    // 実装は省略
  }

  connect(transport: StdioTransportType | SseTransportType): void {
    // 実装は省略
  }
}

/**
 * モックstdioトランスポート実装
 */
export class MockStdioTransport implements StdioTransportType {
  readonly type = 'stdio';
}

/**
 * モックSSEトランスポート実装
 */
export class MockSseTransport implements SseTransportType {
  readonly type = 'sse';
}