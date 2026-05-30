// MBiR Builder — Phase 3
// L1 Initiatives + L2 Stories (health + recent updates)
// Board IDs: L1 Initiatives: 18404668601 | L2 Stories: 18407376152
// Owner: Porter Nellans | AyaOne /sas route

import { useEffect, useMemo, useState } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONDAY_ENDPOINT = "https://api.monday.com/v2";
const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MONDAY_TOKEN = import.meta.env.VITE_MONDAY_TOKEN;
const CLAUDE_KEY = import.meta.env.VITE_CLAUDE_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-5";
const INITIATIVES_BOARD_ID = 18404668601;
const STORIES_BOARD_ID = 18407376152;
const DRAFT_STATUS_OPTIONS = ["Working on it", "At Risk", "Done", "No status"];
const MONDAY_ITEM_URL = (id) =>
  `https://ayahealthcare.monday.com/boards/${INITIATIVES_BOARD_ID}/pulses/${id}`;

// Fix: explicit no-markdown instruction eliminates ** artifacts in output
const DRAFT_SYSTEM_PROMPT = `You are drafting a monthly update card for a BI leadership review document presented to the CFO. The audience wants to know what actually changed in the business — outcomes, not activity. Be direct, specific, and concise. Avoid phrases like 'work continued' or 'progress was made.'

Write exactly two labeled fields:
PROGRESS: 2-3 sentences on what specifically happened or changed this month. If data is thin, say so plainly rather than padding.
NEXT: 1 sentence on the immediate next milestone.

Critical formatting rules: No markdown. No asterisks. No bold or italic text. No bullet points. Do not restate the initiative name. Output only the two field labels and plain prose sentences.`;

// ─── Queries ───────────────────────────────────────────────────────────────────

const L1_INITIATIVES_QUERY = `
query {
  boards(ids: [${INITIATIVES_BOARD_ID}]) {
    items_page(limit: 50) {
      items {
        id
        name
        updated_at
        column_values {
          id
          text
          value
        }
      }
    }
  }
}`;

// Fetch all L2 stories with health columns and most recent update
// limit: 1 on updates keeps query complexity low
const L2_STORIES_QUERY = `
query {
  boards(ids: [${STORIES_BOARD_ID}]) {
    items_page(limit: 500) {
      items {
        id
        name
        column_values {
          id
          text
          value
        }
        updates(limit: 1) {
          body
          created_at
        }
      }
    }
  }
}`;

// ─── Colors ────────────────────────────────────────────────────────────────────

