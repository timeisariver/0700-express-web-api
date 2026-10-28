import { describe, expect, it } from "vitest";
import { expectPageInfo } from "./support/assertions";
import { Project, expectProject } from "./support/contracts";
import { apiRequestWithToken, loginAsSeedUser } from "./support/http";
import { missingProjectSlug, seedProject, seedProjects } from "./testData";

async function getProjectPage(token: string, page: number): Promise<Project> {
  const response = await apiRequestWithToken<{ data: unknown[]; pageInfo: unknown }>(
    `/users/projects?limit=1&page=${page}`,
    token
  );

  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expectPageInfo(response.body.pageInfo, { limit: 1, page });
  expectProject(response.body.data[0]);

  return response.body.data[0];
}

describe("GET /users/projects", () => {
  describe("正常系", () => {
    describe("ページネーション", () => {
      it("limit と page を指定して取得できる", async () => {
        const token = await loginAsSeedUser();

        const response = await apiRequestWithToken<{ data: unknown[]; pageInfo: unknown }>(
          "/users/projects?limit=1&page=1",
          token
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(1);
        expectPageInfo(response.body.pageInfo, { limit: 1, page: 1 });
        response.body.data.forEach(expectProject);
      });

      it("3 ページに分けて順番通りに取得できる", async () => {
        const token = await loginAsSeedUser();

        const projects = await Promise.all(
          seedProjects.map((_, index) => getProjectPage(token, index + 1))
        );

        expect(projects.map((project) => project.slug)).toEqual(
          seedProjects.map((project) => project.slug)
        );
        expect(new Set(projects.map((project) => project.id)).size).toBe(
          projects.length
        );
      });
    });
  });
});

describe("GET /users/projects/:slug", () => {
  describe("正常系", () => {
    it("slug でプロジェクトを取得できる", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken<{ data: unknown }>(
        `/users/projects/${seedProject.slug}`,
        token
      );

      expect(response.status).toBe(200);
      expectProject(response.body.data);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          slug: seedProject.slug
        })
      );
    });
  });

  describe("異常系", () => {
    it("存在しない slug は 404 を返す", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken(
        `/users/projects/${missingProjectSlug}`,
        token
      );

      expect(response.status).toBe(404);
    });
  });
});
