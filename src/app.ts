import express, { type Express } from "express";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiRouter } from "./routes";

export const app: Express = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
