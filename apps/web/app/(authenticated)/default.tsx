import { notFound } from "next/navigation";

// Fallback for the `children` slot when only `@navigation/[...pathname]` matches.
// Strict route matching requires every sibling slot to have a page or default.
export default function AuthenticatedDefault() {
  notFound();
}
