declare global {
  namespace Express {
    interface Request {
      // requireAuth が入れる、ログイン中のユーザー
      user?: { id: string };
    }
  }
}

export {};
