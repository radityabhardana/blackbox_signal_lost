import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RecordDetailViewModel } from "@/domain/records";
import { renderWithProviders } from "@/test/helpers/render";
import { RecordDetail } from "./record-detail";

function makeDetail(overrides: Partial<RecordDetailViewModel>): RecordDetailViewModel {
  return {
    recordId: "record_test",
    title: "Test record",
    recordType: "test",
    createdAt: "2041-11-18T22:00:00Z",
    revisedAt: null,
    sourceLabel: "test",
    relatedLabels: [],
    evidenceLabel: null,
    metadata: [],
    ...overrides,
  };
}

describe("RecordDetail", () => {
  it("renders the decorative evidence visual for a mapped record", () => {
    renderWithProviders(
      <RecordDetail
        detail={makeDetail({ recordId: "rec_001_ferry_departure", title: "Ferry Departure Record" })}
      />,
    );
    const region = screen.getByRole("region", { name: "Record" });
    expect(region.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Ferry Departure Record")).toBeInTheDocument();
  });

  it("renders no visual for an unmapped record", () => {
    renderWithProviders(<RecordDetail detail={makeDetail({ recordId: "record_test" })} />);
    const region = screen.getByRole("region", { name: "Record" });
    expect(region.querySelector("svg[aria-hidden='true']")).toBeNull();
    expect(screen.getByText("Test record")).toBeInTheDocument();
  });

  it("renders the empty prompt without a visual when no record is selected", () => {
    renderWithProviders(<RecordDetail detail={null} />);
    expect(screen.getByText(/select a record to read/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Record" }).querySelector("svg")).toBeNull();
  });
});
