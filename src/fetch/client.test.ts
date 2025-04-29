/**
 * このファイルは、基本的なFetchクライアントのテストを実装します。
 */

import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { FetchClient, createFetchClient } from "./client.ts";
import { isSuccess, isFailure } from "../result/utils.ts";

describe("FetchClient", () => {
  // 各テストの前後に実行される関数
  const originalFetch = global.fetch;
  
  afterEach(() => {
    // テスト後にglobalを元に戻す
    global.fetch = originalFetch;
  });
  
  test("should be created with default options", () => {
    const client = new FetchClient();
    expect(client).toBeDefined();
  });
  
  test("should be created with custom options", () => {
    const client = new FetchClient({
      baseUrl: "https://api.example.com",
      headers: { "X-API-KEY": "test-key" },
      timeout: 5000,
    });
    expect(client).toBeDefined();
  });
  
  test("should be created using factory function", () => {
    const client = createFetchClient({
      baseUrl: "https://api.example.com",
    });
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(FetchClient);
  });
  
  test("should handle successful GET request", async () => {
    // globalのfetchをオーバーライド
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ id: 1, name: "Test" }),
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => mockResponse;
    
    const client = new FetchClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get("/users/1");
    
    expect(isSuccess(result)).toBe(true);
  });
  
  test("should handle error response", async () => {
    // エラーレスポンスをモック
    const errorResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "Not Found" }),
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => errorResponse;
    
    const client = new FetchClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get("/users/999");
    
    expect(isFailure(result)).toBe(true);
    
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
    
    const client = new FetchClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get("/users/1");
    
    expect(isFailure(result)).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.code).toBe("network_error");
    }
  });
});