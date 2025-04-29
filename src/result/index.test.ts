import { test, expect, describe } from "bun:test";
import type { Result, Success, Failure } from "./index.ts";
import {
  isSuccess,
  isFailure,
  success,
  failure,
  unwrap,
  unwrapOrThrow,
  map,
  flatMap,
  mapError,
  mapAsync,
  flatMapAsync,
  tryAsync,
  all,
  createValidationError,
  createSystemError,
  createNetworkError,
  createHttpError,
  createDatabaseError,
  createIOError,
} from "./index.ts";

describe("Result型の基本機能", () => {
  test("success関数が正しくSuccess型を返す", () => {
    const result = success(42);
    expect(result.success).toBe(true);
    expect(result.value).toBe(42);
    // 型ガードの動作確認
    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
  });

  test("failure関数が正しくFailure型を返す", () => {
    const error = createSystemError("エラーが発生しました");
    const result = failure(error);
    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    // 型ガードの動作確認
    expect(isSuccess(result)).toBe(false);
    expect(isFailure(result)).toBe(true);
  });

  test("unwrap関数の正常系", () => {
    const result = success(42);
    expect(unwrap(result, 0)).toBe(42);
  });

  test("unwrap関数の異常系", () => {
    const error = createSystemError("エラーが発生しました");
    const result = failure(error);
    expect(unwrap(result, 0)).toBe(0);
  });

  test("unwrapOrThrow関数の正常系", () => {
    const result = success(42);
    expect(unwrapOrThrow(result)).toBe(42);
  });

  test("unwrapOrThrow関数の異常系", () => {
    const error = createSystemError("エラーが発生しました");
    const result = failure(error);
    expect(() => unwrapOrThrow(result)).toThrow();
  });
});

describe("マッピング関数のテスト", () => {
  test("map関数が成功時に値を正しく変換する", () => {
    const result = success<number>(42);
    const mapped = map(result, (value: number) => value * 2);
    expect(isSuccess(mapped)).toBe(true);
    if (isSuccess(mapped)) {
      expect(mapped.value).toBe(84);
    }
  });

  test("map関数が失敗時にエラーを伝播する", () => {
    const error = createSystemError("エラーが発生しました");
    const result = failure(error);
    const mapped = map<number, unknown, typeof error>(result, (value: number) => value * 2);
    expect(isFailure(mapped)).toBe(true);
    if (isFailure(mapped)) {
      expect(mapped.error).toBe(error);
    }
  });

  test("flatMap関数が成功時に新しいResultを返す", () => {
    const result = success<number>(42);
    const flatMapped = flatMap(result, (value: number) => success(value * 2));
    expect(isSuccess(flatMapped)).toBe(true);
    if (isSuccess(flatMapped)) {
      expect(flatMapped.value).toBe(84);
    }
  });

  test("flatMap関数が成功時に失敗のResultを返すことができる", () => {
    const result = success<number>(42);
    const error = createSystemError("エラーが発生しました");
    const flatMapped = flatMap(result, (_: number) => failure(error));
    expect(isFailure(flatMapped)).toBe(true);
    if (isFailure(flatMapped)) {
      expect(flatMapped.error).toBe(error);
    }
  });

  test("flatMap関数が失敗時にエラーを伝播する", () => {
    const error = createSystemError("エラーが発生しました");
    const result = failure(error);
    const flatMapped = flatMap<number, number, typeof error>(result, (value: number) => success(value * 2));
    expect(isFailure(flatMapped)).toBe(true);
    if (isFailure(flatMapped)) {
      expect(flatMapped.error).toBe(error);
    }
  });

  test("mapError関数がエラーを正しく変換する", () => {
    const error = createValidationError("入力が不正です", "username");
    const result = failure(error);
    const mapped = mapError(result, (e) => createSystemError(`システムエラー: ${e.message}`));
    expect(isFailure(mapped)).toBe(true);
    if (isFailure(mapped)) {
      expect(mapped.error.type).toBe("system");
      expect(mapped.error.message).toBe("システムエラー: 入力が不正です");
    }
  });
});

