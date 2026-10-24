import { redirect } from "next/navigation";

/** The old directory page is now search with an empty query. */
export default function ChannelsRedirect() {
  redirect("/search");
}
