import * as cheerio from "cheerio";
import { ParseError, ReauthenticationRequired } from "../errors.js";
import { looksLikeLoginPage } from "../webforms.js";
import { documentSource } from "./sources.js";
import type { DocumentListItem, DocumentRef } from "./types.js";

const DATE_RE = /\b\d{2}\.\d{2}\.\d{4}\b/;
/** Action URLs are portal-issued API paths; anything else is not ours to call. */
const ACTION_URL_RE = /^\/OnlineWeb\/api\/[\w/]+(\?[\w=&%.-]*)?$/i;

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function encodeDocumentRef(ref: DocumentRef): string {
  return Buffer.from(JSON.stringify(ref), "utf8").toString("base64url");
}

export function decodeDocumentRef(token: string): DocumentRef {
  try {
    const raw = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as Partial<DocumentRef>;
    if (typeof raw.source !== "string" || !documentSource(raw.source)) throw new Error("source");
    if (typeof raw.actionUrl !== "string" || !ACTION_URL_RE.test(raw.actionUrl)) throw new Error("url");
    return { source: raw.source, actionUrl: raw.actionUrl };
  } catch {
    throw new ParseError("INVALID_REF", "Document ref token is invalid.");
  }
}

/**
 * Parse grid rows whose action button carries `data-actionurl`. The date is
 * the first dd.MM.yyyy cell; the other cells are kept as shown.
 */
export function parseDocumentsListHtml(html: string, sourceId: string): DocumentListItem[] {
  const $ = cheerio.load(html);
  const items: DocumentListItem[] = [];
  const seen = new Set<string>();

  $("a[data-actionurl]").each((_, a) => {
    const actionUrl = $(a).attr("data-actionurl")?.trim() ?? "";
    if (!ACTION_URL_RE.test(actionUrl) || seen.has(actionUrl)) return;
    seen.add(actionUrl);

    const cells = $(a)
      .closest("tr")
      .find("td")
      .not(".ClalitGridActions")
      .map((_, td) => cleanText($(td).text()))
      .get()
      .filter(Boolean);
    const date = cells.find((c) => DATE_RE.test(c));
    const ref = { source: sourceId, actionUrl };
    items.push({
      source: sourceId,
      ...(date ? { date: DATE_RE.exec(date)![0] } : {}),
      details: cells.filter((c) => c !== date),
      ref,
      refToken: encodeDocumentRef(ref),
    });
  });

  if (items.length === 0 && looksLikeLoginPage(html)) throw new ReauthenticationRequired();
  return items;
}

/** Non-placeholder options of a dropdown, as [value, label]. */
export function selectOptions(html: string, name: string): Array<[string, string]> {
  const $ = cheerio.load(html);
  return $(`select[name="${name}"] option`)
    .map((_, o) => [[$(o).attr("value") ?? "", cleanText($(o).text())]] as Array<[string, string]>)
    .get()
    .filter(([value]) => value !== "" && value !== "0");
}
