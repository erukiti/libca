/**
 * libca - 汎用ライブラリ集
 *
 * 単一責任の原則に従い、各モジュールが明確な責務を持つライブラリ集です。
 * インターフェースベースの設計で、将来的な実装の変更や拡張に対応します。
 */

// Resultモジュールのエクスポート
export * from "./result/index.ts";

// Loggerモジュールのエクスポート
export * from "./logger/index.ts";

// 使用例（本番環境ではコメントアウトまたは削除してください）
if (import.meta.main) {
  const { success, failure, isSuccess, unwrap, createSystemError } = await import("./result/index.ts");
  
  // 成功の例
  const successResult = success("Hello via Bun!");
  console.log("Success result:", successResult);
  console.log("Is success?", isSuccess(successResult));
  console.log("Value:", unwrap(successResult, "Default value"));
  
  // 失敗の例
  const errorInfo = createSystemError("Something went wrong");
  const failureResult = failure(errorInfo);
  console.log("Failure result:", failureResult);
  console.log("Is success?", isSuccess(failureResult));
  console.log("Value with fallback:", unwrap(failureResult, "Default value"));
}