// MBiR Builder — Phase 1 of 3
// Connects to Monday.com Initiatives (L1) board and renders initiative selector
// Board ID: 18404668601 | Owner: Porter Nellans | Built for AyaOne /sas route

import { useEffect, useMemo, useState } from "react";

const MONDAY_ENDPOINT = "https://api.monday.com/v2";
const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MONDAY_TOKEN = import.meta.env.VITE_MONDAY_TOKEN;
const CLAUDE_KEY = import.meta.env.VITE_CLAUDE_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const DRAFT_STATUS_OPTIONS = ["Working on it", "At Risk", "Done", "No status"];
const DRAFT_SYSTEM_PROMPT = `You are drafting a monthly update card for a BI leadership review 
document presented to the CFO. The audience wants to know what actually 
changed in the business — outcomes, not activity. Be direct, specific, 
and concise. Avoid phrases like 'work continued' or 'progress was made.'

Write two fields:
PROGRESS: 2-3 sentences on what specifically happened or changed this 
month. If data is thin, say so plainly rather than padding.
NEXT: 1 sentence on the immediate next milestone.

Do not use bullet points. Do not restate the initiative name.`;

const MONDAY_QUERY = `
query {
  boards(ids: [18404668601]) {
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
}
`;

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
  },
  connectionPanel: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
    gap: 10,
    alignItems: "end",
    marginTop: 28,
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
  input: {
    boxSizing: "border-box",
    width: "100%",
    height: 38,
    border: `1px solid ${colors.rule}`,
    borderRadius: 0,
    background: colors.white,
    color: colors.ink,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.4,
    outline: "none",
    padding: "0 10px",
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
  connectedBadge: {
    alignSelf: "end",
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
    color: colors.ink,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  goalsName: {
    color: colors.amber,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8,
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
};

function getColumnValue(item, columnId) {
  return item.column_values?.find((column) => column.id === columnId) || null;
}

function parseStoryCount(value) {
  if (!value) {
    return 0;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed?.linkedPulseIds) ? parsed.linkedPulseIds.length : 0;
  } catch {
    return 0;
  }
}

function parseStoryNames(column) {
  if (!column?.text) {
    return [];
  }

  return column.text
    .split(/,\s*/)
    .map((storyName) => storyName.trim())
    .filter(Boolean);
}

function isTestInitiative(name) {
  return /\bTEST(?:ING)?\b/i.test(name);
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
    updatedAt: item.updated_at,
    selected: !excluded && !isGoalsItem,
    excluded,
    isGoalsItem,
  };
}

function getStatusStyle(status) {
  if (status === "Working on it") {
    return {
      background: colors.amberLight,
      color: colors.amber,
    };
  }

  if (status === "Done") {
    return {
      background: colors.greenLight,
      color: colors.green,
    };
  }

  if (status === "Stuck" || status === "At Risk") {
    return {
      background: colors.redLight,
      color: colors.red,
    };
  }

  return {
    background: colors.greyLight,
    color: colors.grey,
  };
}

function getVisibleName(initiative) {
  return initiative.isGoalsItem ? "GOALS — v1.5" : initiative.name;
}

function getDraftStatus(status) {
  if (status === "Stuck" || status === "At Risk") {
    return "At Risk";
  }

  return DRAFT_STATUS_OPTIONS.includes(status) ? status : "No status";
}

function buildInitiativeMessage(initiative) {
  const storyNames = initiative.storyNames?.length ? initiative.storyNames.join(", ") : "No story names available";

  return [
    `Initiative name: ${getVisibleName(initiative)}`,
    `Owner name: ${initiative.owner || "No owner assigned"}`,
    `Current status: ${initiative.status || "No status set"}`,
    `Number of linked stories: ${initiative.storyCount}`,
    `Story names if available: ${storyNames}`,
  ].join("\n");
}

