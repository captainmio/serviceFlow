import { appDataSource } from "../../database/data-source.js";
import { User } from "../../entities/user.entity.js";
import type { UserOptionResponse } from "./user.types.js";

const toUserOptionResponse = (user: User): UserOptionResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const listAssignableUsers = async (): Promise<UserOptionResponse[]> => {
  const userRepository = appDataSource.getRepository(User);
  const users = await userRepository.find({
    where: {
      role: "team_member"
    },
    order: {
      name: "ASC"
    }
  });

  return users.map(toUserOptionResponse);
};
