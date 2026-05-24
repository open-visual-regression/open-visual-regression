import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LoaderCircleIcon,
  PlusIcon,
  SettingsIcon,
  TriangleAlertIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { Icon } from "../icon";

const meta: Meta<typeof Icon> = {
  title: "UI/Icon",
  component: Icon,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Icon>;

const ICONS = [
  { name: "AlertCircle", icon: AlertCircleIcon },
  { name: "CircleCheck", icon: CircleCheckIcon },
  { name: "LoaderCircle", icon: LoaderCircleIcon },
  { name: "TriangleAlert", icon: TriangleAlertIcon },
  { name: "CircleX", icon: CircleXIcon },
  { name: "Eye", icon: EyeIcon },
  { name: "EyeOff", icon: EyeOffIcon },
  { name: "ChevronLeft", icon: ChevronLeftIcon },
  { name: "ChevronRight", icon: ChevronRightIcon },
  { name: "X", icon: XIcon },
  { name: "Plus", icon: PlusIcon },
  { name: "Settings", icon: SettingsIcon },
  { name: "Users", icon: UsersIcon },
  { name: "Key", icon: KeyIcon },
] as const;

const SIZES = [14, 16, 20] as const;

export const Grid: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${SIZES.length}, 60px)`,
          gap: "8px",
          alignItems: "center",
        }}
      >
        {/* Header row */}
        <div className="text-xs text-muted-foreground font-mono font-semibold">Icon</div>
        {SIZES.map((size) => (
          <div
            key={size}
            className="text-xs text-muted-foreground font-mono font-semibold text-center"
          >
            {size}px
          </div>
        ))}

        {/* Icon rows */}
        {ICONS.map(({ name, icon }) => (
          <>
            <div key={`${name}-label`} className="text-xs font-mono text-ovr-fg-secondary">
              {name}
            </div>
            {SIZES.map((size) => (
              <div key={`${name}-${size}`} className="flex items-center justify-center">
                <Icon icon={icon} size={size} />
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  ),
};
