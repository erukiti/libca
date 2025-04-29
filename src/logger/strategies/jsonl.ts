/**
 * このファイルは、JSONL形式ログ出力ストラテジーの責務を持ちます。
 * JSONL (JSON Lines) 形式でログを出力し、各行は独立したJSONオブジェクトとなります。
 * 標準出力、標準エラー出力、またはファイルへの出力をサポートします。
 */

import * as fs from "node:fs";
import type { LogLevel, LogStrategy, JsonlStrategyOptions } from "../types.ts";
import { _getISOTimestamp, _limitObjectDepth } from "../utils.ts";

/**
 * JSONL形式出力ストラテジーを作成する
 * @param options ストラテジーオプション
 * @returns JSONL形式出力ストラテジー（dispose()メソッド付き）
 */
export function createJsonlStrategy(options: JsonlStrategyOptions): LogStrategy & { dispose?: () => void } {
  const destination = options.destination;
  
  const formatOptions = {
    includeTimestamp: options.formatOptions?.includeTimestamp ?? true,
    maxDepth: options.formatOptions?.maxDepth ?? 10,
    maxArrayLength: options.formatOptions?.maxArrayLength ?? 100,
  };
  
  let fileStream: fs.WriteStream | null = null;
  
  /**
   * ファイル出力ストリームを初期化する
   */
  const initFileStream = (): void => {
    try {
      fileStream = fs.createWriteStream(destination, { flags: "a" });
      
      // エラーハンドリング
      fileStream.on("error", (err) => {
        console.error(`[JSONL] ファイル書き込みエラー: ${err.message}`);
      });
    } catch (err) {
      console.error(`[JSONL] ファイルオープンエラー: ${String(err)}`);
    }
  };
  
  // ファイル出力の場合、ファイルストリームを開く
  if (destination !== "stdout" && destination !== "stderr") {
    initFileStream();
  }
  
  /**
   * ログの引数をフォーマットする
   * @param args ログ引数
   * @returns フォーマットされた引数
   */
  const formatArgs = (args: unknown[]): unknown => {
    // 深さを制限したオブジェクトのコピーを作成
    const processedArgs = args.map(arg =>
      _limitObjectDepth(arg, formatOptions.maxDepth)
    );
    
    // 単一の引数の場合はそのまま返す
    if (processedArgs.length === 1) {
      return processedArgs[0];
    }
    
    // 複数の引数の場合は配列として返す
    return processedArgs;
  };
  
  /**
   * ログエントリをフォーマットする
   * @param level ログレベル
   * @param args ログの引数
   * @returns フォーマットされたログエントリ
   */
  const formatLogEntry = (level: LogLevel, args: unknown[]): Record<string, unknown> => {
    const entry: Record<string, unknown> = {
      level,
      message: formatArgs(args),
    };
    
    if (formatOptions.includeTimestamp) {
      entry.timestamp = _getISOTimestamp();
    }
    
    return entry;
  };
  
  /**
   * 出力先にログを書き込む
   * @param jsonLine JSONLフォーマットのログ行
   */
  const writeOutput = (jsonLine: string): void => {
    try {
      if (destination === "stdout") {
        process.stdout.write(jsonLine);
      } else if (destination === "stderr") {
        process.stderr.write(jsonLine);
      } else if (fileStream) {
        fileStream.write(jsonLine);
      }
    } catch (err) {
      // エラーが発生した場合はstderrにフォールバック
      console.error(`[JSONL] 出力エラー: ${String(err)}`);
    }
  };
  
  return {
    /**
     * ログを出力する
     * @param level ログレベル
     * @param args ログの引数
     */
    log(level: LogLevel, ...args: unknown[]): void {
      const logEntry = formatLogEntry(level, args);
      const jsonLine = `${JSON.stringify(logEntry)}\n`;
      
      writeOutput(jsonLine);
    },
    
    /**
     * リソースを解放する
     */
    dispose(): void {
      if (fileStream) {
        fileStream.end();
        fileStream = null;
      }
    }
  };
}