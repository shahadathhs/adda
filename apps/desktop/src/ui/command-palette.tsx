import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  onSelect: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: PaletteAction[];
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-24 z-50 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-sm border border-line bg-panel shadow-2xl outline-none">
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command label="Command palette" className="font-num">
            <Command.Input
              autoFocus
              placeholder="Type a command…"
              className="h-9 w-full border-b border-line bg-transparent px-3 text-xs outline-none placeholder:text-muted/60"
            />
            <Command.List className="max-h-72 overflow-y-auto p-1">
              <Command.Empty className="py-6 text-center text-xs text-muted">
                No matching command.
              </Command.Empty>
              {Object.entries(
                actions.reduce<Record<string, PaletteAction[]>>((acc, a) => {
                  (acc[a.group] ??= []).push(a);
                  return acc;
                }, {}),
              ).map(([group, items]) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted"
                >
                  {items.map((a) => (
                    <Command.Item
                      key={a.id}
                      value={`${group} ${a.label}`}
                      onSelect={() => {
                        onOpenChange(false);
                        a.onSelect();
                      }}
                      className="flex cursor-default items-center justify-between rounded-xs px-2 py-1.5 text-xs data-[selected=true]:bg-accent/25"
                    >
                      {a.label}
                      {a.hint && <span className="text-2xs text-muted">{a.hint}</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
