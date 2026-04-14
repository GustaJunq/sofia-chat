import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, X, Mic, FileText, FileSpreadsheet, File } from "lucide-react";
import { API_URL, getToken } from "@/lib/api";

/* ──────────────────── Slash Commands ──────────────────── */

const SLASH_COMMANDS = [
  { command: "/imagine", description: "Generate an image with AI" },
  { command: "/file_manager", description: "Process or convert a file" },
];

interface SlashMenuProps {
  query: string;
  onSelect: (command: string) => void;
}

function SlashMenu({ query, onSelect }: SlashMenuProps) {
  const filtered = SLASH_COMMANDS.filter((c) =>
    c.command.startsWith(query.toLowerCase())
  );
  if (!filtered.length) return null;

  return (
    <div className="slash-menu">
      {filtered.map((c) => (
        <button
          key={c.command}
          className="slash-menu-item"
          onMouseDown={(e) => { e.preventDefault(); onSelect(c.command); }}
        >
          <span className="slash-menu-command">{c.command}</span>
          <span className="slash-menu-desc">{c.description}</span>
        </button>
      ))}
    </div>
  );
}

/* ──────────────────── Voice Mode ──────────────────── */

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
}

type VoiceStatus = "idle" | "recording" | "thinking" | "speaking";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Hold to speak.",
  recording: "Recording...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

