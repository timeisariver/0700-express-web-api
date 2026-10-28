import { expect } from "vitest";
import {
  expectNonEmptyString,
  expectOptionalInteger,
  expectOptionalIsoDateTime,
  expectOptionalString,
  expectUuid
} from "./assertions";

export type ProjectStats = {
  total?: number;
  kinds?: {
    milestone?: number;
    task?: number;
    total?: number;
  };
  states?: {
    scheduled?: number;
    completed?: number;
    archived?: number;
  };
};

export type Project = {
  id: string;
  name: string;
  slug?: string;
  goal?: string;
  shouldbe?: string;
  color?: string;
  stats?: ProjectStats;
  createdAt?: string;
  updatedAt?: string;
  deadline?: string;
  startingAt?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "scheduled" | "completed" | "archived";
  project?: Project;
};

export function expectAuthData(value: unknown): void {
  expect(value).toEqual(
    expect.objectContaining({
      uuid: expect.any(String),
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    })
  );

  const auth = value as { uuid: unknown; accessToken: unknown; refreshToken: unknown };
  expectUuid(auth.uuid);
  expectNonEmptyString(auth.accessToken);
  expectNonEmptyString(auth.refreshToken);
}

export function expectUser(value: unknown): void {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      username: expect.any(String),
      email: expect.any(String),
      status: expect.stringMatching(/^(active|deactive)$/)
    })
  );

  expectUuid((value as { id: unknown }).id);
}

export function expectProject(value: unknown): asserts value is Project {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String)
    })
  );

  const project = value as Record<string, unknown>;
  expectUuid(project.id);
  expectNonEmptyString(project.name);
  expectOptionalString(project.slug);
  expectOptionalString(project.goal);
  expectOptionalString(project.shouldbe);
  expectOptionalString(project.color);
  expectProjectStats(project.stats);
  expectOptionalIsoDateTime(project.createdAt);
  expectOptionalIsoDateTime(project.updatedAt);
  expectOptionalIsoDateTime(project.deadline);
  expectOptionalIsoDateTime(project.startingAt);
  expectOptionalIsoDateTime(project.startedAt);
  expectOptionalIsoDateTime(project.finishedAt);
}

function expectProjectStats(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(Object));
  const stats = value as Record<string, unknown>;
  expectOptionalInteger(stats.total);
  expectProjectStatsKinds(stats.kinds);
  expectProjectStatsStates(stats.states);
}

function expectProjectStatsKinds(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(Object));
  const kinds = value as Record<string, unknown>;
  expectOptionalInteger(kinds.milestone);
  expectOptionalInteger(kinds.task);
  expectOptionalInteger(kinds.total);
}

function expectProjectStatsStates(value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  expect(value).toEqual(expect.any(Object));
  const states = value as Record<string, unknown>;
  expectOptionalInteger(states.scheduled);
  expectOptionalInteger(states.completed);
  expectOptionalInteger(states.archived);
}

export function expectTask(value: unknown): asserts value is Task {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      status: expect.stringMatching(/^(scheduled|completed|archived)$/)
    })
  );

  const task = value as Record<string, unknown>;
  expectUuid(task.id);
  expectOptionalIsoDateTime(task.createdAt);
  expectOptionalIsoDateTime(task.updatedAt);

  if (task.project !== undefined && task.project !== null) {
    expectProject(task.project);
  }
}
