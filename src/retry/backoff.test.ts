/**
 * バックオフ関数のテスト
 */

import { describe, test, expect } from "bun:test";
import {
  exponentialBackoffWithJitter,
  exponentialBackoff,
  createBackoff,
  type BackoffOptions,
} from "./index.ts";

// ジッター付きバックオフのテスト
describe("バックオフ関数 - ジッター付き", () => {
  test("exponentialBackoffWithJitter は指定した範囲内の待機時間を生成する", async () => {
    const options: BackoffOptions = {
      baseMs: 100,
      maxMs: 1000,
      jitterFactor: 0.2,
    };

    const backoff = exponentialBackoffWithJitter(options);
    
    // 1回目の試行: 100ms * (2^0) = 100ms、ジッター±20%で 80-120ms の範囲
    const start1 = Date.now();
    await backoff(1);
    const elapsed1 = Date.now() - start1;
    expect(elapsed1).toBeGreaterThanOrEqual(80);
    expect(elapsed1).toBeLessThanOrEqual(120);
    
    // 2回目の試行: 100ms * (2^1) = 200ms、ジッター±20%で 160-240ms の範囲
    const start2 = Date.now();
    await backoff(2);
    const elapsed2 = Date.now() - start2;
    expect(elapsed2).toBeGreaterThanOrEqual(160);
    expect(elapsed2).toBeLessThanOrEqual(240);
  });
});

// 通常バックオフとユーティリティ関数のテスト
describe("バックオフ関数 - 基本機能", () => {
  test("exponentialBackoff はジッターなしで指数関数的に待機時間を増加させる", async () => {
    const backoff = exponentialBackoff(100);
    
    // 1回目の試行: 100ms * (2^0) = 100ms
    const start1 = Date.now();
    await backoff(1);
    const elapsed1 = Date.now() - start1;
    expect(elapsed1).toBeGreaterThanOrEqual(95);
    expect(elapsed1).toBeLessThanOrEqual(110);
  });
  
  test("createBackoff はデフォルトオプションで指数バックオフを作成する", () => {
    const backoff = createBackoff();
    expect(backoff).toBeFunction();
  });
});