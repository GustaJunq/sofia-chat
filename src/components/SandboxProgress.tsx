import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader, AlertTriangle, Terminal, Code2, Upload, Search, Cpu } from "lucide-react";

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
          <span className="sandbox-step-attempt">tentativa {step.attempt}</span>
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

export default function SandboxProgress({ steps, outputUrl, outputType, title, publicUrl }: SandboxProgressProps) {
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
          🌐 Ver site publicado
        </a>
      )}

      {outputUrl && (
        <a
          href={outputUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sandbox-download-btn"
          download={title ? `${title}.${outputType}` : undefined}
        >
          ⬇️ Baixar {outputType?.toUpperCase()}
        </a>
      )}
    </div>
  );
}
