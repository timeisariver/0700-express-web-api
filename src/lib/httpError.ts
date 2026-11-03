export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const badRequest = (message = "Invalid request"): HttpError =>
  new HttpError(400, message);

export const unauthorized = (message = "Unauthorized"): HttpError =>
  new HttpError(401, message);

export const notFound = (message = "Not found"): HttpError =>
  new HttpError(404, message);

export const conflict = (message: string): HttpError =>
  new HttpError(409, message);
