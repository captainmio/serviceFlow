import { QueryFailedError } from "typeorm";

export const isDuplicateEntryError = (error: unknown) =>
  error instanceof QueryFailedError &&
  typeof error.driverError === "object" &&
  error.driverError !== null &&
  "code" in error.driverError &&
  error.driverError.code === "ER_DUP_ENTRY";

