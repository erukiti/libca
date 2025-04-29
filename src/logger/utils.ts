/**
 * このファイルは、ロガーモジュールのユーティリティ関数の責務を持ちます。
 */

/**
 * 実行環境を検出する
 * @returns 実行環境情報オブジェクト
 */
export function _detectEnvironment(): { isBrowser: boolean; isNode: boolean; isBun: boolean } {
  // @ts-ignore - グローバルオブジェクトの存在チェック
  const isBrowser = typeof globalThis.window !== "undefined" && typeof globalThis.document !== "undefined";
  const isNode = typeof process !== "undefined" && 
                 typeof process.versions !== "undefined" && 
                 typeof process.versions.node !== "undefined";
  const isBun = typeof process !== "undefined" && 
                typeof process.versions !== "undefined" && 
                typeof process.versions.bun !== "undefined";
  
  return { isBrowser, isNode, isBun };
}

/**
 * 現在のタイムスタンプを ISO 8601 形式で取得する
 * @returns ISO 8601形式の現在時刻
 */
export function _getISOTimestamp(): string {
  return new Date().toISOString();
}


/**
 * オブジェクトを階層の深さを制限してコピーする
 * @param obj 変換対象のオブジェクト
 * @param maxDepth 最大深さ
 * @param currentDepth 現在の深さ
 * @returns コピーされたオブジェクト
 */
export function _limitObjectDepth(
  obj: unknown,
  maxDepth = 10,
  currentDepth = 0
): unknown {
  // プリミティブ値の場合はそのまま返す
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }
  
  // 最大深さに達した場合は文字列で表現
  if (currentDepth >= maxDepth) {
    if (Array.isArray(obj)) {
      return `[Array(${obj.length})]`;
    }
    return `[Object ${Object.prototype.toString.call(obj).slice(8, -1)}]`;
  }
  
  // 配列の場合
  if (Array.isArray(obj)) {
    return obj.map(item => _limitObjectDepth(item, maxDepth, currentDepth + 1));
  }
  
  // オブジェクトの場合
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = _limitObjectDepth(value, maxDepth, currentDepth + 1);
  }
  
  return result;
}