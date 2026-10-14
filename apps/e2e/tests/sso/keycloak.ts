import { getIdentityProviderURL } from "../constants";

const REALM = "ovr";

const getAdminToken = async (): Promise<string> => {
  const response = await fetch(
    `${getIdentityProviderURL()}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: "admin",
        password: "admin",
      }),
    },
  );
  const { access_token } = (await response.json()) as { access_token: string };
  return access_token;
};

const adminFetch = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${getIdentityProviderURL()}/admin/realms/${REALM}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${await getAdminToken()}`, ...init.headers },
  });

  if (!response.ok) {
    throw new Error(`keycloak ${init.method ?? "GET"} ${path} failed with ${response.status}`);
  }

  return response;
};

const findId = async (path: string): Promise<string> => {
  const [match] = (await (await adminFetch(path)).json()) as { id: string }[];

  if (!match) {
    throw new Error(`keycloak found nothing at ${path}`);
  }

  return match.id;
};

const membershipPath = async (username: string, group: string) => {
  const [userId, groupId] = await Promise.all([
    findId(`/users?exact=true&username=${encodeURIComponent(username)}`),
    findId(`/groups?exact=true&search=${encodeURIComponent(group)}`),
  ]);
  return `/users/${userId}/groups/${groupId}`;
};

export const addToGroup = async (username: string, group: string) => {
  await adminFetch(await membershipPath(username, group), { method: "PUT" });
};

export const removeFromGroup = async (username: string, group: string) => {
  await adminFetch(await membershipPath(username, group), { method: "DELETE" });
};
