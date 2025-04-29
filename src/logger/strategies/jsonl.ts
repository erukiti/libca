/**
 * このファイルは、JSONL形式ログ出力ストラテジーの責務を持ちます。
 * JSONL (JSON Lines) 形式でログを出力し、各行は独立したJSONオブジェクトとなります。
 * 標準出力、標準エラー出力、またはファイルへの出力をサポートします。
 */

import * as fs from "node:fs";
import type { LogLevel, LogStrategy, JsonlStrategyOptions } from "../types.ts";
import { _getISOTimestamp, _limitObjectDepth } from "../utils.ts";

/**
 * JSONL形式出力ストラテジー
 */
export class JsonlStrategy implements LogStrategy {
  private readonly _destination: "stdout" | "stderr" | string;
  private readonly _formatOptions: Required<NonNullable<JsonlStrategyOptions["formatOptions"]>>;
  private _fileStream: fs.WriteStream | null = null;

  /**
   * JSONL形式出力ストラテジーを初期化する
   * @param options ストラテジーオプション
   */
  constructor(options: JsonlStrategyOptions) {
    this._destination = options.destination;
    
    this._formatOptions = {
      includeTimestamp: options.formatOptions?.includeTimestamp ?? true,
      maxDepth: options.formatOptions?.maxDepth ?? 10,
      maxArrayLength: options.formatOptions?.maxArrayLength ?? 100,
    };
    
    // ファイル出力の場合、ファイルストリームを開く
    if (this._destination !== "stdout" && this._destination !== "stderr") {
      this._initFileStream();
    }
  }

  /**
   * ファイル出力ストリームを初期化する
   */
  private _initFileStream(): void {
    try {
      this._fileStream = fs.createWriteStream(this._destination, { flags: "a" });
      
      // エラーハンドリング
      this._fileStream.on("error", (err) => {
        console.error(`[JsonlStrategy] ファイル書き込みエラー: ${err.message}`);
      });
    } catch (err) {
      console.error(`[JsonlStrategy] ファイルオープンエラー: ${String(err)}`);
    }
  }

  /**
   * ログを出力する
   * @param level ログレベル
   * @param args ログの引数
   */
  log(level: LogLevel, ...args: unknown[]): void {
    const logEntry = this._formatLogEntry(level, args);
    const jsonLine = `${JSON.stringify(logEntry)}\n`;
    
    this._writeOutput(jsonLine);
  }

  /**
   * ログエントリをフォーマットする
   * @param level ログレベル
   * @param args ログの引数
   * @returns フォーマットされたログエントリ
   */
  private _formatLogEntry(level: LogLevel, args: unknown[]): Record<string, unknown> {
    const entry: Record<string, unknown> = {
      level,
      message: this._formatArgs(args),
    };
    
    if (this._formatOptions.includeTimestamp) {
      entry.timestamp = _getISOTimestamp();
    }
    
    return entry;
  }

  /**
   * ログの引数をフォーマットする
   * @param args ログ引数
   * @returns フォーマットされた引数
   */
  private _formatArgs(args: unknown[]): unknown {
    // 深さを制限したオブジェクトのコピーを作成
    const processedArgs = args.map(arg => 
      _limitObjectDepth(arg, this._formatOptions.maxDepth)
    );
    
    // 単一の引数の場合はそのまま返す
    if (processedArgs.length === 1) {
      return processedArgs[0];
    }
    
    // 複数の引数の場合は配列として返す
    return processedArgs;
  }

  /**
   * 出力先にログを書き込む
   * @param jsonLine JSONLフォーマットのログ行
   */
  private _writeOutput(jsonLine: string): void {
    try {
      if (this._destination === "stdout") {
        process.stdout.write(jsonLine);
      } else if (this._destination === "stderr") {
        process.stderr.write(jsonLine);
      } else if (this._fileStream) {
        this._fileStream.write(jsonLine);
      }
    } catch (err) {
      // エラーが発生した場合はstderrにフォールバック
      console.error(`[JsonlStrategy] 出力エラー: ${String(err)}`);
    }
  }

  /**
   * リソースを解放する
   */
  dispose(): void {
    if (this._fileStream) {
      this._fileStream.end();
      this._fileStream = null;
    }
  }
}

/**
 * JSONL形式出力ストラテジーのインスタンスを作成する
 * @param options ストラテジーオプション
 * @returns JSONL形式出力ストラテジーのインスタンス
 */
export function createJsonlStrategy(options: JsonlStrategyOptions): LogStrategy {
  return new JsonlStrategy(options);
}