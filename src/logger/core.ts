/**
 * このファイルは、ロガーのコア機能の実装の責務を持ちます。
 */

import { LOG_LEVEL_PRIORITY } from "./types.ts";
import type { LogLevel, Logger, LogStrategy, LoggerOptions } from "./types.ts";
import { _getDefaultStrategy } from "./strategies/index.ts";

/**
 * ロガーの具象クラス
 * @private プライベートAPI
 */
export class _LoggerImpl implements Logger {
  private readonly _strategy: LogStrategy;
  private readonly _minLevelPriority: number;
  private readonly _context?: string;

  /**
   * ロガーを初期化する
   * @param options ロガーオプション
   */
  constructor(options: LoggerOptions) {
    this._strategy = options.strategy ?? _getDefaultStrategy();
    const minLevel = options.minLevel ?? "debug";
    this._minLevelPriority = LOG_LEVEL_PRIORITY[minLevel];
    this._context = options.defaultContext;
  }

  /**
   * 指定されたログレベルでログを出力するか判断する
   * @param level ログレベル
   * @returns 出力する場合はtrue
   */
  private _shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= this._minLevelPriority;
  }

  /**
   * 引数にコンテキストを追加する
   * @param args 元の引数
   * @returns コンテキスト付きの引数
   */
  private _addContextToArgs(...args: unknown[]): unknown[] {
    if (!this._context) {
      return args;
    }
    return [`[${this._context}]`, ...args];
  }

  /**
   * デバッグログを出力する
   * @param args ログの引数
   */
  debug(...args: unknown[]): void {
    if (this._shouldLog("debug")) {
      this._strategy.log("debug", ...this._addContextToArgs(...args));
    }
  }

  /**
   * 情報ログを出力する
   * @param args ログの引数
   */
  info(...args: unknown[]): void {
    if (this._shouldLog("info")) {
      this._strategy.log("info", ...this._addContextToArgs(...args));
    }
  }

  /**
   * 警告ログを出力する
   * @param args ログの引数
   */
  warn(...args: unknown[]): void {
    if (this._shouldLog("warn")) {
      this._strategy.log("warn", ...this._addContextToArgs(...args));
    }
  }

  /**
   * エラーログを出力する
   * @param args ログの引数
   */
  error(...args: unknown[]): void {
    if (this._shouldLog("error")) {
      this._strategy.log("error", ...this._addContextToArgs(...args));
    }
  }

  /**
   * 新しいコンテキスト付きロガーを作成する
   * @param context コンテキスト名
   * @returns 新しいロガーインスタンス
   */
  withContext(context: string): Logger {
    return new _LoggerImpl({
      strategy: this._strategy,
      minLevel: _getLogLevelFromPriority(this._minLevelPriority),
      defaultContext: context,
    });
  }
}

/**
 * 優先度からログレベルを取得する
 * @param priority ログレベル優先度
 * @returns ログレベル
 */
function _getLogLevelFromPriority(priority: number): LogLevel {
  for (const [level, levelPriority] of Object.entries(LOG_LEVEL_PRIORITY)) {
    if (levelPriority === priority) {
      return level as LogLevel;
    }
  }
  return "debug"; // デフォルト値
}


/**
 * ロガーファクトリー
 * @returns ロガーを作成する関数
 */
export function createLoggerFactory() {
  let defaultLogger: Logger | null = null;

  /**
   * ロガーを作成する
   * @param options ロガーオプション
   * @returns ロガーインスタンス
   */
  return function createLogger(options: LoggerOptions = {}): Logger {
    if (!options.strategy && !options.minLevel && !options.defaultContext && defaultLogger) {
      return defaultLogger;
    }
    
    const logger = new _LoggerImpl(options);
    
    if (!defaultLogger && !options.strategy && !options.minLevel && !options.defaultContext) {
      defaultLogger = logger;
    }
    
    return logger;
  };
}