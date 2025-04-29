/**
 * このファイルは、標準エラー出力ストラテジーの責務を持ちます。
 * 主にNode.js/Bun環境で使用され、stdout汚染を避けるためにstderrにのみ出力します。
 */

import type { LogLevel, LogStrategy } from "../types.ts";

/**
 * ログレベルに対応する色
 */
const LEVEL_COLORS = {
  debug: "\x1b[36m", // シアン
  info: "\x1b[32m",  // 緑
  warn: "\x1b[33m",  // 黄
  error: "\x1b[31m", // 赤
} as const;

/**
 * 色のリセットコード
 */
const RESET_COLOR = "\x1b[0m";

/**
 * 標準エラー出力ストラテジーを作成する
 * @param useColors 色を使用するかどうか
 * @returns 標準エラー出力ストラテジー
 */
export function createStderrStrategy(useColors = true): LogStrategy {
  /**
   * ログレベルを整形する
   * @param level ログレベル
   * @returns 整形されたログレベル文字列
   */
  const formatLevel = (level: LogLevel): string => {
    const upperLevel = level.toUpperCase().padEnd(5);
    
    if (!useColors) {
      return `[${upperLevel}]`;
    }
    
    const color = LEVEL_COLORS[level];
    return `${color}[${upperLevel}]${RESET_COLOR}`;
  };

  return {
    /**
     * ログを出力する
     * @param level ログレベル
     * @param args ログの引数
     */
    log(level: LogLevel, ...args: unknown[]): void {
      const levelTag = formatLevel(level);
      // 標準エラー出力にのみ出力し、標準出力を汚染しない
      console.error(levelTag, ...args);
    }
  };
}