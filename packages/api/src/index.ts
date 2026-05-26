import { setupRouter } from "./routers/setup";

export const router = {
  setup: setupRouter,
};

export type Router = typeof router;
