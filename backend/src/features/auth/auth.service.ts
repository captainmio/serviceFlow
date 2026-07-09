import { compare } from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { appDataSource } from "../../database/data-source.js";
import { User } from "../../entities/user.entity.js";
import type { AuthResponse, AuthenticatedUser, JwtPayload } from "./auth.types.js";
import type { LoginInput } from "./auth.schema.js";

export const ACCESS_TOKEN_COOKIE_NAME = "serviceflow_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "serviceflow_refresh_token";
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const buildAuthenticatedUser = (user: User): AuthenticatedUser => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const signToken = (payload: JwtPayload, expiresIn: SignOptions["expiresIn"]) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn });

const buildAuthResponse = (user: User): AuthResponse => {
  return {
    user: buildAuthenticatedUser(user)
  };
};

export const buildAuthTokens = (user: User) => {
  const basePayload = {
    sub: user.uuid,
    name: user.name,
    email: user.email,
    role: user.role
  } satisfies Omit<JwtPayload, "tokenType">;

  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return {
    accessToken: signToken({ ...basePayload, tokenType: "access" }, signOptions.expiresIn),
    refreshToken: signToken(
      { ...basePayload, tokenType: "refresh" },
      env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
    )
  };
};

export const login = async ({ email, password }: LoginInput): Promise<User> => {
  const userRepository = appDataSource.getRepository(User);
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findOne({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.active || user.isLoginBlocked) {
    throw new Error("This user is currently blocked from logging in");
  }

  const isPasswordValid = await compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const buildSessionResponse = (user: User): AuthResponse => buildAuthResponse(user);

export const verifyToken = (token: string): JwtPayload => jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const findUserById = async (userId: string): Promise<User | null> => {
  const userRepository = appDataSource.getRepository(User);

  return userRepository.findOne({
    where: { uuid: userId }
  });
};
