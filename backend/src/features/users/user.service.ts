import { hash } from "bcrypt";
import { ILike } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Invoice } from "../../entities/invoice.entity.js";
import { User } from "../../entities/user.entity.js";
import type { UserListQuery, UserPayload } from "./user.schemas.js";
import type { UserOptionResponse } from "./user.types.js";
import type { TeamMemberResponse } from "./user.types.js";

const toUserOptionResponse = (user: User): UserOptionResponse => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const toTeamMemberResponse = (user: User): TeamMemberResponse => ({
  uuid: user.uuid,
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  title: user.title,
  email: user.email,
  active: user.active,
  isLoginBlocked: user.isLoginBlocked,
  startDate: user.startDate,
  endDate: user.endDate,
  role: user.role,
  maxWorkHoursPerDay: user.maxWorkHoursPerDay,
  maxWorkHoursPerWeek: user.maxWorkHoursPerWeek,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

export class TeamMemberAlreadyExistsError extends Error {}

const normalizeName = (firstName: string, lastName: string) =>
  `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;

const applyUserPayload = (user: User, payload: UserPayload) => {
  user.firstName = payload.firstName.trim();
  user.lastName = payload.lastName.trim();
  user.name = `${payload.firstName.trim()} ${payload.lastName.trim()}`;
  user.title = payload.title.trim();
  user.email = payload.email.trim().toLowerCase();
  user.active = payload.active;
  user.isLoginBlocked = payload.isLoginBlocked;
  user.startDate = payload.startDate;
  user.endDate = payload.endDate;
  user.role = payload.role;
  user.maxWorkHoursPerDay = payload.maxWorkHoursPerDay;
  user.maxWorkHoursPerWeek = payload.maxWorkHoursPerWeek;
};

const ensureTeamMemberDoesNotExist = async (
  payload: UserPayload,
  currentUserUuid?: string
) => {
  const userRepository = appDataSource.getRepository(User);
  const users = await userRepository.find();
  const target = normalizeName(payload.firstName, payload.lastName);
  const duplicateUser = users.find(
    (user) => user.uuid !== currentUserUuid && normalizeName(user.firstName, user.lastName) === target
  );

  if (duplicateUser) {
    throw new TeamMemberAlreadyExistsError(
      `A team member named ${payload.firstName.trim()} ${payload.lastName.trim()} already exists`
    );
  }
};

export const listTeamMembers = async ({
  search,
  active,
  role
}: UserListQuery): Promise<TeamMemberResponse[]> => {
  const userRepository = appDataSource.getRepository(User);

  const activeFilter = active === undefined ? undefined : active === "true";
  const whereClause = search
    ? [
        {
          firstName: ILike(`%${search}%`),
          ...(activeFilter === undefined ? {} : { active: activeFilter }),
          ...(role ? { role } : {})
        },
        {
          lastName: ILike(`%${search}%`),
          ...(activeFilter === undefined ? {} : { active: activeFilter }),
          ...(role ? { role } : {})
        },
        {
          email: ILike(`%${search}%`),
          ...(activeFilter === undefined ? {} : { active: activeFilter }),
          ...(role ? { role } : {})
        },
        {
          title: ILike(`%${search}%`),
          ...(activeFilter === undefined ? {} : { active: activeFilter }),
          ...(role ? { role } : {})
        }
      ]
    : {
        ...(activeFilter === undefined ? {} : { active: activeFilter }),
        ...(role ? { role } : {})
      };

  const users = await userRepository.find({
    where: whereClause,
    order: {
      firstName: "ASC",
      lastName: "ASC"
    }
  });

  return users.map(toTeamMemberResponse);
};

export const listAssignableUsers = async (): Promise<UserOptionResponse[]> => {
  const userRepository = appDataSource.getRepository(User);
  const users = await userRepository.find({
    where: {
      role: "team_member",
      active: true,
      isLoginBlocked: false
    },
    order: {
      firstName: "ASC",
      lastName: "ASC"
    }
  });

  return users.map(toUserOptionResponse);
};

export const createTeamMember = async (payload: UserPayload): Promise<TeamMemberResponse> => {
  const userRepository = appDataSource.getRepository(User);
  await ensureTeamMemberDoesNotExist(payload);

  if (!payload.password?.trim()) {
    throw new Error("Password is required when creating a team member");
  }

  const passwordHash = await hash(payload.password.trim(), 10);
  const user = userRepository.create({
    passwordHash
  });

  applyUserPayload(user, payload);

  const savedUser = await userRepository.save(user);
  return toTeamMemberResponse(savedUser);
};

export const getTeamMemberByUuid = async (userUuid: string): Promise<TeamMemberResponse | null> => {
  const userRepository = appDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { uuid: userUuid } });

  if (!user) {
    return null;
  }

  return toTeamMemberResponse(user);
};

export const updateTeamMember = async (
  userUuid: string,
  payload: UserPayload
): Promise<TeamMemberResponse | null> => {
  const userRepository = appDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { uuid: userUuid } });

  if (!user) {
    return null;
  }

  await ensureTeamMemberDoesNotExist(payload, userUuid);
  applyUserPayload(user, payload);

  if (payload.password?.trim()) {
    user.passwordHash = await hash(payload.password.trim(), 10);
  }

  const savedUser = await userRepository.save(user);
  return toTeamMemberResponse(savedUser);
};

export const findPendingInvoicesForUser = async (userUuid: string): Promise<number> => {
  const invoiceRepository = appDataSource.getRepository(Invoice);
  const userRepository = appDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { uuid: userUuid } });

  if (!user) {
    return 0;
  }

  return invoiceRepository.count();
};
