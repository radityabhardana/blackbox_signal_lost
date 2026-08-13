import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CaseSessionProvider, useCaseSession, useOptionalCaseSession } from "@/features/session/case-session";
import { createNotificationTestSession } from "@/test/fixtures/notification-content";
import { NotificationCenter } from "./notification-center";

function renderCenter(initialState = createNotificationTestSession().initialState) {
  const session = createNotificationTestSession();
  return render(
    <CaseSessionProvider
      content={session.content}
      mailChannelId="channel_test"
      initialState={initialState}
    >
      <NotificationCenter />
    </CaseSessionProvider>,
  );
}

function SessionStateProbe() {
  const session = useOptionalCaseSession();
  if (session === null) return null;

  return (
    <output data-testid="notification-session-state">
      {JSON.stringify({
        notifications: session.state.notifications,
        eventHistory: session.state.eventHistory,
      })}
    </output>
  );
}

function NotificationArrivalControl() {
  const session = useCaseSession();
  return (
    <button
      type="button"
      onClick={() => session.dispatch({ kind: "game_event", event: { type: "notification_test_arrival" } })}
    >
      Dispatch notification arrival
    </button>
  );
}

function readSessionState(): { notifications: string[]; eventHistory: unknown[] } {
  return JSON.parse(screen.getByTestId("notification-session-state").textContent!) as {
    notifications: string[];
    eventHistory: unknown[];
  };
}

describe("NotificationCenter without a session", () => {
  it("renders an enabled trigger and honest empty panel", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    const trigger = screen.getByRole("button", { name: "Notification center" });
    expect(trigger).toBeEnabled();
    await user.click(trigger);
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });
});

describe("NotificationCenter with a session", () => {
  it("opens and closes from the trigger without moving focus", async () => {
    const user = userEvent.setup();
    renderCenter();
    const trigger = screen.getByRole("button", { name: "Notification center" });

    trigger.focus();
    await user.click(trigger);
    expect(screen.getByRole("region", { name: "Notification center" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveClass("bbx-btn-primary");

    await user.click(trigger);
    expect(screen.queryByRole("region", { name: "Notification center" })).not.toBeInTheDocument();
    expect(trigger).not.toHaveClass("bbx-btn-primary");
  });

  it("closes on Escape from the focused trigger and keeps trigger focus", async () => {
    const user = userEvent.setup();
    renderCenter();
    const trigger = screen.getByRole("button", { name: "Notification center" });

    trigger.focus();
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "Notification center" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Notification center" })).not.toBeInTheDocument();
  });

  it("does not mutate authoritative notifications or history while reviewing the panel", async () => {
    const user = userEvent.setup();
    const session = createNotificationTestSession();
    render(
      <CaseSessionProvider content={session.content} mailChannelId="channel_test" initialState={session.initialState}>
        <NotificationCenter />
        <SessionStateProbe />
      </CaseSessionProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Notification center" });
    const snapshot = readSessionState();
    const expectAuthoritativeStateUnchanged = () => expect(readSessionState()).toEqual(snapshot);

    await user.click(trigger);
    expectAuthoritativeStateUnchanged();
    await user.click(trigger);
    expectAuthoritativeStateUnchanged();
    await user.click(trigger);
    expectAuthoritativeStateUnchanged();
    await user.keyboard("{Escape}");
    expectAuthoritativeStateUnchanged();
    await user.click(trigger);
    expectAuthoritativeStateUnchanged();

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    fireEvent.pointerDown(outside);
    expectAuthoritativeStateUnchanged();
    outside.remove();
  });

  it("renders order, duplicates, and textual priorities", async () => {
    const user = userEvent.setup();
    renderCenter();
    await user.click(screen.getByRole("button", { name: "Notification center" }));

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toEqual([
      "InformationalTest notification A.",
      "InformationalTest notification A.",
      "System anomalyTest notification B.",
    ]);
  });

  it("keeps inside pointerdowns open and closes outside without refocusing trigger", async () => {
    const user = userEvent.setup();
    renderCenter();
    const trigger = screen.getByRole("button", { name: "Notification center" });
    await user.click(trigger);
    const panel = screen.getByRole("region", { name: "Notification center" });

    fireEvent.pointerDown(trigger);
    expect(panel).toBeInTheDocument();
    fireEvent.pointerDown(panel);
    expect(panel).toBeInTheDocument();

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    fireEvent.pointerDown(outside);
    expect(screen.queryByRole("region", { name: "Notification center" })).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("registers and removes the exact outside-pointer listener without stale registrations", async () => {
    const user = userEvent.setup();
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    const pointerAdds = () => addListener.mock.calls.filter(([type]) => type === "pointerdown");
    const pointerRemovals = () => removeListener.mock.calls.filter(([type]) => type === "pointerdown");
    const unrelatedListener = vi.fn();
    document.addEventListener("pointerdown", unrelatedListener);

    try {
      const rendered = renderCenter();
      const trigger = screen.getByRole("button", { name: "Notification center" });
      const closedBaseline = pointerAdds();

      // The known listener supplies document-level noise; closed NotificationCenter adds none.
      expect(closedBaseline).toHaveLength(1);
      expect(closedBaseline[0]![1]).toBe(unrelatedListener);

      const addsBeforeFirstOpen = pointerAdds().length;
      await user.click(trigger);
      const firstOpenAdds = pointerAdds().slice(addsBeforeFirstOpen);
      expect(firstOpenAdds).toHaveLength(1);
      const firstCallback = firstOpenAdds[0]![1];
      expect(firstCallback).not.toBe(unrelatedListener);

      const removalsBeforeFirstClose = pointerRemovals().length;
      await user.click(trigger);
      const firstCloseRemovals = pointerRemovals().slice(removalsBeforeFirstClose);
      expect(firstCloseRemovals).toHaveLength(1);
      expect(firstCloseRemovals[0]![1]).toBe(firstCallback);

      const addsBeforeReopen = pointerAdds().length;
      await user.click(trigger);
      const reopenAdds = pointerAdds().slice(addsBeforeReopen);
      expect(reopenAdds).toHaveLength(1);
      const activeCallback = reopenAdds[0]![1];
      expect(activeCallback).not.toBe(unrelatedListener);
      expect(activeCallback).not.toBe(firstCallback);

      const removalsBeforeUnmount = pointerRemovals().length;
      rendered.unmount();
      const unmountRemovals = pointerRemovals().slice(removalsBeforeUnmount);
      expect(unmountRemovals).toHaveLength(1);
      expect(unmountRemovals[0]![1]).toBe(activeCallback);
    } finally {
      document.removeEventListener("pointerdown", unrelatedListener);
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });

  it("keeps trigger focus when a real engine event adds a notification", async () => {
    const session = createNotificationTestSession();
    render(
      <CaseSessionProvider content={session.content} mailChannelId="channel_test" initialState={session.initialState}>
        <NotificationCenter />
        <NotificationArrivalControl />
        <SessionStateProbe />
      </CaseSessionProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Notification center" });
    const before = readSessionState();

    trigger.focus();
    fireEvent.click(screen.getByRole("button", { name: "Dispatch notification arrival" }));

    expect(readSessionState().notifications).toEqual([...before.notifications, "notification_test_b"]);
    expect(readSessionState().eventHistory).toEqual([
      ...before.eventHistory,
      { type: "notification_test_arrival" },
    ]);
    expect(trigger).toHaveFocus();
  });
});
