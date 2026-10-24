/** Spread onto an input so the field's message is announced with it. */
export const describedBy = (id: string, hasMessage: boolean, error?: string | null) => ({
  "aria-describedby": hasMessage ? `${id}-msg` : undefined,
  "aria-invalid": error ? true : undefined,
});
