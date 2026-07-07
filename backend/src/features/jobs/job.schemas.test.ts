import assert from "node:assert/strict";
import test from "node:test";
import { jobPayloadSchema } from "./job.schemas.js";

test("job payload schema accepts a valid job payload", () => {
  const parsed = jobPayloadSchema.parse({
    title: "Quarterly maintenance sprint",
    customerId: "11111111-1111-1111-1111-111111111111",
    serviceId: "22222222-2222-2222-2222-222222222222",
    hourlyRate: 140
  });

  assert.equal(parsed.hourlyRate, 140);
});

test("job payload schema rejects invalid hourly rate", () => {
  assert.throws(() =>
    jobPayloadSchema.parse({
      title: "Quarterly maintenance sprint",
      customerId: "11111111-1111-1111-1111-111111111111",
      serviceId: "22222222-2222-2222-2222-222222222222",
      hourlyRate: 0
    })
  );
});
