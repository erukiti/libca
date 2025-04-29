/**
 * このファイルは、ロガーのコア機能の実装の責務を持ちます。
 */

import { LOG_LEVEL_PRIORITY } from "./types.ts";
import type { LogLevel, Logger, LogStrategy, LoggerOptions } from "./types.ts";
import { _getDefaultStrategy } from "./strategies/index.ts";

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
 * ロガーの実装を作成する
 * @private プライベートAPI
 * @param options ロガーオプション
 * @returns ロガーオブジェクト
 */
export function _createLoggerImpl(options: LoggerOptions): Logger {
  const strategy = options.strategy ?? _getDefaultStrategy();
  const minLevel = options.minLevel ?? "debug";
  const minLevelPriority = LOG_LEVEL_PRIORITY[minLevel];
  const context = options.defaultContext;

  /**
   * 指定されたログレベルでログを出力するか判断する
   * @param level ログレベル
   * @returns 出力する場合はtrue
   */
  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVEL_PRIORITY[level] >= minLevelPriority;
  };

  /**
   * 引数にコンテキストを追加する
   * @param args 元の引数
   * @returns コンテキスト付きの引数
   */
  const addContextToArgs = (...args: unknown[]): unknown[] => {
    if (!context) {
      return args;
    }
    return [`[${context}]`, ...args];
  };

  return {
    debug(...args: unknown[]): void {
      if (shouldLog("debug")) {
        strategy.log("debug", ...addContextToArgs(...args));
      }
    },
    
    info(...args: unknown[]): void {
      if (shouldLog("info")) {
        strategy.log("info", ...addContextToArgs(...args));
      }
    },
    
    warn(...args: unknown[]): void {
      if (shouldLog("warn")) {
        strategy.log("warn", ...addContextToArgs(...args));
      }
    },
    
    error(...args: unknown[]): void {
      if (shouldLog("error")) {
        strategy.log("error", ...addContextToArgs(...args));
      }
    },
    
    withContext(newContext: string): Logger {
      return _createLoggerImpl({
        strategy,
        minLevel: _getLogLevelFromPriority(minLevelPriority),
        defaultContext: newContext,
      });
    }
  };
}

// デフォルトロガーのキャッシュ
let defaultLogger: Logger | null = null;

/**
 * ロガーを作成する
 * @param options ロガーオプション
 * @returns ロガーインスタンス
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  // オプションが指定されていない場合はキャッシュされたデフォルトロガーを返す
  if (!options.strategy && !options.minLevel && !options.defaultContext && defaultLogger) {
    return defaultLogger;
  }
  
  const logger = _createLoggerImpl(options);
  
  // デフォルトロガーが未設定でオプションも指定されていない場合はキャッシュする
  if (!defaultLogger && !options.strategy && !options.minLevel && !options.defaultContext) {
    defaultLogger = logger;
  }
  
  return logger;
}