import { Logo } from "../../../lib/components/logo/Logo";
import { NavigationBar } from "../../../lib/components/navigation-bar/NavigationBar";

export default function NavigationPage() {
  return (
    <NavigationBar>
      <Logo size="sm" />
    </NavigationBar>
  );
}
