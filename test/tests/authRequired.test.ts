import { describe, expect, it } from "vitest";
import { apiRequest } from "./support/http";
import { missingTaskId, seedProject } from "./testData";

describe("GET /users/me", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest("/users/me");

      expect(response.status).toBe(401);
    });
  });
});

describe("GET /users/projects", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest("/users/projects?limit=1&page=1");

      expect(response.status).toBe(401);
    });
  });
});

describe("GET /users/projects/:slug", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest(`/users/projects/${seedProject.slug}`);

      expect(response.status).toBe(401);
    });
  });
});

describe("GET /users/tasks", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest("/users/tasks?limit=20&page=1&status=scheduled");

      expect(response.status).toBe(401);
    });
  });
});

describe("POST /users/tasks", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest("/users/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Unauthorized task",
          kind: "task",
          description: "Created without token.",
          status: "scheduled",
          projectId: "00000000-0000-4000-8000-000000000000",
          startingAt: "2024-01-01",
          deadline: "2024-12-31"
        })
      });

      expect(response.status).toBe(401);
    });
  });
});

describe("GET /users/tasks/:id", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest(`/users/tasks/${missingTaskId}`);

      expect(response.status).toBe(401);
    });
  });
});

describe("PATCH /users/tasks/:id", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest(`/users/tasks/${missingTaskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "Unauthorized task updated",
          kind: "task",
          description: "Updated without token.",
          status: "completed",
          projectId: "00000000-0000-4000-8000-000000000000",
          startingAt: "2024-01-01",
          deadline: "2024-12-31"
        })
      });

      expect(response.status).toBe(401);
    });
  });
});

describe("DELETE /users/tasks/:id", () => {
  describe("異常系", () => {
    it("トークンなしの場合 401 を返す", async () => {
      const response = await apiRequest(`/users/tasks/${missingTaskId}`, {
        method: "DELETE"
      });

      expect(response.status).toBe(401);
    });
  });
});
