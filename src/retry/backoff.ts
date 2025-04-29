/**
 * このファイルは、リトライ時のバックオフ戦略を定義します。
 */

import type { BackoffOptions, BackoffFunction } from "./types.ts";

/**
 * 指数バックオフを実装する関数（ジッター付き）
 *
 * @param options バックオフオプション
 * @returns 試行回数を受け取り、適切な待機時間を実現するPromiseを返す関数
 */
export const exponentialBackoffWithJitter = (options?: BackoffOptions): BackoffFunction => {
  const baseMs = options?.baseMs ?? 200;
  const maxMs = options?.maxMs ?? 8000;
  const jitterFactor = options?.jitterFactor ?? 0.2;
  
  return async (attempt: number): Promise<void> => {
    // 指数関数的に待機時間を増加させる（2のべき乗）
    const exponentialDelay = baseMs * (2 ** (attempt - 1));
    
    // 最大待機時間でクリップ
    const clippedDelay = Math.min(exponentialDelay, maxMs);
    
    // ジッターを追加（±jitterFactor%）
    const jitter = clippedDelay * jitterFactor * (Math.random() * 2 - 1);
    const finalDelay = Math.max(0, Math.floor(clippedDelay + jitter));
    
    // 待機処理
    await new Promise((resolve) => setTimeout(resolve, finalDelay));
  };
};

/**
 * 指数バックオフを実装する関数（ジッターなし）
 *
 * @param baseMs ベースとなるミリ秒（デフォルト: 200ms）
 * @returns 試行回数を受け取り、適切な待機時間を実現するPromiseを返す関数
 */
export const exponentialBackoff = (baseMs = 200): BackoffFunction => {
  return exponentialBackoffWithJitter({ baseMs, jitterFactor: 0 });
};

/**
 * バックオフ関数を作成
 *
 * @param options バックオフオプション
 * @returns バックオフ関数
 */
export const createBackoff = (options?: BackoffOptions): BackoffFunction => {
  return exponentialBackoffWithJitter(options);
};