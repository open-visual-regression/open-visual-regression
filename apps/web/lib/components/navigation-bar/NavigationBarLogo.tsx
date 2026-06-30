import Link from "next/link";

import { Logo } from "../logo/Logo";

const NavigationBarLogo = () => (
  <Link href="/projects" className="inline-flex items-center no-underline">
    <Logo size="sm" />
  </Link>
);

export { NavigationBarLogo };
