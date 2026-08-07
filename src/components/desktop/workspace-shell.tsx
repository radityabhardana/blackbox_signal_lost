/**
 * Empty workspace shell. The window manager (BBX-010) will render application
 * windows into this region; for the foundation milestone it only shows a
 * status placeholder.
 */
export function WorkspaceShell() {
  return (
    <section
      aria-label="Blackbox analyst workspace"
      data-testid="workspace-shell"
      className="bbx-grid relative h-full min-h-0 overflow-hidden"
    >
      <div className="absolute inset-0 grid place-items-center">
        <p className="px-4 text-center font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          Workspace ready — no applications open
        </p>
      </div>
    </section>
  );
}
