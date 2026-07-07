import { compare } from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { appDataSource } from "../../database/data-source.js";
import { User } from "../../entities/user.entity.js";
import type { AuthResponse, JwtPayload } from "./auth.types.js";
import type { LoginInput } from "./auth.schema.js";

const buildAuthResponse = (user: User): AuthResponse => {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    } satisfies JwtPayload,
    env.JWT_SECRET,
    signOptions
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const login = async ({ email, password }: LoginInput): Promise<AuthResponse> => {
  const userRepository = appDataSource.getRepository(User);
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findOne({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return buildAuthResponse(user);
};
