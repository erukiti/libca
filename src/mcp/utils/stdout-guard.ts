/**
 * このファイルは、標準出力保護機構の責務を持ちます。
 * MCPサーバーはstdioトランスポートを使用する場合、標準出力を通信チャネルとして使用するため、
 * アプリケーションからの不要な出力が混入すると正しく通信できなくなります。
 * このユーティリティはそのような状況を防ぐための機能を提供します。
 */

import { logger } from '../../logger';

// プライベートプレフィックス
const _stdoutGuardPrefix = '_stdoutGuard';

// 元のconsole.log関数を保存
const _stdoutGuardOriginalConsoleLog = console.log;
const _stdoutGuardOriginalConsoleInfo = console.info;
const _stdoutGuardOriginalConsoleWarn = console.warn;
// console.errorはstderrを使用するため、置き換えない

// MCPコンテキスト専用のロガー
const _stdoutGuardLogger = logger.withContext('StdoutGuard');

/**
 * 標準出力保護を有効にする
 * console.log, console.info, console.warnの出力をstderrにリダイレクトする
 */
export function enableStdoutGuard(): void {
  _stdoutGuardLogger.info('標準出力保護を有効化します');
  
  // console.logをオーバーライド
  console.log = (...args: unknown[]) => {
    console.error('[log]', ...args);
  };
  
  // console.infoをオーバーライド
  console.info = (...args: unknown[]) => {
    console.error('[info]', ...args);
  };
  
  // console.warnをオーバーライド
  console.warn = (...args: unknown[]) => {
    console.error('[warn]', ...args);
  };
  
  _stdoutGuardLogger.info('標準出力保護が有効になりました（console.logなどの出力はstderrにリダイレクトされます）');
}

/**
 * 標準出力保護を無効にし、元のconsole関数を復元する
 */
export function disableStdoutGuard(): void {
  _stdoutGuardLogger.info('標準出力保護を無効化します');
  
  // 元の関数を復元
  console.log = _stdoutGuardOriginalConsoleLog;
  console.info = _stdoutGuardOriginalConsoleInfo;
  console.warn = _stdoutGuardOriginalConsoleWarn;
  
  _stdoutGuardLogger.info('標準出力保護が無効になりました（元のconsole関数が復元されました）');
}

/**
 * 安全に標準出力に書き込むための関数
 * MCPサーバーが使用する場合のみ使用すべき
 * 
 * @param data 出力データ
 */
export function _stdoutGuardWriteToStdout(data: string): void {
  process.stdout.write(data);
}

/**
 * 標準出力保護が有効かどうかを確認する
 * 
 * @returns 標準出力保護が有効な場合はtrue、そうでない場合はfalse
 */
export function isStdoutGuardEnabled(): boolean {
  return console.log !== _stdoutGuardOriginalConsoleLog;
}

/**
 * 現在の実行環境がNode.js/Bunかどうかを確認する
 * 
 * @returns Node.js/Bun環境の場合はtrue、そうでない場合はfalse
 */
export function _stdoutGuardIsNodeOrBunEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         typeof process.stdout !== 'undefined' &&
         typeof process.stdout.write === 'function';
}