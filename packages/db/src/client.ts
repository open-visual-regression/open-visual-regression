import * as organizations from "./repository/organizations";
import * as users from "./repository/users";
import * as projects from "./repository/projects";

export const dbClient = { organizations, users, projects } as const;
