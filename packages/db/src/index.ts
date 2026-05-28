import * as organizations from "./repository/organizations";
import * as users from "./repository/users";

export const db = { organizations, users } as const;