function parseClaudeDraft(text) {
  const normalizedText = text.trim();
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

export default function MBiRBuilder() {
  const [initiatives, setInitiatives] = useState([]);
  const [draftCards, setDraftCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedInitiatives = useMemo(
    () => initiatives.filter((initiative) => initiative.selected && !initiative.excluded),
    [initiatives],
  );
  const hasLoadedData = initiatives.length > 0;
  const selectedCount = selectedInitiatives.length;

  useEffect(() => {
    let isMounted = true;

    async function loadInitiatives() {
      if (!MONDAY_TOKEN || !CLAUDE_KEY) {
        setError("Configuration error — contact Porter.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(MONDAY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: MONDAY_TOKEN,
          },
          body: JSON.stringify({ query: MONDAY_QUERY }),
        });

        const payload = await response.json();

        if (!response.ok || payload.errors) {
          const message = payload.errors?.[0]?.message || `Monday request failed with status ${response.status}`;
          throw new Error(message);
        }

        const items = payload.data?.boards?.[0]?.items_page?.items;

        if (!Array.isArray(items)) {
          throw new Error("Monday response did not include initiative items.");
        }

        if (isMounted) {
          setInitiatives(items.map(mapMondayItemToInitiative));
        }
      } catch (requestError) {
        if (isMounted) {
          setInitiatives([]);
          setError(requestError instanceof Error ? requestError.message : "Unable to connect to Monday.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitiatives();

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleInitiative(id) {
    setInitiatives((currentInitiatives) =>
      currentInitiatives.map((initiative) =>
        initiative.id === id
          ? {
              ...initiative,
              selected: !initiative.selected,
            }
          : initiative,
      ),
    );
  }

  function selectAll() {
    setInitiatives((currentInitiatives) =>
      currentInitiatives.map((initiative) => ({
        ...initiative,
        selected: !initiative.excluded,
      })),
    );
  }

  function clearSelection() {
    setInitiatives((currentInitiatives) =>
      currentInitiatives.map((initiative) => ({
        ...initiative,
        selected: false,
      })),
    );
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
          messages: [
            {
              role: "user",
              content: buildInitiativeMessage(initiative),
            },
          ],
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        const message = payload.error?.message || `Claude request failed with status ${response.status}`;
        throw new Error(message);
      }

      const draftText = extractClaudeText(payload);

      if (!draftText) {
        throw new Error("Claude returned an empty draft.");
      }

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
    if (!CLAUDE_KEY) {
      setError("Configuration error — contact Porter.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const generatedDrafts = await Promise.all(
        selectedInitiatives.map((initiative) => generateDraftForInitiative(initiative)),
      );
      setDraftCards(generatedDrafts);
    } finally {
      setIsGenerating(false);
    }
  }

  function updateDraftCard(id, field, value) {
    setDraftCards((currentCards) =>
      currentCards.map((card) =>
        card.id === id
          ? {
              ...card,
              [field]: value,
            }
          : card,
      ),
    );
  }

  function exportHtml() {
    console.log("MBiR Builder draft cards:", draftCards);
  }

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
                    <h2 style={{ ...styles.initiativeName, margin: 0 }}>{card.name}</h2>
                    <div style={styles.draftMeta}>
                      <span style={styles.pill}>{card.owner}</span>
                    </div>
                  </div>

                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>Status</span>
                    <select
                      style={styles.select}
                      value={card.status}
                      onChange={(event) => updateDraftCard(card.id, "status", event.target.value)}
                    >
                      {DRAFT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
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
                      onChange={(event) => updateDraftCard(card.id, "progress", event.target.value)}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>Next</span>
                    <textarea
                      style={{ ...styles.textarea, minHeight: 72 }}
                      value={card.next}
                      onChange={(event) => updateDraftCard(card.id, "next", event.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </section>

          <div style={styles.exportBar}>
            <button style={styles.button} type="button" onClick={exportHtml}>
              Export HTML
            </button>
          </div>
        </div>
      </main>
    );
  }

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
            {hasLoadedData ? (
              <span style={styles.connectedBadge}>Connected</span>
            ) : isLoading ? (
              <span style={styles.connectedBadge}>Connecting</span>
            ) : null}
          </div>

          {error ? <p style={styles.error}>{error}</p> : null}
        </header>

        {hasLoadedData ? (
          <section style={styles.section} aria-label="Key initiatives">
            <div style={styles.sectionHeader}>
              <p style={styles.sectionLabel}>Key Initiatives</p>
              <div style={styles.links}>
                <button style={styles.textLink} type="button" onClick={selectAll}>
                  Select All
                </button>
                <button style={styles.textLink} type="button" onClick={clearSelection}>
                  Clear
                </button>
              </div>
            </div>

            <div style={styles.list}>
              {initiatives.map((initiative) => {
                const statusStyle = getStatusStyle(initiative.status);
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
                        <span
                          style={{
                            ...styles.initiativeName,
                            ...(initiative.isGoalsItem ? styles.goalsName : null),
                          }}
                        >
                          {getVisibleName(initiative)}
                        </span>
                        {initiative.excluded ? (
                          <span
                            style={{
                              ...styles.badge,
                              background: colors.greyLight,
                              color: colors.grey,
                            }}
                          >
                            Excluded
                          </span>
                        ) : null}
                      </span>

                      <span style={styles.meta}>
                        <span style={styles.pill}>{initiative.owner || "No owner"}</span>
                        <span style={{ ...styles.pill, ...statusStyle }}>{initiative.status || "No status"}</span>
                        <span style={styles.storyCount}>
                          {initiative.storyCount} {initiative.storyCount === 1 ? "story" : "stories"}
                        </span>
                        {!initiative.owner ? (
                          <span
                            style={{
                              ...styles.badge,
                              background: colors.amberLight,
                              color: colors.amber,
                            }}
                          >
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
              {isGenerating ? "Generating" : "Generate Drafts →"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
