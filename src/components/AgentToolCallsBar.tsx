import { Terminal, Check, X, Loader2, Brain } from "lucide-react";

export type AgentToolName = "list_skills" | "run_skill" | "save_memory";

export interface AgentToolCallEntry {
  tool: AgentToolName;
  args: Record<string, unknown>;
  status: "running" | "done" | "error";
  summary?: string;
  skillName?: string; // Nome da skill sendo executada (ex: web_search, run_command)
}

// ─── Config ────────────────────────────────────────────────────────────────────

const TOOL_CONFIG: Record<AgentToolName, { label: string; runningLabel: string; doneLabel: string; Icon: React.FC<{ className?: string }> }> = {
  list_skills: {
    label: "list_skills",
    runningLabel: "Listing skills…",
    doneLabel: "Skills loaded",
    Icon: Brain,
  },
  run_skill: {
    label: "run_skill",
    runningLabel: "Running skill…",
    doneLabel: "Skill executed",
    Icon: Terminal,
  },
  save_memory: {
    label: "save_memory",
    runningLabel: "Saving memory…",
    doneLabel: "Memory saved",
    Icon: Brain,
  },
};

// ─── Single badge ──────────────────────────────────────────────────────────────

function ToolBadge({ entry }: { entry: AgentToolCallEntry }) {
  const cfg = TOOL_CONFIG[entry.tool] ?? {
    label: entry.tool,
    runningLabel: entry.tool,
    doneLabel: entry.tool,
    Icon: Terminal,
  };

  const isRunning = entry.status === "running";
  const isDone = entry.status === "done";

  // Annotation (skill name or content)
  let annotation = "";
  if (entry.skillName) {
    annotation = entry.skillName;
  } else if (entry.tool === "save_memory" && entry.args.content) {
    const c = String(entry.args.content);
    annotation = c.slice(0, 48) + (c.length > 48 ? "…" : "");
  } else if (entry.tool === "run_skill" && entry.args.skill_name) {
    annotation = String(entry.args.skill_name);
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px 4px 8px",
        borderRadius: "6px",
        fontSize: "0.72rem",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.02em",
        background: isDone ? "hsl(var(--muted) / 0.4)" : "hsl(var(--muted) / 0.7)",
        border: `1px solid ${isRunning ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
        color: isDone ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground) / 0.85)",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
        maxWidth: "420px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {/* Status icon */}
      {isRunning ? (
        <Loader2
          style={{ width: 12, height: 12, flexShrink: 0, color: "hsl(var(--primary))" }}
          className="animate-spin"
        />
      ) : isDone ? (
        <Check style={{ width: 12, height: 12, flexShrink: 0, color: "hsl(142 70% 50%)" }} />
      ) : (
        <X style={{ width: 12, height: 12, flexShrink: 0, color: "hsl(0 70% 60%)" }} />
      )}

      {/* Tool icon */}
      <cfg.Icon style={{ width: 12, height: 12, flexShrink: 0 }} />

      {/* Label */}
      <span>
        {isRunning ? cfg.runningLabel : isDone ? cfg.doneLabel : `Erro: ${cfg.label}`}
      </span>

      {/* Annotation */}
      {annotation && isRunning && (
        <span style={{ opacity: 0.55, overflow: "hidden", textOverflow: "ellipsis" }}>
          {annotation}
        </span>
      )}
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

interface AgentToolCallsBarProps {
  toolCalls: AgentToolCallEntry[];
}

export default function AgentToolCallsBar({ toolCalls }: AgentToolCallsBarProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginBottom: "8px",
        paddingLeft: "34px", // align with assistant bubble content
      }}
    >
      {toolCalls.map((entry, i) => (
        <ToolBadge key={`${entry.tool}-${i}`} entry={entry} />
      ))}
    </div>
  );
}
