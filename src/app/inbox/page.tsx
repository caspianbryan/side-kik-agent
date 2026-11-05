import { MessagesSquareIcon } from "lucide-react";

export default function InboxIndex() {
  return (
    <div className="hidden h-[calc(100vh-11rem)] min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center md:flex">
      <MessagesSquareIcon className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Pick a chat to read it and reply.</p>
    </div>
  );
}
