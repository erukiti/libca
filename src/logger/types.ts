/**
 * このファイルは、ロガーモジュールの型定義の責務を持ちます。
 */

/**
 * ログレベルを表す型
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ログ出力の優先順位
 * 数値が大きいほど優先度が高い
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * ログ出力戦略のインターフェース
 */
export interface LogStrategy {
  /**
   * ログを出力する
   * @param level ログレベル
   * @param args 出力する内容（可変長引数）
   */
  log(level: LogLevel, ...args: unknown[]): void;
}

/**
 * ロガーのインターフェース
 */
export interface Logger {
  /**
   * デバッグログを出力する
   * @param args 出力する内容（可変長引数）
   */
  debug(...args: unknown[]): void;

  /**
   * 情報ログを出力する
   * @param args 出力する内容（可変長引数）
   */
  info(...args: unknown[]): void;

  /**
   * 警告ログを出力する
   * @param args 出力する内容（可変長引数）
   */
  warn(...args: unknown[]): void;

  /**
   * エラーログを出力する
   * @param args 出力する内容（可変長引数）
   */
  error(...args: unknown[]): void;

  /**
   * コンテキスト付きの新しいロガーを作成する
   * @param context コンテキスト名
   * @returns 新しいロガーインスタンス
   */
  withContext(context: string): Logger;
}

/**
 * ロガー作成のオプション
 */
export interface LoggerOptions {
  /**
   * ログ出力戦略
   */
  strategy?: LogStrategy;

  /**
   * 最小ログレベル（これ未満のログは出力されない）
   */
  minLevel?: LogLevel;

  /**
   * デフォルトのコンテキスト名
   */
  defaultContext?: string;
}

/**
 * JSONL形式出力戦略のオプション
 */
export interface JsonlStrategyOptions {
  /**
   * 出力先
   * - 'stdout': 標準出力
   * - 'stderr': 標準エラー出力
   * - string: ファイルパス
   */
  destination: 'stdout' | 'stderr' | string;

  /**
   * フォーマット関連のオプション
   */
  formatOptions?: {
    /**
     * タイムスタンプを含めるかどうか
     */
    includeTimestamp?: boolean;

    /**
     * オブジェクトの最大ネスト深度
     */
    maxDepth?: number;

    /**
     * 配列の最大出力要素数
     */
    maxArrayLength?: number;
  };
}