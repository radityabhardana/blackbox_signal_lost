import { SystemTime } from "@/components/desktop/system-time";

export function Taskbar() {
  return (
    <footer
      aria-label="Taskbar"
      className="z-bbx-taskbar flex h-12 shrink-0 items-center gap-3 border-t border-bbx-surface-2 bg-bbx-bg-1 px-3"
    >
      <nav aria-label="Application launcher">
        <button
          type="button"
          disabled
          title="Application launcher — available with the window manager"
          className="bbx-btn px-2 py-1 text-[0.625rem]"
        >
          Launcher
        </button>
      </nav>
      <span className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
        Case: none
      </span>
      <span className="ml-auto font-mono text-xs tabular-nums text-bbx-text-2">
        <SystemTime />
      </span>
    </footer>
  );
}
