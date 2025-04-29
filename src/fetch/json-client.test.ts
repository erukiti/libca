/**
 * このファイルは、JSONクライアントのテストを実装します。
 */

import { expect, test, describe, afterEach } from "bun:test";
import { JsonClient, createJsonClient } from "./json-client.ts";
import { isSuccess, isFailure } from "../result/utils.ts";
import { z } from "zod";

describe("JsonClient", () => {
  // 各テストの前後に実行される関数
  const originalFetch = global.fetch;
  
  afterEach(() => {
    // テスト後にglobalを元に戻す
    global.fetch = originalFetch;
  });
  
  test("should be created with default options", () => {
    const client = new JsonClient();
    expect(client).toBeDefined();
  });
  
  test("should be created using factory function", () => {
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(JsonClient);
  });
  
  test("should handle successful GET request with valid data", async () => {
    // 期待するレスポンスデータ
    const mockData = { id: 1, name: "Test User", age: 30 };
    
    // レスポンスをモック
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => mockData,
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => mockResponse;
    
    // テスト用のzodスキーマ
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      age: z.number(),
    });
    
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get(userSchema, "/users/1");
    
    expect(isSuccess(result)).toBe(true);
    
    if (isSuccess(result)) {
      // 型安全なアクセスができることを確認
      const user = result.value;
      expect(user.id).toBe(1);
      expect(user.name).toBe("Test User");
      expect(user.age).toBe(30);
    }
  });
  
  test("should handle validation error for invalid data", async () => {
    // スキーマと一致しないデータ
    const mockData = { id: "invalid-id", name: 123 }; // idは数値、nameは文字列であるべき
    
    // レスポンスをモック
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => mockData,
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => mockResponse;
    
    // 厳格なzodスキーマ
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      age: z.number(),
    });
    
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get(userSchema, "/users/1");
    
    // バリデーションエラーが発生することを確認
    expect(isFailure(result)).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.code).toBe("validation_error");
    }
  });
  
  test("should handle JSON parse error", async () => {
    // 不正なJSONをモック
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token in JSON");
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => mockResponse;
    
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
    });
    
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get(userSchema, "/users/1");
    
    // JSONパースエラーが発生することを確認
    expect(isFailure(result)).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.code).toBe("parse_error");
    }
  });
  
  test("should handle HTTP error", async () => {
    // エラーレスポンスをモック
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ error: "Server error" }),
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async () => mockResponse;
    
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
    });
    
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    
    const result = await client.get(userSchema, "/users/1");
    
    // HTTPエラーが発生することを確認
    expect(isFailure(result)).toBe(true);
    
    if (isFailure(result)) {
      const error = result.error;
      expect(error.type).toBe("fetch");
      expect(error.statusCode).toBe(500);
    }
  });
  
  test("should handle POST request with body", async () => {
    // レスポンスをモック
    const mockResponse = {
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ id: 123, name: "New User", created: true }),
      headers: new Headers({ "Content-Type": "application/json" }),
    };
    
    // リクエストの検証用
    let requestBody: Record<string, unknown> = {};
    
    // @ts-ignore - テスト用にfetchをモック
    global.fetch = async (url: string, options: RequestInit) => {
      // リクエストボディを保存
      if (options.body) {
        requestBody = JSON.parse(options.body as string);
      }
      return mockResponse;
    };
    
    const responseSchema = z.object({
      id: z.number(),
      name: z.string(),
      created: z.boolean(),
    });
    
    const client = createJsonClient({
      baseUrl: "https://api.example.com",
    });
    
    // POSTリクエストを送信
    const newUser = { name: "New User", email: "user@example.com" };
    const result = await client.post(responseSchema, "/users", newUser);
    
    // リクエストが正常に処理されたことを確認
    expect(isSuccess(result)).toBe(true);
    
    // リクエストボディが正しく送信されたことを確認
    expect(requestBody).toEqual(newUser);
    
    if (isSuccess(result)) {
      const createdUser = result.value;
      expect(createdUser.id).toBe(123);
      expect(createdUser.name).toBe("New User");
      expect(createdUser.created).toBe(true);
    }
  });
});