const colors = {
  white: "#FFFFFF",
  ink: "#0F1117",
  grey: "#6B7280",
  greyLight: "#F3F4F6",
  rule: "#E5E7EB",
  blue: "#1B3FAB",
  blueLight: "#EEF2FF",
  amber: "#C47D0E",
  amberLight: "#FFF8EC",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  red: "#DC2626",
  redLight: "#FEF2F2",
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    background: colors.white,
    color: colors.ink,
    fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 300,
    padding: "48px 24px",
  },
  shell: {
    width: "100%",
    maxWidth: 660,
    margin: "0 auto",
  },
  header: {
    marginBottom: 38,
  },
  title: {
    margin: 0,
    color: colors.ink,
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: "-0.025em",
    lineHeight: 1.1,
  },
  titleStrong: {
    fontWeight: 500,
  },
  subtitle: {
    margin: "10px 0 0",
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  connectionPanel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  connectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 24,
    background: colors.greyLight,
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: "0.14em",
    padding: "0 8px",
    textTransform: "uppercase",
  },
  storiesBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 24,
    background: colors.blueLight,
    color: colors.blue,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: "0.14em",
    padding: "0 8px",
    textTransform: "uppercase",
  },
  error: {
    margin: "12px 0 0",
    color: colors.red,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.7,
  },
  section: {
    marginTop: 36,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    margin: 0,
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  textLink: {
    border: 0,
    background: "transparent",
    color: colors.grey,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 300,
    padding: 0,
  },
  list: {
    borderTop: `1px solid ${colors.rule}`,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "22px minmax(0, 1fr)",
    gap: 12,
    borderBottom: `1px solid ${colors.rule}`,
    padding: "17px 0",
    cursor: "pointer",
  },
  checkbox: {
    appearance: "none",
    WebkitAppearance: "none",
    width: 14,
    height: 14,
    border: `1px solid ${colors.rule}`,
    borderRadius: 0,
    cursor: "pointer",
    margin: "2px 0 0",
    flexShrink: 0,
  },
  checkboxChecked: {
    background: colors.blue,
    borderColor: colors.blue,
    boxShadow: `inset 0 0 0 3px ${colors.white}`,
  },
  rowBody: {
    minWidth: 0,
  },
  rowTop: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  initiativeName: {
    minWidth: 0,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  itemIdLink: {
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 300,
    letterSpacing: "0.08em",
    textDecoration: "none",
    opacity: 0.7,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 20,
    background: colors.greyLight,
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 300,
    lineHeight: 1,
    padding: "0 7px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 18,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: "0.14em",
    lineHeight: 1,
    padding: "0 6px",
    textTransform: "uppercase",
  },
  storyCount: {
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 300,
    lineHeight: 1,
  },
  bottomBar: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 28,
    borderTop: `1px solid ${colors.rule}`,
    background: colors.white,
    padding: "18px 0 0",
  },
  count: {
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 10,
    fontWeight: 300,
    lineHeight: 1,
  },
  // Draft review screen
  draftShell: {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
  },
  draftHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 28,
  },
  draftIntro: {
    minWidth: 0,
  },
  draftGrid: {
    display: "grid",
    gap: 16,
  },
  draftCard: {
    border: `1px solid ${colors.rule}`,
    background: colors.white,
    padding: 18,
  },
  draftCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  draftMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  field: {
    minWidth: 0,
  },
  fieldLabel: {
    display: "block",
    marginBottom: 8,
    color: colors.grey,
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  select: {
    boxSizing: "border-box",
    minWidth: 150,
    height: 34,
    border: `1px solid ${colors.rule}`,
    borderRadius: 0,
    background: colors.white,
    color: colors.ink,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 300,
    outline: "none",
    padding: "0 8px",
  },
  textarea: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 96,
    resize: "vertical",
    border: `1px solid ${colors.rule}`,
    borderRadius: 0,
    background: colors.white,
    color: colors.ink,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.6,
    outline: "none",
    padding: 10,
  },
  draftFields: {
    display: "grid",
    gap: 14,
  },
  cardError: {
    margin: "0 0 14px",
    background: colors.redLight,
    color: colors.red,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 300,
    lineHeight: 1.6,
    padding: "10px 12px",
  },
  exportBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 24,
    borderTop: `1px solid ${colors.rule}`,
    paddingTop: 18,
  },
  button: {
    height: 38,
    border: "none",
    borderRadius: 0,
    background: colors.blue,
    color: colors.white,
    cursor: "pointer",
    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: "0.14em",
    padding: "0 15px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  buttonDisabled: {
    background: colors.rule,
    color: colors.grey,
    cursor: "not-allowed",
  },
};

// ─── Pure Helpers ──────────────────────────────────────────────────────────────

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getColumnValue(item, columnId) {
  return item.column_values?.find((col) => col.id === columnId) || null;
}

function parseStoryCount(value) {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed?.linkedPulseIds) ? parsed.linkedPulseIds.length : 0;
  } catch {
    return 0;
  }
}

function parseStoryNames(column) {
  if (!column?.text) return [];
  return column.text
    .split(/,\s*/)
    .map((n) => n.trim())
    .filter(Boolean);
}

function isTestInitiative(name) {
  return /\bTEST(?:ING)?\b/i.test(name);
}

// Health values used on L2 Stories board
const HEALTH_VALUES = ["On track", "At risk", "Stuck"];

function extractStoryHealth(columnValues) {
  for (const col of columnValues || []) {
    if (HEALTH_VALUES.includes(col.text)) return col.text;
  }
  return null;
}

// Look through ALL column values on a story for any board_relation
// that references a known initiative ID. Returns array of matched initiative IDs.
function findLinkedInitiativeIds(columnValues, initiativeIdSet) {
  const matched = [];
  for (const col of columnValues || []) {
    if (!col.value) continue;
    try {
      const parsed = JSON.parse(col.value);
      if (!Array.isArray(parsed?.linkedPulseIds)) continue;
      for (const lp of parsed.linkedPulseIds) {
        const id = typeof lp === "number" ? String(lp) : String(lp?.linkedPulseId || "");
        if (id && initiativeIdSet.has(id)) matched.push(id);
      }
    } catch {
      // skip unparseable column values
    }
  }
  return matched;
}

