import type { DocumentSource } from "./types.js";

const BODY = "ctl00$ctl00$cphBody$bodyContent$";

/** Document sources observed on the portal. Never widen without evidence. */
export const DOCUMENT_SOURCES: readonly DocumentSource[] = [
  {
    id: "visit_summaries",
    title: "סיכומי ביקור רפואה יועצת",
    description: "Specialist (consulting medicine) visit summaries.",
    path: "/OnlineWeb/Services/VisitSummaries/VisitSummaries.aspx",
    pdfPath: "/OnlineWeb/Services/VisitSummaries/VisitSummariesPDF.ashx?show=true",
    search: {
      fromField: `${BODY}DatepickerRangeCalendar1$txtFromDate`,
      toField: `${BODY}DatepickerRangeCalendar1$txtToDate`,
      minDate: "01.01.2012",
      submit: `${BODY}btnShow$lnkSubButton`,
      fields: { [`${BODY}ddlConsultingArea`]: "0" },
    },
  },
  {
    id: "hospital_summaries",
    title: "סיכומים מבתי חולים",
    description: "Hospital discharge / summary letters, searched per hospital.",
    path: "/OnlineWeb/Services/SummaryLetter/SummaryLetter.aspx",
    pdfPath: "/OnlineWeb/Services/SummaryLetter/SummaryLetterPDF.ashx?show=true",
    search: {
      fromField: `${BODY}dateRange$txtFromDate`,
      toField: `${BODY}dateRange$txtToDate`,
      minDate: "01.01.2007",
      submit: `${BODY}btnShow$lnkSubButton`,
      fanOutSelect: `${BODY}ddlHospitalName`,
    },
  },
];

export const DOCUMENT_SOURCE_IDS = DOCUMENT_SOURCES.map((s) => s.id);

export function documentSource(id: string): DocumentSource | undefined {
  return DOCUMENT_SOURCES.find((s) => s.id === id);
}
