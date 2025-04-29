/**
 * 通常関数リトライのテスト
 */

import { describe, test, expect, jest } from "bun:test";
import { retry, retryAsync } from "./index.ts";

// 基本的なテスト
describe("通常関数リトライ - 基本機能", () => {
  test("成功する関数は正しく結果を返す", async () => {
    const fn = () => "success";
    const result = await retry(fn, { maxRetries: 3 });
    expect(result).toBe("success");
  });
  
  test("一時的に失敗する関数が最終的に成功する", async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return "success";
    };
    
    const result = await retry(fn, {
      maxRetries: 5,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });
  
  test("最大リトライ回数に達した場合に例外をスローする", async () => {
    const error = new Error("Test error");
    const fn = () => {
      throw error;
    };
    
    await expect(retry(fn, {
      maxRetries: 2,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    })).rejects.toThrow("Test error");
  });
});

// リトライ条件のテスト
describe("通常関数リトライ - リトライ条件", () => {
  test("リトライ条件に基づいて適切にリトライする", async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      throw new Error(`Attempt ${attempts}`);
    };
    
    // 最初の2回の失敗のみリトライする
    const retryCondition = (error: Error, attempt: number) => attempt <= 2;
    
    await expect(retry(fn, {
      maxRetries: 5,
      retryCondition,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    })).rejects.toThrow("Attempt 3");
    
    expect(attempts).toBe(3);
  });
});

// コールバックのテスト
describe("通常関数リトライ - コールバック", () => {
  test("onRetryコールバックが正しく呼ばれる", async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return "success";
    };
    
    const onRetry = jest.fn();
    
    const result = await retry(fn, {
      maxRetries: 5,
      onRetry,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result).toBe("success");
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
  });
});

// 非同期関数のテスト
describe("通常関数リトライ - 非同期関数", () => {
  test("retryAsyncが非同期関数を正しく処理する", async () => {
    let attempts = 0;
    const asyncFn = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error(`Async attempt ${attempts} failed`);
      }
      return "async success";
    };
    
    const result = await retryAsync(asyncFn, {
      maxRetries: 3,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result).toBe("async success");
    expect(attempts).toBe(2);
  });
});