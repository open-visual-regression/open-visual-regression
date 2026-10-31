// Rspack merges both imports into this story and can list greeting.js as loaded by the stories glob.
import { GREETING } from "../../shared/greeting";
import { Card } from "./Card";
import { LABELS } from "./labels";

export default {
  title: "Components/Card",
  component: Card,
};

export const Default = {
  args: { children: `${LABELS.primary}: ${GREETING}` },
};
