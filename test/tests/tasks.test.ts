import { describe, expect, it } from "vitest";
import { expectPageInfo } from "./support/assertions";
import { Project, Task, expectProject, expectTask } from "./support/contracts";
import { apiRequestWithToken, loginAsSeedUser } from "./support/http";
import { missingProjectId, missingTaskId, seedProject } from "./testData";

type TaskPayload = {
  title: string;
  kind: string;
  description: string;
  status: string;
  projectId: string;
  startingAt: string;
  deadline: string;
};

type InvalidTaskPayloadCase = {
  name: string;
  override: Partial<TaskPayload>;
};

const invalidTaskPayloadCases: InvalidTaskPayloadCase[] = [
  {
    name: "不正な status",
    override: {
      status: "invalid-status"
    }
  },
  {
    name: "存在しない project id",
    override: {
      projectId: missingProjectId
    }
  },
  {
    name: "不正な kind",
    override: {
      kind: "invalid-kind"
    }
  },
  {
    name: "不正な deadline",
    override: {
      deadline: "invalid-date"
    }
  }
];

async function getSeedProject(token: string): Promise<Project> {
  const response = await apiRequestWithToken<{ data: unknown }>(
    `/users/projects/${seedProject.slug}`,
    token
  );

  expect(response.status).toBe(200);
  expectProject(response.body.data);

  return response.body.data;
}

function createTaskPayload(projectId: string, override: Partial<TaskPayload> = {}): TaskPayload {
  return {
    title: `API test task ${crypto.randomUUID()}`,
    kind: "task",
    description: "Created by black-box API test.",
    status: "scheduled",
    projectId,
    startingAt: "2024-01-01",
    deadline: "2024-12-31",
    ...override
  };
}

async function createTask(token: string, projectId: string): Promise<Task> {
  const response = await apiRequestWithToken<{ data: unknown }>("/users/tasks", token, {
    method: "POST",
    body: JSON.stringify(createTaskPayload(projectId))
  });

  expect(response.status).toBe(201);
  expectTask(response.body.data);

  return response.body.data;
}

async function deleteTask(token: string, taskId: string): Promise<void> {
  await apiRequestWithToken(`/users/tasks/${taskId}`, token, {
    method: "DELETE"
  });
}

async function getTaskPage(token: string, page: number): Promise<Task> {
  const response = await apiRequestWithToken<{ data: unknown[]; pageInfo: unknown }>(
    `/users/tasks?limit=1&page=${page}&status=scheduled`,
    token
  );

  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expectPageInfo(response.body.pageInfo, { limit: 1, page });
  expectTask(response.body.data[0]);
  expect(response.body.data[0]).toEqual(
    expect.objectContaining({
      status: "scheduled"
    })
  );

  return response.body.data[0];
}

describe("GET /users/tasks", () => {
  describe("正常系", () => {
    it("status で絞り込める", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken<{ data: unknown[]; pageInfo: unknown }>(
        "/users/tasks?limit=20&page=1&status=scheduled",
        token
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expectPageInfo(response.body.pageInfo, { limit: 20, page: 1 });

      response.body.data.forEach((task) => {
        expectTask(task);
        expect(task).toEqual(
          expect.objectContaining({
            status: "scheduled"
          })
        );
      });
    });

    describe("ページネーション", () => {
      it("3 ページに分けて取得できる", async () => {
        const token = await loginAsSeedUser();
        const project = await getSeedProject(token);
        const createdTasks = await Promise.all([
          createTask(token, project.id),
          createTask(token, project.id),
          createTask(token, project.id)
        ]);

        try {
          const tasks = await Promise.all([
            getTaskPage(token, 1),
            getTaskPage(token, 2),
            getTaskPage(token, 3)
          ]);

          expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
        } finally {
          await Promise.all(createdTasks.map((task) => deleteTask(token, task.id)));
        }
      });
    });
  });
});

