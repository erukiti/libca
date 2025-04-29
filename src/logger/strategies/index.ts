/**
 * このファイルは、ロガーストラテジーのエクスポートの責務を持ちます。
 */

export { createConsoleStrategy } from "./console.ts";
export { createStderrStrategy } from "./stderr.ts";
export { createJsonlStrategy } from "./jsonl.ts";

// 実行環境に適したデフォルトのストラテジーを提供
import { _detectEnvironment } from "../utils.ts";
import { createConsoleStrategy } from "./console.ts";
import { createStderrStrategy } from "./stderr.ts";

/**
 * 現在の実行環境に最適なデフォルトストラテジーを取得する
 * @returns 適切なロギングストラテジー
 */
export function _getDefaultStrategy() {
  const { isBrowser } = _detectEnvironment();
  
  if (isBrowser) {
    return createConsoleStrategy();
  }
  
  // Node.js/Bun環境ではstderrを使用
  return createStderrStrategy();
}