const SIDEBAR_COLLAPSED_COOKIE = "ovr-sidebar-collapsed";

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

const getInitialSidebarCollapsed = (cookieStore: CookieStore) =>
  cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

const setSidebarCollapsedCookie = (collapsed: boolean) => {
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${collapsed}; path=/; max-age=31536000; samesite=lax`;
};

export { getInitialSidebarCollapsed, setSidebarCollapsedCookie };
