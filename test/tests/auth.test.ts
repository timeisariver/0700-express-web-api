import { describe, expect, it } from "vitest";
import { expectAuthData } from "./support/contracts";
import { apiRequest } from "./support/http";
import { seedUser } from "./testData";

describe("POST /auth/login", () => {
  describe("正常系", () => {
    it("seed ユーザーでログインできる", async () => {
      const response = await apiRequest<{ data: unknown }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: seedUser.email,
          password: seedUser.password
        })
      });

      expect(response.status).toBe(200);
      expectAuthData(response.body.data);
    });
  });

  describe("異常系", () => {
    it("不正なログインは 401 を返す", async () => {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: seedUser.email,
          password: "wrong-password"
        })
      });

      expect(response.status).toBe(401);
    });
  });
});

describe("POST /auth/signup", () => {
  describe("正常系", () => {
    it("一意なメールアドレスで signup できる", async () => {
      const unique = `test-${Date.now()}-${crypto.randomUUID()}@example.com`;

      const response = await apiRequest<{ data: unknown }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "api-test-user",
          email: unique,
          email_confirmation: unique,
          password: "password",
          password_confirmation: "password"
        })
      });

      expect(response.status).toBe(200);
      expectAuthData(response.body.data);
    });
  });

  describe("異常系", () => {
    it("重複したメールアドレスで signup すると 409 を返す", async () => {
      const response = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicate-seed-user",
          email: seedUser.email,
          email_confirmation: seedUser.email,
          password: "password",
          password_confirmation: "password"
        })
      });

      expect(response.status).toBe(409);
    });
  });
});
