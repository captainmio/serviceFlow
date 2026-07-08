import assert from "node:assert/strict";
import test from "node:test";
import { jobPayloadSchema } from "./job.schemas.js";

test("job payload schema accepts a valid job payload", () => {
  const parsed = jobPayloadSchema.parse({
    title: "Quarterly maintenance sprint",
    description: "Prepare and deliver the Q3 work package.",
    customerId: "11111111-1111-1111-1111-111111111111",
    assignedToIds: ["22222222-2222-2222-2222-222222222222"],
    status: "assigned",
    startDate: "2026-07-09",
    dueDate: "2026-07-20",
    rejectionReason: null
  });

  assert.equal(parsed.status, "assigned");
});

test("job payload schema rejects a due date before the start date", () => {
  assert.throws(() =>
    jobPayloadSchema.parse({
      title: "Quarterly maintenance sprint",
      description: "",
      customerId: "11111111-1111-1111-1111-111111111111",
      assignedToIds: [],
      status: "draft",
      startDate: "2026-07-20",
      dueDate: "2026-07-10"
    })
  );
});

test("job payload schema requires a rejection reason for rejected jobs", () => {
  assert.throws(() =>
    jobPayloadSchema.parse({
      title: "Quarterly maintenance sprint",
      description: "",
      customerId: "11111111-1111-1111-1111-111111111111",
      assignedToIds: [],
      status: "rejected",
      startDate: null,
      dueDate: null,
      rejectionReason: ""
    })
  );
});

test("job payload schema requires dates once the job moves beyond assigned", () => {
  assert.throws(() =>
    jobPayloadSchema.parse({
      title: "Quarterly maintenance sprint",
      description: "",
      customerId: "11111111-1111-1111-1111-111111111111",
      assignedToIds: [],
      status: "in_progress",
      startDate: null,
      dueDate: null,
      rejectionReason: null
    })
  );
});
