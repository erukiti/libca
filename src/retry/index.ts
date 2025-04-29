/**
 * retry - リトライ・バックオフモジュール
 * 
 * このモジュールは、失敗した操作を設定可能なバックオフ戦略で再試行するための機能を提供します。
 * 通常の関数とResult型を返す関数の両方をサポートし、様々なリトライシナリオに対応します。
 *
 * private prefix: `_retry`
 */

// types.ts からのエクスポート
export type {
  RetryOptions,
  BackoffOptions,
  BackoffFunction,
  RetryCondition,
  RetryResultOptions,
} from "./types.ts";

// backoff.ts からのエクスポート
export {
  createBackoff,
  exponentialBackoffWithJitter,
  exponentialBackoff,
} from "./backoff.ts";

// retry.ts からのエクスポート
export {
  retry,
  retryAsync,
} from "./retry.ts";

// retry-result.ts からのエクスポート
export {
  retryResult,
} from "./retry-result.ts";

// 使用例（本番環境ではコメントアウトまたは削除してください）
if (import.meta.main) {
  const { success, failure, createSystemError } = await import("../result/index.ts");
  const { retry, retryAsync, retryResult } = await import("./index.ts");
  
  console.log("--- 通常関数のリトライデモ ---");
  let counter = 0;
  
  try {
    // 3回目で成功する関数
    const result = await retryAsync(
      async () => {
        counter++;
        console.log(`試行 ${counter}`);
        if (counter < 3) throw new Error(`一時的なエラー ${counter}`);
        return `成功: ${counter}回目`;
      },
      {
        maxRetries: 5,
        onRetry: (attempt, error) => console.log(`リトライ ${attempt}: ${error.message}`)
      }
    );
    
    console.log("結果:", result);
  } catch (error) {
    console.error("最終エラー:", error);
  }
  
  console.log("\n--- Result型のリトライデモ ---");
  counter = 0;
  
  // 3回目で成功するResult型関数
  const resultWithRetry = await retryResult(
    async () => {
      counter++;
      console.log(`試行 ${counter}`);
      
      if (counter < 3) {
        const error = createSystemError(`一時的なエラー ${counter}`);
        // recoverableをtrueに設定
        error.recoverable = true;
        return failure(error);
      }
      
      return success(`成功: ${counter}回目`);
    },
    {
      maxRetries: 5,
      onRetry: (attempt, error) => console.log(`リトライ ${attempt}: ${error.message}`)
    }
  );
  
  console.log("結果:", resultWithRetry);
}