/**
 * このファイルは、ストリーミング機能のテストを実装します。
 */

import { expect, test, describe, afterEach } from "bun:test";
import {
  createStreamConfig,
  streamRequest,
  parseSSE,
} from "./streaming.ts";
import { isSuccess, isFailure } from "../result/utils.ts";

describe("Streaming Functions", () => {
  // 各テストの前後に実行される関数
  const originalFetch = global.fetch;
  
  afterEach(() => {
    // テスト後にglobalを元に戻す
    global.fetch = originalFetch;
  });
  
  test("should create config with default options", () => {
    const config = createStreamConfig();
    expect(config).toBeDefined();
    expect(config.headers).toEqual({
      "Accept": "text/event-stream",
    });
  });
  
  test("should create config with custom options", () => {
    const config = createStreamConfig({
      baseUrl: "https://api.example.com",
      headers: { "X-API-KEY": "test-key" },
    });
    expect(config).toBeDefined();
    expect(config.baseUrl).toBe("https://api.example.com");
    expect(config.headers).toEqual({
      "Accept": "text/event-stream",
      "X-API-KEY": "test-key"
    });
  });
  
  test("parseSSE should correctly parse SSE data", () => {
    const sseData = "event: update\nid: 123\ndata: {\"value\": 42}\n\n";
    const parsed = parseSSE(sseData);
    
    expect(parsed.event).toBe("update");
    expect(parsed.id).toBe("123");
    expect(parsed.data).toBe("{\"value\": 42}");
  });
  
  test("parseSSE should handle multiline data", () => {
    const sseData = "event: message\ndata: line 1\ndata: line 2\ndata: line 3\n\n";
    const parsed = parseSSE(sseData);
    
    expect(parsed.event).toBe("message");
    expect(parsed.data).toBe("line 1\nline 2\nline 3");
  });
  
  test("parseSSE should handle retry field", () => {
    const sseData = "retry: 5000\ndata: reconnect in 5 seconds\n\n";
    const parsed = parseSSE(sseData);
    
    expect(parsed.retry).toBe(5000);
    expect(parsed.data).toBe("reconnect in 5 seconds");
  });
  
  test("should handle streaming error", async () => {
    // エラーレスポンスをモック
    const errorResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "Stream not found" }),
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => errorResponse;
    
    const config = createStreamConfig({
      baseUrl: "https://api.example.com",
    });
    
    // エラーハンドラをモック
    let errorCalled = false;
    let errorInfo: unknown;
    
    const result = await streamRequest(config, "/events", {
      onError: (error) => {
        errorCalled = true;
        errorInfo = error;
      },
    });
    
    // ストリーミング開始がエラーになることを確認
    expect(isFailure(result)).toBe(true);
    
    // エラーハンドラが呼ばれたことを確認
    expect(errorCalled).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.statusCode).toBe(404);
    }
  });
  
  test("should handle network error", async () => {
    // ネットワークエラーをモック
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => {
      throw new Error("Network error");
    };
    
    const config = createStreamConfig({
      baseUrl: "https://api.example.com",
    });
    
    // エラーハンドラをモック
    let errorCalled = false;
    
    const result = await streamRequest(config, "/events", {
      onError: () => {
        errorCalled = true;
      },
    });
    
    // ストリーミング開始がエラーになることを確認
    expect(isFailure(result)).toBe(true);
    
    // エラーハンドラが呼ばれたことを確認
    expect(errorCalled).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.code).toBe("network_error");
    }
  });
  
  // Note: 実際のストリーミングデータのチャンク処理のテストは、
  // ReadableStreamのモックが複雑なため、ここでは省略しています。
  // 実際のプロジェクトでは、より詳細なテストケースを追加することをお勧めします。
});
