import assert from "node:assert/strict";
import test from "node:test";
import { jobPayloadSchema } from "./job.schemas.js";

test("job payload schema accepts a valid job payload", () => {
  const parsed = jobPayloadSchema.parse({
    title: "Quarterly maintenance sprint",
    description: "Prepare and deliver the Q3 work package.",
    customerId: "11111111-1111-1111-1111-111111111111",
    projectManagerId: "44444444-4444-4444-4444-444444444444",
    serviceAssignments: [
      {
        serviceId: "33333333-3333-3333-3333-333333333333",
        hourlyRate: 140,
        assignedToIds: ["22222222-2222-2222-2222-222222222222"]
      }
    ],
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
      projectManagerId: "44444444-4444-4444-4444-444444444444",
      serviceAssignments: [
        {
          serviceId: "33333333-3333-3333-3333-333333333333",
          hourlyRate: 140,
          assignedToIds: ["22222222-2222-2222-2222-222222222222"]
        }
      ],
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
      projectManagerId: "44444444-4444-4444-4444-444444444444",
      serviceAssignments: [
        {
          serviceId: "33333333-3333-3333-3333-333333333333",
          hourlyRate: 140,
          assignedToIds: ["22222222-2222-2222-2222-222222222222"]
        }
      ],
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
      projectManagerId: "44444444-4444-4444-4444-444444444444",
      serviceAssignments: [
        {
          serviceId: "33333333-3333-3333-3333-333333333333",
          hourlyRate: 140,
          assignedToIds: ["22222222-2222-2222-2222-222222222222"]
        }
      ],
      status: "in_progress",
      startDate: null,
      dueDate: null,
      rejectionReason: null
    })
  );
});

test("job payload schema allows an empty due date when the start date is provided", () => {
  const parsed = jobPayloadSchema.parse({
    title: "Quarterly maintenance sprint",
    description: "",
    customerId: "11111111-1111-1111-1111-111111111111",
    projectManagerId: "44444444-4444-4444-4444-444444444444",
    serviceAssignments: [
      {
        serviceId: "33333333-3333-3333-3333-333333333333",
        hourlyRate: 140,
        assignedToIds: ["22222222-2222-2222-2222-222222222222"]
      }
    ],
    status: "in_progress",
    startDate: "2026-07-09",
    dueDate: null,
    rejectionReason: null
  });

  assert.equal(parsed.dueDate, null);
});

test("job payload schema rejects duplicate services on the same project", () => {
  assert.throws(() =>
    jobPayloadSchema.parse({
      title: "Quarterly maintenance sprint",
      description: "",
      customerId: "11111111-1111-1111-1111-111111111111",
      projectManagerId: "44444444-4444-4444-4444-444444444444",
      serviceAssignments: [
        {
          serviceId: "33333333-3333-3333-3333-333333333333",
          hourlyRate: 140,
          assignedToIds: ["22222222-2222-2222-2222-222222222222"]
        },
        {
          serviceId: "33333333-3333-3333-3333-333333333333",
          hourlyRate: 150,
          assignedToIds: ["22222222-2222-2222-2222-222222222222"]
        }
      ],
      status: "assigned",
      startDate: "2026-07-09",
      dueDate: "2026-07-20",
      rejectionReason: null
    })
  );
});
