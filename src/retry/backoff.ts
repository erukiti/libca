/**
 * このファイルは、リトライ時のバックオフ戦略を定義する責務を持ちます。
 * バックオフアルゴリズムは、リトライ間の待機時間を制御し、システムの安定性を向上させます。
 */

import type { BackoffOptions, BackoffFunction } from "./types.ts";

/**
 * 指定されたオプションからパラメータを抽出する関数
 * @param options バックオフオプション
 * @returns 正規化されたパラメータ
 */
const extractBackoffParams = (options?: BackoffOptions) => {
  const baseMs = options?.baseMs ?? 200;
  const maxMs = options?.maxMs ?? 8000;
  const jitterFactor = options?.jitterFactor ?? 0.2;
  
  return { baseMs, maxMs, jitterFactor };
};

/**
 * 指数関数的な遅延時間を計算する関数
 * @param baseMs ベース時間（ミリ秒）
 * @param attempt 試行回数
 * @returns 指数関数的な遅延時間（ミリ秒）
 */
const calculateExponentialDelay = (baseMs: number, attempt: number): number => {
  return baseMs * (2 ** (attempt - 1));
};

/**
 * ジッターを適用する関数
 * @param delay 基本的な遅延時間
 * @param jitterFactor ジッター係数（0～1）
 * @returns ジッターを適用した遅延時間
 */
const applyJitter = (delay: number, jitterFactor: number): number => {
  if (jitterFactor <= 0) return delay;
  
  const jitterAmount = delay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(delay + jitterAmount));
};

/**
 * 指定された時間だけ待機する関数
 * @param ms 待機時間（ミリ秒）
 * @returns 待機を表すPromise
 */
const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 指数バックオフを実装する関数（ジッター付き）
 *
 * @param options バックオフオプション
 * @returns 試行回数を受け取り、適切な待機時間を実現するPromiseを返す関数
 */
export const exponentialBackoffWithJitter = (options?: BackoffOptions): BackoffFunction => {
  const { baseMs, maxMs, jitterFactor } = extractBackoffParams(options);
  
  return async (attempt: number): Promise<void> => {
    const exponentialDelay = calculateExponentialDelay(baseMs, attempt);
    const clippedDelay = Math.min(exponentialDelay, maxMs);
    const finalDelay = applyJitter(clippedDelay, jitterFactor);
    
    await wait(finalDelay);
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
 * デフォルトのバックオフ関数を作成（ファクトリ関数）
 *
 * @param options バックオフオプション
 * @returns バックオフ関数
 */
export const createBackoff = (options?: BackoffOptions): BackoffFunction => {
  return exponentialBackoffWithJitter(options);
};