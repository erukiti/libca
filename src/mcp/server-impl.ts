/**
 * このファイルは、MCPサーバーの実装クラスの責務を持ちます。
 */

import type { 
  McpServer as SdkServer,
  StdioServerTransport,
  SseServerTransport,
  Schema,
  Middleware,
  MiddlewareRequest
} from './types/sdk';
import type { McpServer, McpServerConfig, ToolDefinition, ResourceDefinition, PromptDefinition, McpErrorInfo } from './types';
import type { Result } from '../result';
import { success, failure } from '../result';
import { logger } from '../logger';
import { MockSdkServer, MockStdioTransport, MockSseTransport } from './mock/sdk';
import { convertZodSchemaToJsonSchema } from './utils/schema-converter';
import { createToolHandler } from './handlers/tool-handler';
import { createResourceHandler } from './handlers/resource-handler';
import { createSdkPromptDefinition } from './handlers/prompt-handler';

// MCPサーバーのプライベートプレフィックス
const _mcpPrefix = '_mcp';

// MCPサーバーのコンテキスト付きロガー
const _mcpLogger = logger.withContext('MCP');

/**
 * MCPサーバー実装クラス
 */
export class McpServerImpl implements McpServer {
  /**
   * @modelcontextprotocol/sdk のサーバーインスタンス
   */
  private readonly _sdkServer: SdkServer;

  /**
   * サーバー設定
   */
  private readonly _config: McpServerConfig;

  /**
   * サーバーが実行中かどうか
   */
  private _isRunning = false;

  /**
   * コンストラクタ
   * @param config サーバー設定
   */
  constructor(config: McpServerConfig) {
    this._config = config;
    
    // 実際には @modelcontextprotocol/sdk の McpServer を使用する
    // this._sdkServer = new ActualSdkServer({
    this._sdkServer = new MockSdkServer({
      name: config.name,
      version: config.version,
      description: config.description,
    });

    _mcpLogger.info(`サーバー作成: ${config.name} v${config.version}`);
  }

  /**
   * ツールを追加する
   * @param name ツール名
   * @param definition ツール定義
   */
  addTool(name: string, definition: ToolDefinition): void {
    _mcpLogger.debug(`ツール追加: ${name}`);

    try {
      // Zodスキーマをスキーマに変換
      const schema = convertZodSchemaToJsonSchema(definition.inputSchema.shape);
      
      // ツールハンドラーを作成
      const handler = createToolHandler(name, definition);

      // SDKサーバーにツールを登録
      this._sdkServer.tool(
        name,
        {
          description: definition.description,
          input_schema: schema,
        },
        handler
      );
    } catch (error) {
      _mcpLogger.error(`ツール追加エラー: ${name}`, error);
    }
  }

  /**
   * リソースを追加する
   * @param uri リソースURI
   * @param definition リソース定義
   */
  addResource(uri: string, definition: ResourceDefinition): void {
    _mcpLogger.debug(`リソース追加: ${uri}`);

    try {
      // リソースハンドラーを作成
      const handler = createResourceHandler(uri, definition);

      // SDKサーバーにリソースを登録
      this._sdkServer.resource(
        uri,
        {
          description: definition.description,
        },
        handler
      );
    } catch (error) {
      _mcpLogger.error(`リソース追加エラー: ${uri}`, error);
    }
  }

  /**
   * プロンプトを追加する
   * @param name プロンプト名
   * @param definition プロンプト定義
   */
  addPrompt(name: string, definition: PromptDefinition): void {
    _mcpLogger.debug(`プロンプト追加: ${name}`);

    try {
      // プロンプト定義を作成
      const promptDefinition = createSdkPromptDefinition(name, definition);

      // SDKサーバーにプロンプトを登録
      this._sdkServer.prompt(name, promptDefinition);
    } catch (error) {
      _mcpLogger.error(`プロンプト追加エラー: ${name}`, error);
    }
  }

  /**
   * サーバーを実行する
   * @param transport トランスポートタイプ
   * @returns Result<void, McpErrorInfo>
   */
  async run(transport: 'stdio' | 'sse'): Promise<Result<void, McpErrorInfo>> {
    return this._runWithTransport(transport);
  }

  /**
   * 指定されたトランスポートでサーバーを実行する
   * @param transportType トランスポートタイプ
   * @returns Result<void, McpErrorInfo>
   */
  private async _runWithTransport(transportType: 'stdio' | 'sse'): Promise<Result<void, McpErrorInfo>> {
    if (this._isRunning) {
      _mcpLogger.warn('サーバーは既に実行中です');
      return success(undefined);
    }

    try {
      _mcpLogger.info(`サーバー起動: ${this._config.name} (${transportType})`);

      // トランスポートの作成
      const serverTransport = this._createTransport(transportType);
      if (!serverTransport.success) {
        return serverTransport;
      }

      // エラーハンドリングミドルウェアの設定
      this._setupErrorHandlingMiddleware();

      // サーバー接続
      this._sdkServer.connect(serverTransport.value);
      this._isRunning = true;

      _mcpLogger.info(`サーバー開始: ${this._config.name}`);
      return success(undefined);
    } catch (error) {
      _mcpLogger.error('サーバー起動エラー', error);
      return failure({
        type: 'mcp',
        kind: 'execution',
        message: error instanceof Error ? error.message : '不明なエラー',
        cause: error instanceof Error ? error : undefined,
        recoverable: false,
      });
    }
  }

  /**
   * トランスポートを作成する
   * @param transportType トランスポートタイプ
   * @returns トランスポートのResult
   */
  private _createTransport(transportType: 'stdio' | 'sse'): 
    Result<StdioServerTransport | SseServerTransport, McpErrorInfo> {
    
    if (transportType === 'stdio') {
      return success(new MockStdioTransport());
    }
    
    if (transportType === 'sse') {
      return success(new MockSseTransport());
    }
    
    // 未対応のトランスポートタイプ
    return failure({
      type: 'mcp',
      kind: 'validation',
      message: `未対応のトランスポートタイプです: ${transportType}`,
      recoverable: false,
    });
  }

  /**
   * エラーハンドリングミドルウェアをセットアップする
   */
  private _setupErrorHandlingMiddleware(): void {
    const errorHandlerMiddleware: Middleware = async (
      request: MiddlewareRequest,
      next: (request: MiddlewareRequest) => Promise<unknown>
    ) => {
      try {
        return await next(request);
      } catch (error) {
        _mcpLogger.error('MCPサーバーエラー', error);
        throw error;
      }
    };

    this._sdkServer.use(errorHandlerMiddleware);
  }
}