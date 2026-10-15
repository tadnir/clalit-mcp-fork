import { describe, expect, test } from "vitest";
import {
  decodeDocumentRef,
  DOCUMENT_SOURCE_IDS,
  encodeDocumentRef,
  parseDocumentsListHtml,
  selectOptions,
} from "../src/documents/index.js";

const GRID = `<table><tr><th>תאריך</th><th>רופא</th><th>תחום</th><th></th></tr>
<tr class="ClalitGridRow">
  <td><span>21.07.2026</span></td><td><span>ישראל ישראלי</span></td><td><span>א.א.ג</span></td>
  <td class="ClalitGridActions"><ul><li><a class="VisitSummaryViewBtn GridBtn" href="javascript:void(0);"
    data-actionurl="/OnlineWeb/api/SummaryLetterPdf/DoesPdfExists/71/11?docId=123456">הצגה</a></li></ul></td>
</tr>
<tr class="ClalitGridAltRow">
  <td><span>01.02.2025</span></td><td><span>פלונית אלמונית</span></td><td><span>אורתופדיה</span></td>
  <td class="ClalitGridActions"><a class="GridBtn" data-actionurl="https://evil.example/steal">x</a></td>
</tr></table>
<select name="ddlHospitalName"><option value="0">בחר בית חולים</option><option value="320">איכילוב</option></select>`;

describe("document sources", () => {
  test("parses rows with portal action URLs only", () => {
    const rows = parseDocumentsListHtml(GRID, "visit_summaries");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.date).toBe("21.07.2026");
    expect(rows[0]!.details).toEqual(["ישראל ישראלי", "א.א.ג"]);
    expect(decodeDocumentRef(rows[0]!.refToken)).toEqual({
      source: "visit_summaries",
      actionUrl: "/OnlineWeb/api/SummaryLetterPdf/DoesPdfExists/71/11?docId=123456",
    });
  });

  test("refuses refs outside the portal API or for unknown sources", () => {
    expect(() =>
      decodeDocumentRef(encodeDocumentRef({ source: "visit_summaries", actionUrl: "https://evil.example/x" })),
    ).toThrow();
    expect(() =>
      decodeDocumentRef(encodeDocumentRef({ source: "nope", actionUrl: "/OnlineWeb/api/X/Y?docId=1" })),
    ).toThrow();
  });

  test("fan-out options skip the placeholder", () => {
    expect(selectOptions(GRID, "ddlHospitalName")).toEqual([["320", "איכילוב"]]);
  });

  test("known sources", () => {
    expect(DOCUMENT_SOURCE_IDS).toContain("visit_summaries");
    expect(DOCUMENT_SOURCE_IDS).toContain("hospital_summaries");
  });
});
