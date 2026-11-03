import type { Request } from "express";
import { badRequest } from "./httpError";

export type Pagination = { limit: number; page: number };

export type PageInfo = {
  totalCount: number;
  limit: number;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const MAX_LIMIT = 100;

const parseIntParam = (
  value: unknown,
  defaultValue: number,
  min: number,
  max: number,
): number => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw badRequest();
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw badRequest();
  return n;
};

export const parsePagination = (query: Request["query"]): Pagination => ({
  limit: parseIntParam(query["limit"], DEFAULT_LIMIT, 1, MAX_LIMIT),
  page: parseIntParam(query["page"], DEFAULT_PAGE, 1, Number.MAX_SAFE_INTEGER),
});

export const toPageInfo = (totalCount: number, pagination: Pagination): PageInfo => ({
  totalCount,
  limit: pagination.limit,
  page: pagination.page,
  hasNext: pagination.page * pagination.limit < totalCount,
  hasPrevious: pagination.page > 1,
});