function VoiceMode({ open, onClose, conversationId }: VoiceModeProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<{ user: string; assistant: string } | null>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  // ── Volume metering helpers ─────────────────────────────────────────────────
  const startMeterLoop = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!activeRef.current) return;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255; // 0..1
      setVolume(avg);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setVolume(0);
  }, []);

  // ── Cleanup total ─────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    activeRef.current = false;
    stopMeter();
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioCtxRef.current?.state !== "closed") audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecRef.current?.stream?.getTracks().forEach((t) => t.stop());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecRef.current = null;
    streamRef.current = null;
  }, [stopMeter]);

  // ── Inicia gravação (push-to-talk: chamado no pointerdown) ────────────────
  const startRecording = useCallback(async () => {
    if (!activeRef.current || status === "thinking" || status === "speaking") return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      // Set up mic volume metering
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      startMeterLoop(analyser);

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (!activeRef.current) return;
        stopMeter();
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 1000) {
          sendVoice(blob);
        } else {
          setStatus("idle");
        }
      };

      recorder.start();
      setStatus("recording");
    } catch {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, conversationId, startMeterLoop, stopMeter]);

  // ── Para gravação ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecRef.current?.state === "recording") {
      mediaRecRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Envia áudio para a API ─────────────────────────────────────────────────
  const sendVoice = useCallback(async (blob: Blob) => {
    if (!activeRef.current) return;
    setStatus("thinking");

    const token = getToken();
    if (!token) { onClose(); return; }

    const form = new FormData();
    form.append("audio", blob, "voice.webm");
    if (conversationId) form.append("conversation_id", conversationId);

    try {
      const res = await fetch(`${API_URL}/voice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Voice error");
      const data = await res.json();
      if (!activeRef.current) return;

      setTranscript({ user: data.text_input ?? "", assistant: data.text_response ?? "" });
      setStatus("speaking");

      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
        audioRef.current = audio;

        // Meter TTS audio output
        try {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
          startMeterLoop(analyser);
        } catch { /* fallback: no metering */ }

        audio.onended = () => {
          if (activeRef.current) {
            stopMeter();
            audioRef.current = null;
            if (audioCtxRef.current?.state !== "closed") audioCtxRef.current?.close();
            audioCtxRef.current = null;
            setStatus("idle");
          }
        };
        audio.onerror = () => {
          if (activeRef.current) {
            stopMeter();
            audioRef.current = null;
            setStatus("idle");
          }
        };
        await audio.play();
      } else {
        setStatus("idle");
      }
    } catch {
      if (activeRef.current) setStatus("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, startMeterLoop, stopMeter]);

  // ── Ciclo de vida open/close ───────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      activeRef.current = true;
      setStatus("idle");
      setTranscript(null);
    } else {
      cleanup();
      setStatus("idle");
      setTranscript(null);
    }
    return () => { cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isRecording = status === "recording";
  const isBusy = status === "thinking" || status === "speaking";
  const orbScale = 1 + volume * 0.5; // scale 1..1.5 based on volume

  return (
    <div className="voice-mode-overlay">
      {/* Orb — segura para falar */}
      <button
        className={[
          "voice-orb-wrapper",
          isBusy ? "voice-orb-wrapper--disabled" : "",
        ].join(" ")}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startRecording(); }}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        onPointerCancel={stopRecording}
        aria-label={isRecording ? "Release to send" : "Hold to speak"}
        disabled={isBusy}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <div
          className={[
            "voice-orb",
            isRecording ? "voice-orb--listening" : "",
            status === "speaking" ? "voice-orb--speaking" : "",
            status === "thinking" ? "voice-orb--thinking" : "",
          ].join(" ")}
          style={{
            transform: `scale(${orbScale})`,
            boxShadow: `0 0 ${40 + volume * 80}px ${10 + volume * 40}px rgba(255,138,61,${0.25 + volume * 0.5})`,
          }}
        />
      </button>

      {/* Status */}
      <p className="voice-status">{STATUS_LABELS[status]}</p>

      {/* Transcript */}
      {transcript && (
        <div className="voice-transcript">
          <p className="voice-transcript-user">{transcript.user}</p>
          <p className="voice-transcript-assistant">{transcript.assistant}</p>
        </div>
      )}

      {/* Close */}
      <button onClick={onClose} className="voice-close-btn" aria-label="Close voice mode">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

/* ──────────────────── Input Bar ──────────────────── */

// Tipos de arquivo aceitos
const ACCEPTED_DOC_TYPES = ".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.html,.py,.js,.ts";

const DOC_MEDIA_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  json: "application/json",
  html: "text/html",
  py: "text/x-python",
  js: "application/javascript",
  ts: "application/typescript",
};

function getDocIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["xlsx", "xls", "csv"].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-foreground/60" />;
  if (["pdf", "docx", "doc"].includes(ext)) return <FileText className="w-5 h-5 text-foreground/60" />;
  return <File className="w-5 h-5 text-foreground/60" />;
}

interface InputBarProps {
  onSend: (
    message: string,
    fileBase64?: string,
    fileName?: string,
    fileMediaType?: string,
  ) => void;
  disabled?: boolean;
  conversationId?: string | null;
}

const InputBar = ({ onSend, disabled, conversationId }: InputBarProps) => {
  const [text, setText] = useState("");
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  // documento
  const [docName, setDocName] = useState<string | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [docMediaType, setDocMediaType] = useState<string>("application/octet-stream");

  const [voiceOpen, setVoiceOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashQuery(val);
    } else {
      setSlashQuery(null);
    }
  };

  const showFileManagerWarning = text.trim().toLowerCase().startsWith("/file_manager");
  const [warningDismissed, setWarningDismissed] = useState(false);

  const handleSlashSelect = (command: string) => {
    setText(command + " ");
    setSlashQuery(null);
    textareaRef.current?.focus();
  };

  const clearAttachment = () => {
    setDocName(null);
    setDocBase64(null);
    setDocMediaType("application/octet-stream");
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",", 2)[1];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      setDocName(file.name);
      setDocBase64(base64);
      setDocMediaType(DOC_MEDIA_TYPES[ext] ?? file.type ?? "application/octet-stream");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !docBase64) || disabled) return;
    onSend(
      trimmed,
      docBase64 ?? undefined,
      docName ?? undefined,
      docBase64 ? docMediaType : undefined,
    );
    setText("");
    clearAttachment();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasAttachment = !!docBase64;
  const canSend = (text.trim().length > 0 || hasAttachment) && !disabled;
  const placeholder = docBase64 ? `O que fazer com "${docName}"?` : "Ask something...";

  return (
    <>
      <VoiceMode open={voiceOpen} onClose={() => setVoiceOpen(false)} conversationId={conversationId ?? null} />

      {showFileManagerWarning && !warningDismissed && (
        <div className="file-manager-warning">
          <span className="file-manager-warning-icon">⚠️</span>
          <div>
            <p className="file-manager-warning-title">hey, it's me, SynastrIA!</p>
            <p className="file-manager-warning-desc">
              I'm still learning to use this terminal, so if I don't deliver the right file type or something comes out as TXT, don't blame me — this feature is in beta :)<br />
              But feel free to use it and suggest improvements on TikTok ↓<br />
              <strong>@synastria.dev</strong>
            </p>
          </div>
          <button
            className="file-manager-warning-close"
            onClick={() => setWarningDismissed(true)}
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <div className="inputbar-wrapper">
        <div className="inputbar-gradient">
        <div className="inputbar-surface">
          {/* Document preview */}
          {docName && (
            <div className="inputbar-image-preview" style={{ alignItems: "center", gap: "8px", padding: "6px 10px" }}>
              {getDocIcon(docName)}
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #aaa)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {docName}
              </span>
              <button onClick={clearAttachment} className="inputbar-image-remove" title="Remove">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="inputbar-row">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="inputbar-attach"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
            accept={ACCEPTED_DOC_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />

            <div style={{ position: "relative", flex: 1, display: "flex" }}>
              {slashQuery && (
                <SlashMenu query={slashQuery} onSelect={handleSlashSelect} />
              )}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="inputbar-textarea"
                style={{ flex: 1 }}
              />
            </div>

            <button
              onClick={() => setVoiceOpen(true)}
              disabled={disabled}
              className="inputbar-mic"
              title="Voice Mode"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button onClick={handleSend} disabled={!canSend} className="inputbar-send">
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
        </div>

        <p className="inputbar-disclaimer">
          This AI can "hallucinate",<br />so double-check responses.
        </p>
      </div>
    </>
  );
};

export default InputBar;
