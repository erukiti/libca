/**
 * Result型関数リトライのテスト
 */

import { describe, test, expect, jest } from "bun:test";
import { retryResult } from "./index.ts";
import { success, failure, type Result } from "../result/index.ts";
import { createSystemError } from "../result/error.ts";

type TestError = ReturnType<typeof createSystemError>;

// 成功ケースのテスト
describe("Result型リトライ - 成功ケース", () => {
  test("成功するResult型関数が正しく結果を返す", async () => {
    const fn = async (): Promise<Result<string, TestError>> => {
      return success("success");
    };
    
    const result = await retryResult(fn, { maxRetries: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe("success");
    }
  });
});

// 一時的な失敗からの回復テスト
describe("Result型リトライ - 一時的な失敗からの回復", () => {
  test("一時的に失敗するResult型関数が最終的に成功する", async () => {
    let attempts = 0;
    const fn = async (): Promise<Result<string, TestError>> => {
      attempts++;
      if (attempts < 3) {
        const error = createSystemError(`Attempt ${attempts} failed`);
        error.recoverable = true;
        return failure(error);
      }
      return success("success");
    };
    
    const result = await retryResult(fn, {
      maxRetries: 5,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe("success");
    }
    expect(attempts).toBe(3);
  });
});

// 回復可能なエラーフラグのテスト
describe("Result型リトライ - 回復可能フラグ", () => {
  test("recoverable=trueのエラーのみリトライする", async () => {
    let attempts = 0;
    const fn = async (): Promise<Result<string, TestError>> => {
      attempts++;
      const error = createSystemError(`Attempt ${attempts} failed`);
      // 最初の失敗は回復可能、2回目以降は回復不可能
      error.recoverable = attempts === 1;
      return failure(error);
    };
    
    const result = await retryResult(fn, {
      maxRetries: 5,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result.success).toBe(false);
    expect(attempts).toBe(2); // 回復不可能なエラーになった時点で停止
  });
});

// 最大リトライ回数のテスト
describe("Result型リトライ - 最大リトライ回数", () => {
  test("最大リトライ回数に達した場合に最後の失敗結果を返す", async () => {
    const fn = async (): Promise<Result<string, TestError>> => {
      const error = createSystemError("Recoverable error");
      error.recoverable = true;
      return failure(error);
    };
    
    const result = await retryResult(fn, {
      maxRetries: 2,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Recoverable error");
    }
  });
});

// カスタムリトライ条件のテスト
describe("Result型リトライ - カスタムリトライ条件", () => {
  test("カスタムretryConditionが正しく動作する", async () => {
    let attempts = 0;
    const fn = async (): Promise<Result<string, TestError>> => {
      attempts++;
      const error = createSystemError(`Attempt ${attempts} failed`);
      error.recoverable = true;
      return failure(error);
    };
    
    // 最初の2回の失敗のみリトライする
    const retryCondition = (error: TestError, attempt: number) => attempt <= 2;
    
    const result = await retryResult(fn, {
      maxRetries: 5,
      retryCondition,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result.success).toBe(false);
    expect(attempts).toBe(3); // 条件に合わせて3回試行
  });
});

// コールバックのテスト
describe("Result型リトライ - コールバック", () => {
  test("onRetryコールバックが正しく呼ばれる", async () => {
    let attempts = 0;
    const fn = async (): Promise<Result<string, TestError>> => {
      attempts++;
      if (attempts < 3) {
        const error = createSystemError(`Attempt ${attempts} failed`);
        error.recoverable = true;
        return failure(error);
      }
      return success("success");
    };
    
    const onRetry = jest.fn();
    
    const result = await retryResult(fn, {
      maxRetries: 5,
      onRetry,
      backoff: async () => {} // テストを高速化するためにバックオフをスキップ
    });
    
    expect(result.success).toBe(true);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});