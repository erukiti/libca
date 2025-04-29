# libca

libcaは、コーディングエージェントが使いやすいベストプラクティスを集めたTypeScriptライブラリです。単一責任の原則に従った設計で、各モジュールが明確な責務を持ち、インターフェースベースの拡張性を提供します。

## 特徴

- **エラーハンドリング**: 例外ではなくResult型を使用した安全なエラー処理
- **ロギング**: 複数の出力戦略をサポートする拡張性の高いロガー
- **リトライ機構**: 指数バックオフやジッターをサポートする堅牢なリトライ機能
- **MCP連携**: Model Context Protocol をサポートするサーバー/クライアント機能
- **HTTP通信**: 型安全で使いやすいFetchクライアント

## インストール

```bash
bun install
```

## 主要モジュール

### Result モジュール

例外を使わずに成功・失敗を表現するResult型とその操作関数を提供します。

```typescript
import { success, failure, isSuccess, unwrap } from "libca";

// 成功の例
const successResult = success("Hello via Bun!");
console.log("Is success?", isSuccess(successResult));
console.log("Value:", unwrap(successResult, "Default value"));

// 失敗の例
const errorInfo = createSystemError("Something went wrong");
const failureResult = failure(errorInfo);
```

### Logger モジュール

環境に応じた最適なログ出力戦略を自動選択する拡張性のあるロガーを提供します。

```typescript
import { createLogger } from "libca";

// デフォルトロガーを作成
const logger = createLogger();
logger.info("アプリケーションが起動しました");

// コンテキスト付きロガーを作成
const dbLogger = logger.withContext("Database");
dbLogger.info("接続が確立されました");
```

### Retry モジュール

失敗した操作を設定可能なバックオフ戦略で再試行する機能を提供します。

```typescript
import { retryAsync, exponentialBackoffWithJitter } from "libca";

const result = await retryAsync(
  async () => {
    // 非同期処理
    const response = await fetch("https://api.example.com");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
  {
    maxRetries: 5,
    backoff: exponentialBackoffWithJitter({ baseMs: 500 })
  }
);
```

### MCP モジュール

Model Context Protocol のサーバー/クライアント実装を提供します。

```typescript
import { createMcpServer, createSimpleTextResponse, success } from "libca";
import { z } from "zod";

const server = createMcpServer({
  name: "calculator",
  version: "1.0.0",
  description: "数学計算ツールを提供するサーバー"
});

// 計算ツールの追加
server.addTool("add", {
  description: "2つの数値を足し算します",
  inputSchema: z.object({
    a: z.number(),
    b: z.number()
  }),
  handler: async (request) => {
    const { a, b } = request.arguments as { a: number, b: number };
    const result = a + b;
    return success(createSimpleTextResponse(`${a} + ${b} = ${result}`));
  }
});
```

### Fetch モジュール

タイプセーフなHTTPクライアント機能を提供します。

```typescript
import { createJsonClient, isSuccess } from "libca";
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

const jsonClient = createJsonClient({
  baseUrl: "https://api.example.com"
});

const userResult = await jsonClient.get(userSchema, "/users/1");
if (isSuccess(userResult)) {
  // 型安全なデータアクセス
  console.log(userResult.value.name);
}
```

## ドキュメント

詳細なAPIドキュメントは[こちら](./docs/api-documentation.md)を参照してください。

## 設計思想

- 単一責任の原則に従った明確な責務の分離
- インターフェースベースの設計による拡張性
- 最小限の依存関係によるメンテナンス性の向上
- エラーハンドリングの一貫性（例外ではなくResult型の使用）

## ライセンス

MITライセンスの下で提供されています。

---

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
