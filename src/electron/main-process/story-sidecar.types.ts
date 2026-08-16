// Kept separate from story-sidecar.ts (which imports fs-extra) so this can be
// imported by shared/renderer code without pulling Node runtime code into the
// web bundle. See stories.types.ts for the established convention this
// follows.

export type StorySidecar = Record<string, unknown>;