describe("非同期関数のテスト", () => {
  test("mapAsync関数が正しく動作する", async () => {
    const result = success(42);
    const mapped = await mapAsync(result, async (value) => value * 2);
    expect(isSuccess(mapped)).toBe(true);
    if (isSuccess(mapped)) {
      expect(mapped.value).toBe(84);
    }
  });

  test("flatMapAsync関数が正しく動作する", async () => {
    const result = success(42);
    const flatMapped = await flatMapAsync(result, async (value) => success(value * 2));
    expect(isSuccess(flatMapped)).toBe(true);
    if (isSuccess(flatMapped)) {
      expect(flatMapped.value).toBe(84);
    }
  });

  test("tryAsync関数が非同期関数の結果を正しくラップする", async () => {
    const successFn = async () => 42;
    const successResult = await tryAsync(successFn);
    expect(isSuccess(successResult)).toBe(true);
    if (isSuccess(successResult)) {
      expect(successResult.value).toBe(42);
    }

    const failureFn = async () => {
      throw new Error("エラーが発生しました");
    };
    const failureResult = await tryAsync(failureFn);
    expect(isFailure(failureResult)).toBe(true);
  });
});

describe("エラー関連関数のテスト", () => {
  test("createValidationError関数が正しくエラー情報を作成する", () => {
    const error = createValidationError("入力が不正です", "username");
    expect(error.type).toBe("validation");
    expect(error.message).toBe("入力が不正です");
    expect(error.field).toBe("username");
    expect(error.recoverable).toBe(true);
  });

  test("createSystemError関数が正しくエラー情報を作成する", () => {
    const error = createSystemError("システムエラーが発生しました");
    expect(error.type).toBe("system");
    expect(error.message).toBe("システムエラーが発生しました");
    expect(error.recoverable).toBe(false);
  });

  test("createNetworkError関数が正しくエラー情報を作成する", () => {
    const error = createNetworkError("ネットワークエラーが発生しました", "https://example.com");
    expect(error.type).toBe("network");
    expect(error.message).toBe("ネットワークエラーが発生しました");
    expect(error.url).toBe("https://example.com");
    expect(error.recoverable).toBe(true);
  });

  test("createHttpError関数が正しくエラー情報を作成する", () => {
    const error = createHttpError("HTTPエラーが発生しました", 404, "https://example.com");
    expect(error.type).toBe("http");
    expect(error.message).toBe("HTTPエラーが発生しました");
    expect(error.statusCode).toBe(404);
    expect(error.url).toBe("https://example.com");
    expect(error.recoverable).toBe(false);
  });

  test("createDatabaseError関数が正しくエラー情報を作成する", () => {
    const error = createDatabaseError("DBエラーが発生しました", "SELECT", "users");
    expect(error.type).toBe("database");
    expect(error.message).toBe("DBエラーが発生しました");
    expect(error.operation).toBe("SELECT");
    expect(error.table).toBe("users");
    expect(error.recoverable).toBe(false);
  });

  test("createIOError関数が正しくエラー情報を作成する", () => {
    const error = createIOError("I/Oエラーが発生しました", "/path/to/file", "read");
    expect(error.type).toBe("io");
    expect(error.message).toBe("I/Oエラーが発生しました");
    expect(error.path).toBe("/path/to/file");
    expect(error.operation).toBe("read");
    expect(error.recoverable).toBe(false);
  });
});

describe("複合関数のテスト", () => {
  test("all関数がすべて成功の場合に正しく結果を配列にまとめる", () => {
    const results: Result<number, unknown>[] = [success(1), success(2), success(3)];
    const combined = all(results);
    expect(isSuccess(combined)).toBe(true);
    if (isSuccess(combined)) {
      expect(combined.value).toEqual([1, 2, 3]);
    }
  });

  test("all関数がいずれか失敗の場合に最初の失敗を返す", () => {
    const error = createSystemError("エラーが発生しました");
    const results: Result<number, unknown>[] = [success(1), failure(error), success(3)];
    const combined = all(results);
    expect(isFailure(combined)).toBe(true);
    if (isFailure(combined)) {
      expect(combined.error).toBe(error);
    }
  });
});