function mapMondayItemToInitiative(item) {
  const owner = getColumnValue(item, "person")?.text?.trim() || null;
  const status = getColumnValue(item, "status")?.text?.trim() || null;
  const storyColumn = getColumnValue(item, "board_relation_mm255rm8");
  const storyCount = parseStoryCount(storyColumn?.value);
  const storyNames = parseStoryNames(storyColumn);
  const isGoalsItem = item.name === "Q2 Goals";
  const excluded = isTestInitiative(item.name);

  return {
    id: item.id,
    name: item.name,
    owner,
    status,
    storyCount,
    storyNames,
    stories: [], // populated after L2 fetch
    updatedAt: item.updated_at,
    selected: !excluded && !isGoalsItem,
    excluded,
    isGoalsItem,
  };
}

function getStatusStyle(status) {
  if (status === "Working on it") return { background: colors.amberLight, color: colors.amber };
  if (status === "Done") return { background: colors.greenLight, color: colors.green };
  if (status === "Stuck" || status === "At Risk") return { background: colors.redLight, color: colors.red };
  return { background: colors.greyLight, color: colors.grey };
}

function getInitiativeNameColor(initiative) {
  if (initiative.isGoalsItem) return colors.amber;
  return initiative.owner ? colors.blue : colors.grey;
}

function getVisibleName(initiative) {
  return initiative.isGoalsItem ? "GOALS — v1.5" : initiative.name;
}

function getDraftStatus(status) {
  if (status === "Stuck" || status === "At Risk") return "At Risk";
  return DRAFT_STATUS_OPTIONS.includes(status) ? status : "No status";
}

// Fix: strip ** markers before parsing in case the model still slips them in
function parseClaudeDraft(text) {
  const normalizedText = text.replace(/\*\*/g, "").trim();
  const progressMatch = normalizedText.match(/PROGRESS:\s*([\s\S]*?)(?=\n\s*NEXT:|$)/i);
  const nextMatch = normalizedText.match(/NEXT:\s*([\s\S]*)$/i);
  return {
    progress: progressMatch?.[1]?.trim() || normalizedText,
    next: nextMatch?.[1]?.trim() || "",
  };
}

