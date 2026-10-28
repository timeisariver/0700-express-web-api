import { expect } from "vitest";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function expectUuid(value: unknown): asserts value is string {
  expect(value).toEqual(expect.any(String));
  expect(value).toMatch(uuidPattern);
}

export function expectNonEmptyString(value: unknown): asserts value is string {
  expect(value).toEqual(expect.any(String));
  expect((value as string).length).toBeGreaterThan(0);
}

export function expectOptionalIsoDateTime(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(String));
  expect(value).toMatch(isoDateTimePattern);
}

export function expectOptionalString(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(String));
}

export function expectOptionalInteger(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(Number));
  expect(Number.isInteger(value)).toBe(true);
}

export function expectPageInfo(value: unknown, expected: { limit: number; page: number }): void {
  expect(value).toEqual(
    expect.objectContaining({
      totalCount: expect.any(Number),
      limit: expected.limit,
      page: expected.page,
      hasNext: expect.any(Boolean),
      hasPrevious: expect.any(Boolean)
    })
  );
}
