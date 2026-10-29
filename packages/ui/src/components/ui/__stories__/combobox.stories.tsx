import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "../combobox";

const meta: Meta<typeof ComboboxInput> = {
  title: "UI/Combobox",
  component: ComboboxInput,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ComboboxInput>;

const REPOSITORIES = [
  "acme/api",
  "acme/design-system",
  "acme/marketing-site",
  "acme/mobile",
  "acme/web",
];

const RepositoryCombobox = () => (
  <Combobox items={REPOSITORIES}>
    <ComboboxInput placeholder="search repositories" wrapperClassName="w-72" />
    <ComboboxContent>
      <ComboboxEmpty>no repositories match</ComboboxEmpty>
      <ComboboxList>
        {(repository: string) => (
          <ComboboxItem key={repository} value={repository}>
            {repository}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);

export const Default: Story = {
  render: () => <RepositoryCombobox />,
};

// Items come from the caller, as with a server search; the built-in filter is turned off.
const AsyncCombobox = () => {
  const [query, setQuery] = useState("");
  const items = REPOSITORIES.filter((repository) => repository.includes(query));

  return (
    <Combobox items={items} filter={null} onInputValueChange={setQuery}>
      <ComboboxInput placeholder="search repositories" wrapperClassName="w-72" />
      <ComboboxContent>
        <ComboboxStatus>{items.length === 0 ? "no repositories match" : null}</ComboboxStatus>
        <ComboboxList>
          {(repository: string) => (
            <ComboboxItem key={repository} value={repository}>
              {repository}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export const ExternalFiltering: Story = {
  render: () => <AsyncCombobox />,
};

export const Disabled: Story = {
  render: () => (
    <Combobox items={REPOSITORIES} disabled>
      <ComboboxInput placeholder="search repositories" wrapperClassName="w-72" />
    </Combobox>
  ),
};
