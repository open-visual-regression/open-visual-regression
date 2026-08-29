import type { ComponentProps, MouseEvent } from "react";

const NextLinkStub = ({ onClick, ...props }: ComponentProps<"a">) => (
  <a
    {...props}
    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      event.preventDefault();
    }}
  />
);

export default NextLinkStub;
