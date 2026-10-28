import { expect } from "vitest";
import { apiBaseUrl } from "../config";
import { seedUser } from "../testData";

export type ApiResponse<TBody = unknown> = {
  status: number;
  body: TBody;
};

export async function apiRequest<TBody = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<TBody>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const text = await response.text();
  const body = text.length > 0 ? parseResponseBody<TBody>(text) : (undefined as TBody);

  return {
    status: response.status,
    body
  };
}

function parseResponseBody<TBody>(text: string): TBody {
  try {
    return JSON.parse(text) as TBody;
  } catch {
    return text as TBody;
  }
}

export async function apiRequestWithToken<TBody = unknown>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<TBody>> {
  return apiRequest<TBody>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
}

export async function loginAsSeedUser(): Promise<string> {
  const response = await apiRequest<{ data?: { accessToken?: unknown } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: seedUser.email,
      password: seedUser.password
    })
  });

  expect(
    response.status,
    `seed ユーザーでログインできません。npm run db:seed で ${seedUser.email} / ${seedUser.password} のユーザーを投入してください。`
  ).toBe(200);
  expect(response.body).toHaveProperty("data.accessToken");
  const accessToken = response.body.data?.accessToken;
  expect(typeof accessToken).toBe("string");

  return accessToken as string;
}
