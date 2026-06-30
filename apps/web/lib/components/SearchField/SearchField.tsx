import { Icon, SearchIcon, XIcon } from "@ovr/ui/components/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ovr/ui/components/input-group";
import Form from "next/form";
import Link from "next/link";

export type SearchFieldProps = {
  action: string;
  label: string;
  placeholder?: string;
  search?: string;
  className?: string;
};

export const SearchField = ({
  action,
  label,
  placeholder = "search...",
  search,
  className,
}: SearchFieldProps) => (
  <Form action={action} role="search" className={className}>
    <InputGroup>
      <InputGroupInput
        key={search}
        name="search"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={search}
      />
      <InputGroupAddon align="inline-end">
        {search ? (
          <InputGroupButton
            aria-label="clear search"
            render={<Link href={action} />}
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