describe("POST /users/tasks", () => {
  describe("正常系", () => {
    it("タスクを作成できる", async () => {
      const token = await loginAsSeedUser();
      const project = await getSeedProject(token);
      const title = `API test task ${crypto.randomUUID()}`;

      const response = await apiRequestWithToken<{ data: unknown }>("/users/tasks", token, {
        method: "POST",
        body: JSON.stringify({
          title,
          kind: "task",
          description: "Created by black-box API test.",
          status: "scheduled",
          projectId: project.id,
          startingAt: "2024-01-01",
          deadline: "2024-12-31"
        })
      });

      expect(response.status).toBe(201);
      expectTask(response.body.data);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title,
          description: "Created by black-box API test.",
          status: "scheduled"
        })
      );

      await deleteTask(token, response.body.data.id);
    });
  });

  describe("異常系", () => {
    it("不正な payload で 400 を返す", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken("/users/tasks", token, {
        method: "POST",
        body: JSON.stringify({
          title: ""
        })
      });

      expect(response.status).toBe(400);
    });

    describe("バリデーション", () => {
      it.each(invalidTaskPayloadCases)(
        "$name を指定した場合、400 Bad Request を返す",
        async ({ override }) => {
          const token = await loginAsSeedUser();
          const project = await getSeedProject(token);

          const response = await apiRequestWithToken("/users/tasks", token, {
            method: "POST",
            body: JSON.stringify(createTaskPayload(project.id, override))
          });

          expect(response.status).toBe(400);
        }
      );
    });
  });
});

describe("GET /users/tasks/:id", () => {
  describe("正常系", () => {
    it("作成済みタスク ID で取得できる", async () => {
      const token = await loginAsSeedUser();
      const project = await getSeedProject(token);
      const task = await createTask(token, project.id);

      try {
        const response = await apiRequestWithToken<{ data: unknown }>(
          `/users/tasks/${task.id}`,
          token
        );

        expect(response.status).toBe(200);
        expectTask(response.body.data);
        expect(response.body.data).toEqual(
          expect.objectContaining({
            id: task.id,
            title: task.title
          })
        );
      } finally {
        await deleteTask(token, task.id);
      }
    });
  });

  describe("異常系", () => {
    it("存在しない task ID は 404 を返す", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken(`/users/tasks/${missingTaskId}`, token);

      expect(response.status).toBe(404);
    });
  });
});

describe("PATCH /users/tasks/:id", () => {
  describe("正常系", () => {
    it("作成済みタスク ID と正しい payload で更新できる", async () => {
      const token = await loginAsSeedUser();
      const project = await getSeedProject(token);
      const task = await createTask(token, project.id);

      try {
        const response = await apiRequestWithToken<{ data: unknown }>(
          `/users/tasks/${task.id}`,
          token,
          {
            method: "PATCH",
            body: JSON.stringify({
              title: `${task.title} updated`,
              kind: "task",
              description: "Updated by black-box API test.",
              status: "completed",
              projectId: project.id,
              startingAt: "2024-01-01",
              deadline: "2024-12-31"
            })
          }
        );

        expect(response.status).toBe(200);
        expectTask(response.body.data);
        expect(response.body.data).toEqual(
          expect.objectContaining({
            id: task.id,
            title: `${task.title} updated`,
            description: "Updated by black-box API test.",
            status: "completed"
          })
        );
      } finally {
        await deleteTask(token, task.id);
      }
    });
  });

  describe("異常系", () => {
    it("存在しない task ID は 404 を返す", async () => {
      const token = await loginAsSeedUser();
      const project = await getSeedProject(token);

      const response = await apiRequestWithToken(`/users/tasks/${missingTaskId}`, token, {
        method: "PATCH",
        body: JSON.stringify(createTaskPayload(project.id))
      });

      expect(response.status).toBe(404);
    });

    describe("バリデーション", () => {
      it.each(invalidTaskPayloadCases)(
        "$name を指定した場合、400 Bad Request を返す",
        async ({ override }) => {
          const token = await loginAsSeedUser();
          const project = await getSeedProject(token);
          const task = await createTask(token, project.id);

          try {
            const response = await apiRequestWithToken(`/users/tasks/${task.id}`, token, {
              method: "PATCH",
              body: JSON.stringify(createTaskPayload(project.id, override))
            });

            expect(response.status).toBe(400);
          } finally {
            await deleteTask(token, task.id);
          }
        }
      );
    });
  });
});

describe("DELETE /users/tasks/:id", () => {
  describe("正常系", () => {
    it("作成済みタスク ID で削除できる", async () => {
      const token = await loginAsSeedUser();
      const project = await getSeedProject(token);
      const task = await createTask(token, project.id);

      const response = await apiRequestWithToken<{ data: unknown }>(
        `/users/tasks/${task.id}`,
        token,
        {
          method: "DELETE"
        }
      );

      expect(response.status).toBe(200);
      expectTask(response.body.data);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: task.id
        })
      );
    });
  });

  describe("異常系", () => {
    it("存在しない task ID は 404 を返す", async () => {
      const token = await loginAsSeedUser();

      const response = await apiRequestWithToken(`/users/tasks/${missingTaskId}`, token, {
        method: "DELETE"
      });

      expect(response.status).toBe(404);
    });
  });
});
