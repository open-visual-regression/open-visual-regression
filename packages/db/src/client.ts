import * as organizations from "./repository/organizations";
import * as users from "./repository/users";
import * as projects from "./repository/projects";
import * as apiKeys from "./repository/apiKeys";
import * as variants from "./repository/variants";

export const dbClient = { organizations, users, projects, apiKeys, variants } as const;
