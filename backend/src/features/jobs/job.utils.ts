import { Job } from "../../entities/job.entity.js";
import { JobService } from "../../entities/job-service.entity.js";
import { Service } from "../../entities/service.entity.js";
import { User } from "../../entities/user.entity.js";
import type { JobPayload } from "./job.schemas.js";

export const buildPersistedJobServiceAssignments = ({
  payload,
  services,
  assignableUsers,
  job,
  existingAssignments = []
}: {
  payload: JobPayload;
  services: Service[];
  assignableUsers: User[];
  job?: Job;
  existingAssignments?: JobService[];
}) => {
  const servicesById = new Map(services.map((service) => [service.id, service]));
  const usersById = new Map(assignableUsers.map((user) => [user.uuid, user]));
  const existingAssignmentsByServiceId = new Map(
    existingAssignments.map((assignment) => [assignment.service.id, assignment])
  );

  return payload.serviceAssignments.map((serviceAssignment) => {
    const service = servicesById.get(serviceAssignment.serviceId);

    if (!service) {
      throw new Error("Select valid services for this project");
    }

    const assignees = serviceAssignment.assignedToIds.map((assignedToId) => {
      const user = usersById.get(assignedToId);

      if (!user) {
        throw new Error("Select valid team members or managers for this project service");
      }

      return user;
    });

    const existingAssignment = existingAssignmentsByServiceId.get(serviceAssignment.serviceId);

    return {
      id: existingAssignment?.id,
      job: job ?? existingAssignment?.job,
      service,
      hourlyRate: serviceAssignment.hourlyRate,
      assignees
    };
  });
};

