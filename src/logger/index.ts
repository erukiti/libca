/**
 * logger - ロガーモジュール
 * 
 * このモジュールは、拡張性のあるログ出力機能を提供します。
 * 様々な出力戦略（コンソール、標準エラー、JSONL形式）をサポートし、
 * 実行環境（ブラウザ/Node.js/Bun）に応じた最適なデフォルト戦略を自動選択します。
 * MCPサーバーとの互換性を考慮し、stdout汚染を避ける設計になっています。
 *
 * private prefix: `_logger`
 */

// 型定義のエクスポート
export type {
  LogLevel,
  LogStrategy,
  Logger,
  LoggerOptions,
  JsonlStrategyOptions,
} from "./types.ts";

// ロガー作成関数
import { createLoggerFactory } from "./core.ts";
import { _getDefaultStrategy } from "./strategies/index.ts";

// 戦略のエクスポート
export {
  createConsoleStrategy,
  createStderrStrategy,
  createJsonlStrategy,
} from "./strategies/index.ts";

/**
 * ロガーを作成する関数
 * 
 * @example
 * ```ts
 * // デフォルトロガーを作成
 * const logger = createLogger();
 * logger.info("アプリケーションが起動しました");
 * 
 * // コンテキスト付きロガーを作成
 * const dbLogger = logger.withContext("Database");
 * dbLogger.info("接続が確立されました");
 * 
 * // カスタムストラテジーを使用
 * const fileLogger = createLogger({
 *   strategy: createJsonlStrategy({ destination: "app.log" }),
 *   minLevel: "info"
 * });
 * ```
 * 
 * @param options ロガーオプション
 * @returns ロガーインスタンス
 */
export const createLogger = createLoggerFactory();

// デフォルトロガーのエクスポート
export const logger = createLogger();