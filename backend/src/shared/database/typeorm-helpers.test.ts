import test from "node:test";
import assert from "node:assert/strict";
import { QueryFailedError } from "typeorm";
import {
  isMissingColumnError,
  isMissingTableError,
  isMissingTableOrColumnError
} from "./typeorm-helpers.js";

const createQueryError = (code: string) =>
  new QueryFailedError("SELECT 1", [], { code });

test("missing table helper detects ER_NO_SUCH_TABLE", () => {
  assert.equal(isMissingTableError(createQueryError("ER_NO_SUCH_TABLE")), true);
  assert.equal(isMissingTableOrColumnError(createQueryError("ER_NO_SUCH_TABLE")), true);
});

test("missing column helper detects ER_BAD_FIELD_ERROR", () => {
  assert.equal(isMissingColumnError(createQueryError("ER_BAD_FIELD_ERROR")), true);
  assert.equal(isMissingTableOrColumnError(createQueryError("ER_BAD_FIELD_ERROR")), true);
});

test("missing schema helper ignores unrelated database errors", () => {
  assert.equal(isMissingTableOrColumnError(createQueryError("ER_DUP_ENTRY")), false);
});
