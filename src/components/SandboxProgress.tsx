import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader, AlertTriangle, Terminal, Code2, Upload, Search, Cpu, Github } from "lucide-react";
import { API_URL, getToken } from "@/lib/api";

export interface SandboxStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error" | "retrying";
  detail?: string;      // código gerado ou erro
  isCode?: boolean;     // true = renderiza como bloco de código
  attempt?: number;
}

interface SandboxProgressProps {
  steps: SandboxStep[];
  outputUrl?: string;
  outputType?: string;
  title?: string;
  publicUrl?: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  classifying: <Search className="w-4 h-4" />,
  generating:  <Code2 className="w-4 h-4" />,
  executing:   <Terminal className="w-4 h-4" />,
  uploading:   <Upload className="w-4 h-4" />,
  default:     <Cpu className="w-4 h-4" />,
};

function StatusIcon({ status }: { status: SandboxStep["status"] }) {
  if (status === "done")     return <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />;
  if (status === "error")    return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  if (status === "retrying") return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
  if (status === "running")  return <Loader className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />;
  return <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />;
}

function StepRow({ step }: { step: SandboxStep }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!step.detail;

  return (
    <div className="sandbox-step">
      <button
        className="sandbox-step-header"
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
        style={{ cursor: hasDetail ? "pointer" : "default" }}
      >
        <StatusIcon status={step.status} />
        <span className="sandbox-step-label">{step.label}</span>
        {step.attempt && step.attempt > 1 && (
          <span className="sandbox-step-attempt">attempt {step.attempt}</span>
        )}
        {hasDetail && (
          open
            ? <ChevronDown className="w-3 h-3 text-zinc-500 ml-auto shrink-0" />
            : <ChevronRight className="w-3 h-3 text-zinc-500 ml-auto shrink-0" />
        )}
      </button>

      {open && hasDetail && (
        <div className="sandbox-step-detail">
          {step.isCode ? (
            <pre className="sandbox-code-block"><code>{step.detail}</code></pre>
          ) : (
            <p className="sandbox-error-text">{step.detail}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface SandboxProgressProps {
  steps: SandboxStep[];
  outputUrl?: string;
  outputType?: string;
  title?: string;
  publicUrl?: string;
  githubFiles?: Record<string, string>;
}

export default function SandboxProgress({ steps, outputUrl, outputType, title, publicUrl, githubFiles }: SandboxProgressProps) {
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ repo_url?: string; pages_url?: string; error?: string } | null>(null);

  const handleGitHubPush = async () => {
    const token = getToken();
    if (!token || !githubFiles) return;
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch(`${API_URL}/github/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, files: githubFiles }),
      });
      const data = await res.json();
      if (data.needs_auth) {
        setPushResult({ error: "Connect your GitHub first (menu → Connect GitHub)" });
      } else {
        setPushResult(data);
      }
    } catch {
      setPushResult({ error: "Error connecting to GitHub." });
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="sandbox-progress">
      <div className="sandbox-steps">
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>

      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sandbox-download-btn"
          style={{ background: "hsl(var(--primary) / 0.2)", borderBottom: "1px solid hsl(var(--border))" }}
        >
          🌐 View published site
        </a>
      )}

      {githubFiles && (
        <div>
          <button
            onClick={handleGitHubPush}
            disabled={pushing}
            className="sandbox-download-btn"
            style={{
              background: pushing ? "hsl(var(--muted))" : "#24292e",
              color: "#fff",
              borderBottom: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              cursor: pushing ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            <Github className="w-4 h-4" />
            {pushing ? "Pushing to GitHub..." : "Publish on GitHub"}
          </button>
          {pushResult?.repo_url && (
            <div style={{ padding: "10px 14px", fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: "4px" }}>
              <a href={pushResult.repo_url} target="_blank" rel="noopener noreferrer" style={{ color: "hsl(var(--primary))" }}>
                📦 View repository
              </a>
              {pushResult.pages_url && (
                <a href={pushResult.pages_url} target="_blank" rel="noopener noreferrer" style={{ color: "hsl(var(--primary))" }}>
                  🌐 GitHub Pages (may take a few minutes)
                </a>
              )}
            </div>
          )}
          {pushResult?.error && (
            <p style={{ padding: "8px 14px", fontSize: "0.75rem", color: "#f87171" }}>{pushResult.error}</p>
          )}
        </div>
      )}

      {outputUrl && (
        <a
          href={outputUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sandbox-download-btn"
          download={title ? `${title}.${outputType}` : undefined}
        >
          ⬇️ Download {outputType?.toUpperCase()}
        </a>
      )}
    </div>
  );
}
