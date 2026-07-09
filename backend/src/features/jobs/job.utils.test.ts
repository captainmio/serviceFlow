import assert from "node:assert/strict";
import test from "node:test";
import type { Job } from "../../entities/job.entity.js";
import type { JobService } from "../../entities/job-service.entity.js";
import type { Service } from "../../entities/service.entity.js";
import type { User } from "../../entities/user.entity.js";
import { buildPersistedJobServiceAssignments } from "./job.utils.js";
import type { JobPayload } from "./job.schemas.js";

test("job service assignment builder preserves an existing assignment id when updating assignees", () => {
  const job = { id: "job-1" } as Job;
  const service = { id: "service-1", name: "Bug fixing" } as Service;
  const existingAssignment = {
    id: "assignment-1",
    job,
    service
  } as JobService;
  const teamMember = { uuid: "user-1", role: "team_member" } as User;
  const manager = { uuid: "user-2", role: "manager" } as User;

  const payload = {
    title: "Testing Project",
    description: "",
    customerId: "customer-1",
    projectManagerId: "manager-1",
    serviceAssignments: [
      {
        serviceId: "service-1",
        hourlyRate: 100,
        assignedToIds: ["user-1", "user-2"]
      }
    ],
    status: "draft",
    startDate: null,
    dueDate: null,
    rejectionReason: null
  } as JobPayload;

  const assignments = buildPersistedJobServiceAssignments({
    payload,
    services: [service],
    assignableUsers: [teamMember, manager],
    job,
    existingAssignments: [existingAssignment]
  });

  assert.equal(assignments.length, 1);
  assert.equal(assignments[0]?.id, "assignment-1");
  assert.equal(assignments[0]?.job, job);
  assert.equal(assignments[0]?.hourlyRate, 100);
  assert.deepEqual(
    assignments[0]?.assignees.map((assignee) => assignee.uuid),
    ["user-1", "user-2"]
  );
});