function extractClaudeText(payload) {
  return (
    payload?.content
      ?.filter((block) => block?.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n")
      .trim() || ""
  );
}

function buildInitiativeMessage(initiative) {
  let storiesContext = "No linked stories available.";

  if (initiative.stories?.length > 0) {
    const lines = initiative.stories.map((s) => {
      const health = s.health ? ` (${s.health})` : "";
      const update = s.recentUpdate
        ? ` — Recent: ${s.recentUpdate.substring(0, 200)}`
        : "";
      return `  - ${s.name}${health}${update}`;
    });
    storiesContext = lines.join("\n");
  } else if (initiative.storyNames?.length > 0) {
    // Fallback: use names if story detail fetch found no matches
    storiesContext = initiative.storyNames.map((n) => `  - ${n}`).join("\n");
  }

  return [
    `Initiative: ${getVisibleName(initiative)}`,
    `Owner: ${initiative.owner || "No owner assigned"}`,
    `Status: ${initiative.status || "No status set"}`,
    `Linked stories (${initiative.storyCount} total):\n${storiesContext}`,
  ].join("\n");
}

// ─── Export Builder ────────────────────────────────────────────────────────────

function buildExportHtml(cards) {
  const date = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const statusColors = (status) => {
    if (status === "Working on it") return { bg: colors.amberLight, text: colors.amber };
    if (status === "Done") return { bg: colors.greenLight, text: colors.green };
    if (status === "At Risk") return { bg: colors.redLight, text: colors.red };
    return { bg: colors.greyLight, text: colors.grey };
  };

  const cardHtml = cards
    .map((card) => {
      const sc = statusColors(card.status);
      return `
  <article style="border:1px solid #E5E7EB;padding:22px;margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
      <div>
        <h2 style="margin:0;font-size:15px;font-weight:500;color:#0F1117;letter-spacing:-0.01em;">${card.name}</h2>
        <div style="margin-top:7px;">
          <span style="display:inline-block;background:#F3F4F6;color:#6B7280;font-family:'DM Mono',monospace;font-size:9px;padding:2px 8px;letter-spacing:0.1em;">${card.owner}</span>
        </div>
      </div>
      <span style="display:inline-block;background:${sc.bg};color:${sc.text};font-family:'DM Mono',monospace;font-size:9px;padding:3px 9px;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;">${card.status}</span>
    </div>
    <div style="margin-bottom:14px;">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6B7280;margin-bottom:7px;">Progress</div>
      <p style="margin:0;font-size:14px;font-weight:300;line-height:1.72;color:#0F1117;">${card.progress || "—"}</p>
    </div>
    <div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6B7280;margin-bottom:7px;">Next</div>
      <p style="margin:0;font-size:14px;font-weight:300;line-height:1.72;color:#0F1117;">${card.next || "—"}</p>
    </div>
  </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MBiR Draft — ${date}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:72px 24px 96px;background:#FFFFFF;font-family:'DM Sans',sans-serif;font-weight:300;display:flex;justify-content:center;">
<div style="width:100%;max-width:660px;">
  <span style="display:block;font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:0.14em;text-transform:uppercase;color:#6B7280;margin-bottom:14px;">BI State of Play · Draft · Internal</span>
  <h1 style="margin:0 0 10px;font-size:32px;font-weight:300;letter-spacing:-0.025em;color:#0F1117;">BI State <strong style="font-weight:500;">of Play</strong></h1>
  <p style="margin:0 0 36px;font-family:'DM Mono',monospace;font-size:9px;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;">${date} · Edition 4 · Draft for Review</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin-bottom:32px;">
  <span style="display:block;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6B7280;margin-bottom:20px;">Initiative Updates</span>
  ${cardHtml}
  <div style="margin-top:64px;border-top:1px solid #E5E7EB;padding-top:16px;display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:#6B7280;opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;">
    <span>BI Team · Internal · Draft</span>
    <span>${date} · MBiR Builder</span>
  </div>
</div>
</body>
</html>`;
}

// ─── Monday Fetch Helpers ──────────────────────────────────────────────────────

async function fetchMondayQuery(query) {
  const response = await fetch(MONDAY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(payload.errors?.[0]?.message || `Monday request failed: ${response.status}`);
  }
  return payload;
}

// Process L2 stories and build a map of initiativeId -> story[]
function buildStoriesMap(storyItems, initiativeIds) {
  const initiativeIdSet = new Set(initiativeIds);
  const storiesMap = {};

  for (const item of storyItems) {
    const health = extractStoryHealth(item.column_values);
    const rawUpdate = item.updates?.[0]?.body || null;
    const recentUpdate = rawUpdate ? stripHtml(rawUpdate) : null;

    const storyData = {
      id: item.id,
      name: item.name,
      health,
      recentUpdate,
    };

    const linkedInitiativeIds = findLinkedInitiativeIds(item.column_values, initiativeIdSet);

    if (linkedInitiativeIds.length > 0) {
      for (const initId of linkedInitiativeIds) {
        if (!storiesMap[initId]) storiesMap[initId] = [];
        storiesMap[initId].push(storyData);
      }
    }
  }

  return storiesMap;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MBiRBuilder() {
  const [initiatives, setInitiatives] = useState([]);
  const [storiesLoaded, setStoriesLoaded] = useState(false);
  const [draftCards, setDraftCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedInitiatives = useMemo(
    () => initiatives.filter((i) => i.selected && !i.excluded),
    [initiatives],
  );
  const hasLoadedData = initiatives.length > 0;
  const selectedCount = selectedInitiatives.length;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!MONDAY_TOKEN || !CLAUDE_KEY) {
        setError("Configuration error — contact Porter.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // ── Step 1: Fetch L1 Initiatives ──────────────────────────────────────
        const l1Payload = await fetchMondayQuery(L1_INITIATIVES_QUERY);
        const items = l1Payload.data?.boards?.[0]?.items_page?.items;

        if (!Array.isArray(items)) {
          throw new Error("Monday response did not include initiative items.");
        }

        const mappedInitiatives = items.map(mapMondayItemToInitiative);

        if (isMounted) {
          setInitiatives(mappedInitiatives);
          setIsLoading(false); // Show the list; stories will enrich it
        }

        // ── Step 2: Fetch L2 Stories (non-blocking enrichment) ───────────────
        try {
          const l2Payload = await fetchMondayQuery(L2_STORIES_QUERY);
          const storyItems = l2Payload.data?.boards?.[0]?.items_page?.items || [];
          const initiativeIds = mappedInitiatives.map((i) => i.id);
          const storiesMap = buildStoriesMap(storyItems, initiativeIds);

          if (isMounted) {
            setInitiatives((current) =>
              current.map((initiative) => ({
                ...initiative,
                stories: storiesMap[initiative.id] || [],
                // Use stories-derived count if > existing count (more reliable)
                storyCount:
                  (storiesMap[initiative.id]?.length || 0) > initiative.storyCount
                    ? storiesMap[initiative.id].length
                    : initiative.storyCount,
              })),
            );
            setStoriesLoaded(true);
          }
        } catch (storiesError) {
          // Stories fetch failure is non-fatal — initiatives still render
          console.warn("L2 stories fetch failed:", storiesError.message);
          if (isMounted) setStoriesLoaded(false);
        }
      } catch (requestError) {
        if (isMounted) {
          setInitiatives([]);
          setError(requestError instanceof Error ? requestError.message : "Unable to connect to Monday.");
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  function toggleInitiative(id) {
    setInitiatives((current) =>
      current.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );
  }

  function selectAll() {
    setInitiatives((current) =>
      current.map((i) => ({ ...i, selected: !i.excluded })),
    );
  }

  function clearSelection() {
    setInitiatives((current) => current.map((i) => ({ ...i, selected: false })));
  }

  async function generateDraftForInitiative(initiative) {
    try {
      const response = await fetch(CLAUDE_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": CLAUDE_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 500,
          system: DRAFT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildInitiativeMessage(initiative) }],
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message || `Claude request failed: ${response.status}`);
      }

      const draftText = extractClaudeText(payload);
      if (!draftText) throw new Error("Claude returned an empty draft.");

      const draft = parseClaudeDraft(draftText);

      return {
        id: initiative.id,
        name: getVisibleName(initiative),
        owner: initiative.owner || "No owner assigned",
        status: getDraftStatus(initiative.status),
        progress: draft.progress,
        next: draft.next,
        error: "",
      };
    } catch (draftError) {
      return {
        id: initiative.id,
        name: getVisibleName(initiative),
        owner: initiative.owner || "No owner assigned",
        status: getDraftStatus(initiative.status),
        progress: "",
        next: "",
        error: draftError instanceof Error ? draftError.message : "Claude could not generate this draft.",
      };
    }
  }

  async function generateDrafts() {
    if (!CLAUDE_KEY) { setError("Configuration error — contact Porter."); return; }
    setIsGenerating(true);
    setError("");
    try {
      const generated = await Promise.all(
        selectedInitiatives.map((i) => generateDraftForInitiative(i)),
      );
      setDraftCards(generated);
    } finally {
      setIsGenerating(false);
    }
  }

  function updateDraftCard(id, field, value) {
    setDraftCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    );
  }

  function exportHtml() {
    if (!draftCards.length) return;
    const html = buildExportHtml(draftCards);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `MBiR-Draft-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  // ─── Draft Review Screen ──────────────────────────────────────────────────────

  if (draftCards.length > 0) {
    return (
      <main style={styles.page}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400&display=swap"
        />
        <div style={styles.draftShell}>
          <header style={styles.draftHeader}>
            <div style={styles.draftIntro}>
              <h1 style={styles.title}>
                Review <span style={styles.titleStrong}>Drafts</span>
              </h1>
              <p style={styles.subtitle}>BI State of Play · Editable MBiR Cards</p>
            </div>
            <button style={styles.textLink} type="button" onClick={() => setDraftCards([])}>
              Back to selection
            </button>
          </header>

          <section style={styles.draftGrid} aria-label="Generated MBiR drafts">
            {draftCards.map((card) => (
              <article key={card.id} style={styles.draftCard}>
                <div style={styles.draftCardTop}>
                  <div style={styles.rowBody}>
                    <h2 style={{ ...styles.initiativeName, margin: 0, color: colors.ink }}>
                      {card.name}
                    </h2>
                    <div style={styles.draftMeta}>
                      <span style={styles.pill}>{card.owner}</span>
                    </div>
                  </div>
                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>Status</span>
                    <select
                      style={styles.select}
                      value={card.status}
                      onChange={(e) => updateDraftCard(card.id, "status", e.target.value)}
                    >
                      {DRAFT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {card.error ? <p style={styles.cardError}>{card.error}</p> : null}

                <div style={styles.draftFields}>
                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>Progress</span>
                    <textarea
                      style={styles.textarea}
                      value={card.progress}
                      onChange={(e) => updateDraftCard(card.id, "progress", e.target.value)}
                    />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>Next</span>
                    <textarea
                      style={{ ...styles.textarea, minHeight: 72 }}
                      value={card.next}
                      onChange={(e) => updateDraftCard(card.id, "next", e.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </section>

          <div style={styles.exportBar}>
            <button style={styles.button} type="button" onClick={exportHtml}>
              Export HTML →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Selector Screen ──────────────────────────────────────────────────────────

  return (
    <main style={styles.page}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400&display=swap"
      />
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            MBiR <span style={styles.titleStrong}>Builder</span>
          </h1>
          <p style={styles.subtitle}>BI State of Play · Edition 4 · June 2026</p>

          <div style={styles.connectionPanel}>
            {isLoading ? (
              <span style={styles.connectedBadge}>Connecting…</span>
            ) : hasLoadedData ? (
              <span style={styles.connectedBadge}>Connected</span>
            ) : null}
            {storiesLoaded ? (
              <span style={styles.storiesBadge}>Stories loaded</span>
            ) : hasLoadedData && !isLoading ? (
              <span style={{ ...styles.connectedBadge, opacity: 0.6 }}>Loading stories…</span>
            ) : null}
          </div>

          {error ? <p style={styles.error}>{error}</p> : null}
        </header>

        {hasLoadedData ? (
          <section style={styles.section} aria-label="Key initiatives">
            <div style={styles.sectionHeader}>
              <p style={styles.sectionLabel}>Key Initiatives</p>
              <div style={styles.links}>
                <button style={styles.textLink} type="button" onClick={selectAll}>Select All</button>
                <button style={styles.textLink} type="button" onClick={clearSelection}>Clear</button>
              </div>
            </div>

            <div style={styles.list}>
              {initiatives.map((initiative) => {
                const statusStyle = getStatusStyle(initiative.status);
                const nameColor = getInitiativeNameColor(initiative);
                const checkboxStyle = {
                  ...styles.checkbox,
                  ...(initiative.selected ? styles.checkboxChecked : null),
                };

                return (
                  <label key={initiative.id} style={styles.row}>
                    <input
                      style={checkboxStyle}
                      type="checkbox"
                      checked={initiative.selected}
                      onChange={() => toggleInitiative(initiative.id)}
                    />
                    <span style={styles.rowBody}>
                      <span style={styles.rowTop}>
                        {/* Blue if owner assigned, grey if not, amber if Goals */}
                        <span style={{ ...styles.initiativeName, color: nameColor }}>
                          {getVisibleName(initiative)}
                        </span>
                        {initiative.excluded ? (
                          <span style={{ ...styles.badge, background: colors.greyLight, color: colors.grey }}>
                            Excluded
                          </span>
                        ) : null}
                        {/* Monday item ID — small grey mono link */}
                        <a
                          href={MONDAY_ITEM_URL(initiative.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.itemIdLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {initiative.id}
                        </a>
                      </span>

                      <span style={styles.meta}>
                        <span style={styles.pill}>{initiative.owner || "No owner"}</span>
                        <span style={{ ...styles.pill, ...statusStyle }}>
                          {initiative.status || "No status"}
                        </span>
                        <span style={styles.storyCount}>
                          {initiative.storyCount} {initiative.storyCount === 1 ? "story" : "stories"}
                          {initiative.stories?.length > 0 ? ` · ${initiative.stories.length} matched` : ""}
                        </span>
                        {!initiative.owner ? (
                          <span style={{ ...styles.badge, background: colors.amberLight, color: colors.amber }}>
                            No Owner
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasLoadedData && selectedCount > 0 ? (
          <div style={styles.bottomBar}>
            <span style={styles.count}>
              {selectedCount} {selectedCount === 1 ? "initiative" : "initiatives"} selected
            </span>
            <button
              style={{
                ...styles.button,
                ...(selectedCount === 0 || isGenerating || !CLAUDE_KEY ? styles.buttonDisabled : null),
              }}
              type="button"
              onClick={generateDrafts}
              disabled={selectedCount === 0 || isGenerating || !CLAUDE_KEY}
            >
              {isGenerating ? "Generating…" : "Generate Drafts →"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
