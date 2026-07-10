import { QueryFailedError } from "typeorm";

export const isDuplicateEntryError = (error: unknown) =>
  error instanceof QueryFailedError &&
  typeof error.driverError === "object" &&
  error.driverError !== null &&
  "code" in error.driverError &&
  error.driverError.code === "ER_DUP_ENTRY";

export const isMissingTableError = (error: unknown) =>
  error instanceof QueryFailedError &&
  typeof error.driverError === "object" &&
  error.driverError !== null &&
  "code" in error.driverError &&
  error.driverError.code === "ER_NO_SUCH_TABLE";

export const isMissingColumnError = (error: unknown) =>
  error instanceof QueryFailedError &&
  typeof error.driverError === "object" &&
  error.driverError !== null &&
  "code" in error.driverError &&
  error.driverError.code === "ER_BAD_FIELD_ERROR";

export const isMissingTableOrColumnError = (error: unknown) =>
  isMissingTableError(error) || isMissingColumnError(error);
