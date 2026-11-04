import type { z } from "zod";
import { badRequest, type HttpError } from "./httpError";

export const parseOrThrow = <T extends z.ZodType>(
  schema: T,
  value: unknown,
  toError: () => HttpError = () => badRequest(),
): z.output<T> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw toError();
  return parsed.data;
};
