export const seedUser = {
  email: "test@example.com",
  password: "password",
  username: "Test User",
  status: "active"
} as const;

export const seedProjects = [
  { slug: "programming" },
  { slug: "english" },
  { slug: "design" }
] as const;

export const seedProject = seedProjects[0];

export const missingProjectSlug = "missing-project-for-api-test";

export const missingProjectId = "00000000-0000-4000-8000-000000000001";

export const missingTaskId = "00000000-0000-4000-8000-000000000000";
