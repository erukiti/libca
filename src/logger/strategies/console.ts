/**
 * このファイルは、コンソール出力ストラテジーの責務を持ちます。
 * 主にブラウザ環境で使用されます。
 */

import type { LogLevel, LogStrategy } from "../types.ts";

/**
 * コンソール出力ストラテジー
 * ブラウザの標準consoleオブジェクトを使用してログを出力する
 */
export class ConsoleStrategy implements LogStrategy {
  /**
   * ログを出力する
   * @param level ログレベル
   * @param args ログの引数
   */
  log(level: LogLevel, ...args: unknown[]): void {
    // ブラウザ環境ではconsole[level]メソッドが存在する
    // @ts-ignore - ブラウザ環境で実行されることを想定
    if (typeof console[level] === "function") {
      // @ts-ignore - 動的アクセスは型で表現できないが実行時には存在する
      console[level](...args);
      return;
    }
    
    // フォールバック: レベルに対応するメソッドがない場合
    switch (level) {
      case "debug":
        console.log("[DEBUG]", ...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }
}

/**
 * コンソール出力ストラテジーのインスタンスを作成する
 * @returns コンソール出力ストラテジーのインスタンス
 */
export function createConsoleStrategy(): LogStrategy {
  return new ConsoleStrategy();
}