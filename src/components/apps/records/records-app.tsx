"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { buildRecordsModel } from "@/domain/records";
import { RecordsList } from "./records-list";
import { RecordDetail } from "./record-detail";

export function RecordsApp() {
  const session = useOptionalCaseSession();
  const searchInputId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [queryText, setQueryText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const view = useMemo(() => {
    if (session === null) return null;

    return buildRecordsModel({
      content: session.content,
      state: session.state,
      searchQuery,
      selectedRecordId,
    });
  }, [session, searchQuery, selectedRecordId]);

  if (view === null) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(queryText.trim());
    setSelectedRecordId(null);
  };

  const handleSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    session?.dispatch({ kind: "game_event", event: { type: "record_opened", entityId: recordId } });
  };

  const handleBack = () => {
    setSelectedRecordId(null);
    searchInputRef.current?.focus();
  };

  const hasDetail = view.kind === "ok" && view.detail !== null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Records</h2>
        {hasDetail ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-sm border border-bbx-surface-2 px-2 py-1 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2 hover:bg-bbx-surface-2 focus-visible:outline-1 focus-visible:outline-bbx-accent"
          >
            Back
          </button>
        ) : null}
      </header>
      <form role="search" onSubmit={handleSubmit} className="px-4 pb-2">
        <label
          htmlFor={searchInputId}
          className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2"
        >
          Search records
        </label>
        <div className="mt-1 flex gap-2">
          <input
            ref={searchInputRef}
            id={searchInputId}
            type="search"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search records"
            className="w-full min-w-0 rounded-sm border border-bbx-surface-2 bg-bbx-surface-0 px-3 py-2 text-sm text-bbx-text-1 outline-none focus:border-bbx-accent"
          />
          <button
            type="submit"
            className="shrink-0 rounded-sm border border-bbx-surface-2 px-3 py-2 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-1 hover:bg-bbx-surface-2 focus-visible:outline-1 focus-visible:outline-bbx-accent"
          >
            Search
          </button>
        </div>
      </form>
      {view.kind === "search-prompt" ? (
        <p className="px-4 pb-3 font-mono text-xs text-bbx-text-2">
          Search the archive to find records.
        </p>
      ) : (
        <>
          <RecordsList
            rows={view.rows}
            selectedRecordId={selectedRecordId}
            onSelect={handleSelect}
          />
          {view.rows.length === 0 ? (
            <p className="px-4 pb-3 font-mono text-xs text-bbx-text-2">
              No records match your search.
            </p>
          ) : null}
        </>
      )}
      <RecordDetail detail={view.kind === "ok" ? view.detail : null} />
    </div>
  );
}