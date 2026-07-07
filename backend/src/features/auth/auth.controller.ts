import type { Request, Response } from "express";
import { ZodError } from "zod";
import { loginSchema } from "./auth.schema.js";
import { login } from "./auth.service.js";

export const loginHandler = async (request: Request, response: Response) => {
  try {
    const credentials = loginSchema.parse(request.body);
    const authResponse = await login(credentials);

    response.status(200).json(authResponse);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid login payload",
        issues: error.flatten()
      });
      return;
    }

    if (error instanceof Error && error.message === "Invalid email or password") {
      response.status(401).json({
        message: error.message
      });
      return;
    }

    response.status(500).json({
      message: "Unable to log in right now"
    });
  }
};
