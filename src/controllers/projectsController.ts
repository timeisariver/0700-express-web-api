import type { RequestHandler } from "express";
import { notFound, unauthorized } from "../lib/httpError";
import { parsePagination, toPageInfo } from "../lib/pagination";
import { findProjectBySlug, findProjectsByUser } from "../models/projectModel";

export const listProjects: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  const pagination = parsePagination(req.query);
  const { projects, totalCount } = await findProjectsByUser(userId, pagination);

  res.status(200).json({ data: projects, pageInfo: toPageInfo(totalCount, pagination) });
};

export const getProject: RequestHandler<{ slug: string }> = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  const project = await findProjectBySlug(userId, req.params.slug);
  if (!project) throw notFound("Project not found");

  res.status(200).json({ data: project });
};
