/**
 * このファイルは、基本的なFetch関数のテストを実装します。
 */

import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import {
  createFetchConfig,
  fetchGet,
  fetchPost,
} from "./client.ts";
import { isSuccess, isFailure } from "../result/utils.ts";

describe("Fetch Functions", () => {
  // 各テストの前後に実行される関数
  const originalFetch = global.fetch;
  
  afterEach(() => {
    // テスト後にglobalを元に戻す
    global.fetch = originalFetch;
  });
  
  test("should create config with default options", () => {
    const config = createFetchConfig();
    expect(config).toBeDefined();
    expect(config.headers).toEqual({});
  });
  
  test("should create config with custom options", () => {
    const config = createFetchConfig({
      baseUrl: "https://api.example.com",
      headers: { "X-API-KEY": "test-key" },
      timeout: 5000,
    });
    expect(config).toBeDefined();
    expect(config.baseUrl).toBe("https://api.example.com");
    expect(config.headers).toEqual({ "X-API-KEY": "test-key" });
    expect(config.timeout).toBe(5000);
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
    
    const config = createFetchConfig({
      baseUrl: "https://api.example.com",
    });
    
    const result = await fetchGet(config, "/users/1");
    
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
    
    const config = createFetchConfig({
      baseUrl: "https://api.example.com",
    });
    
    const result = await fetchGet(config, "/users/999");
    
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
    
    const config = createFetchConfig({
      baseUrl: "https://api.example.com",
    });
    
    const result = await fetchGet(config, "/users/1");
    
    expect(isFailure(result)).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.code).toBe("network_error");
    }
  });
});
