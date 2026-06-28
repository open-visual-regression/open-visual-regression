import Form from "next/form";
import Link from "next/link";
import { Icon, SearchIcon, XIcon } from "@ovr/ui/components/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ovr/ui/components/input-group";

type BuildsSearchFieldProps = {
  projectId: string;
  search?: string;
  className?: string;
};

export const BuildsSearchField = ({ projectId, search, className }: BuildsSearchFieldProps) => (
  <Form action={`/projects/${projectId}`} role="search" className={className}>
    <InputGroup>
      <InputGroupInput
        key={search}
        name="search"
        aria-label="search builds"
        placeholder="search builds..."
        defaultValue={search}
      />
      <InputGroupAddon align="inline-end">
        {search ? (
          <InputGroupButton
            aria-label="clear search"
            render={<Link href={`/projects/${projectId}`} />}
            nativeButton={false}
          >
            <Icon icon={XIcon} />
          </InputGroupButton>
        ) : null}
        <InputGroupButton type="submit" aria-label="search">
          <Icon icon={SearchIcon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </Form>
);
