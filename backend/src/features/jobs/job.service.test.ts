import assert from "node:assert/strict";
import test from "node:test";
import { JobAlreadyExistsError } from "./job.service.js";

test("job already exists error explains the duplicate project rule", () => {
  const error = new JobAlreadyExistsError(
    'A project named "Website refresh" already exists for this customer'
  );

  assert.match(error.message, /already exists for this customer/);
});
