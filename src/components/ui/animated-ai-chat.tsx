"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  Paperclip,
  XIcon,
  Sparkles,
  ArrowUp,
  Mic,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

/* ──────────────────── Auto-resize hook ──────────────────── */

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

/* ──────────────────── Slash commands ──────────────────── */

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  {
    icon: <ImageIcon className="w-4 h-4" />,
    label: "Imagine",
    description: "Generate an image with AI",
    prefix: "/imagine",
  },
  {
    icon: <Wrench className="w-4 h-4" />,
    label: "File Manager",
    description: "Process or convert a file",
    prefix: "/file_manager",
  },
];

/* ──────────────────── File helpers ──────────────────── */

const ACCEPTED_DOC_TYPES =
  ".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.html,.py,.js,.ts";

const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.gif,.webp";
const ACCEPTED_ALL_TYPES = ACCEPTED_DOC_TYPES + "," + ACCEPTED_IMAGE_TYPES;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

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
  if (["xlsx", "xls", "csv"].includes(ext))
    return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
  if (["pdf", "docx", "doc"].includes(ext))
    return <FileText className="w-4 h-4 text-red-400" />;
  return <FileIcon className="w-4 h-4 text-blue-400" />;
}

/* ──────────────────── VoiceMode (kept from original InputBar) ──────────────────── */
// Importing from the original InputBar's VoiceMode. Since it's not exported,
// we keep VoiceMode accessible via a lazy dynamic import or inline it.
// For simplicity, we import the full VoiceMode from a new file.
// But to minimise churn, let's keep VoiceMode in the original InputBar
// and just not render it from there. We'll duplicate the overlay reference.

// Actually the cleanest approach: we keep VoiceMode in InputBar.tsx as-is,
// and the new AnimatedInputBar imports and renders VoiceMode from there.
// But VoiceMode isn't exported. Let's just move it.

// For now, we'll reference it via a dynamic import pattern.
// The simplest approach: export VoiceMode from InputBar.

/* ──────────────────── AnimatedInputBar ──────────────────── */

export interface AnimatedInputBarProps {
  onSend: (
    message: string,
    fileBase64?: string,
    fileName?: string,
    fileMediaType?: string,
    imageBase64?: string,
    imageMediaType?: string,
  ) => void;
  disabled?: boolean;
  conversationId?: string | null;
}

export function AnimatedInputBar({
  onSend,
  disabled,
  conversationId,
}: AnimatedInputBarProps) {
  const [text, setText] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);

  // File attachment state
  const [docName, setDocName] = useState<string | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [docMediaType, setDocMediaType] = useState("application/octet-stream");

  // Image attachment state
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState("image/jpeg");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice
  const [voiceOpen, setVoiceOpen] = useState(false);

  // File manager warning
  const [warningDismissed, setWarningDismissed] = useState(false);
  const showFileManagerWarning =
    text.trim().toLowerCase().startsWith("/file_manager");

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 44,
    maxHeight: 200,
  });
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  // ── Slash command palette ──
  useEffect(() => {
    if (text.startsWith("/") && !text.includes(" ")) {
      setShowCommandPalette(true);
      const idx = COMMAND_SUGGESTIONS.findIndex((cmd) =>
        cmd.prefix.startsWith(text.toLowerCase())
      );
      setActiveSuggestion(idx >= 0 ? idx : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [text]);

  // Close command palette on outside click
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── File handling ──
  const clearAttachment = () => {
    setDocName(null);
    setDocBase64(null);
    setDocMediaType("application/octet-stream");
    setImageName(null);
    setImageBase64(null);
    setImageMediaType("image/jpeg");
    setImagePreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const reader = new FileReader();

    if (IMAGE_EXTENSIONS.has(ext)) {
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const base64 = result.split(",", 2)[1];
        setImageName(file.name);
        setImageBase64(base64);
        setImageMediaType(file.type || "image/jpeg");
        setImagePreviewUrl(result); // data URL for preview
        // clear any doc attachment
        setDocName(null);
        setDocBase64(null);
      };
    } else {
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const base64 = result.split(",", 2)[1];
        setDocName(file.name);
        setDocBase64(base64);
        setDocMediaType(
          DOC_MEDIA_TYPES[ext] ?? file.type ?? "application/octet-stream"
        );
        // clear any image attachment
        setImageName(null);
        setImageBase64(null);
        setImagePreviewUrl(null);
      };
    }

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Send ──
  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !docBase64 && !imageBase64) || disabled) return;
    onSend(
      trimmed,
      docBase64 ?? undefined,
      docName ?? undefined,
      docBase64 ? docMediaType : undefined,
      imageBase64 ?? undefined,
      imageBase64 ? imageMediaType : undefined,
    );
    setText("");
    clearAttachment();
    adjustHeight(true);
  };

  // ── Keyboard ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < COMMAND_SUGGESTIONS.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : COMMAND_SUGGESTIONS.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          selectCommand(activeSuggestion);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectCommand = (index: number) => {
    const cmd = COMMAND_SUGGESTIONS[index];
    setText(cmd.prefix + " ");
    setShowCommandPalette(false);
    setRecentCommand(cmd.label);
    setTimeout(() => setRecentCommand(null), 3000);
    textareaRef.current?.focus();
  };

  const hasAttachment = !!docBase64 || !!imageBase64;
  const canSend = (text.trim().length > 0 || hasAttachment) && !disabled;
  const placeholder = imageBase64
    ? "What do you want to know about this image?"
    : docBase64
    ? `What to do with "${docName}"?`
    : "Ask something...";

  return (
    <>
      {/* Voice Mode overlay — uses the VoiceMode from InputBar */}
      <VoiceModeOverlay
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        conversationId={conversationId ?? null}
      />

      {/* File manager beta warning */}
      <AnimatePresence>
        {showFileManagerWarning && !warningDismissed && (
          <motion.div
            className="mx-4 mb-2 p-3 rounded-xl border border-border bg-card/80 backdrop-blur-lg flex items-start gap-3 text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span>⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                hey, it&apos;s me, SynastrIA!
              </p>
              <p className="text-muted-foreground mt-1">
                I&apos;m still learning to use this terminal, so if I don&apos;t
                deliver the right file type or something comes out as TXT,
                don&apos;t blame me — this feature is in beta :)
              </p>
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input bar */}
      <div className="inputbar-wrapper">
        <motion.div
          className="relative backdrop-blur-2xl bg-card/60 rounded-2xl border border-border shadow-xl mx-2"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Command palette */}
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div
                ref={commandPaletteRef}
                className="absolute left-3 right-3 bottom-full mb-2 backdrop-blur-xl bg-popover rounded-lg z-50 shadow-lg border border-border overflow-hidden"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <div className="py-1">
                  {COMMAND_SUGGESTIONS.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.prefix}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                        activeSuggestion === index
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                      onClick={() => selectCommand(index)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                        {suggestion.icon}
                      </div>
                      <div className="font-medium text-foreground">
                        {suggestion.label}
                      </div>
                      <div className="text-muted-foreground/60 text-xs ml-auto">
                        {suggestion.description}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File attachment preview */}
          <AnimatePresence>
            {docName && (
              <motion.div
                className="px-4 pt-3 flex items-center gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-2 text-xs bg-muted/30 py-1.5 px-3 rounded-lg text-muted-foreground">
                  {getDocIcon(docName)}
                  <span className="max-w-[200px] truncate">{docName}</span>
                  <button
                    onClick={clearAttachment}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image attachment preview */}
          <AnimatePresence>
            {imagePreviewUrl && (
              <motion.div
                className="px-4 pt-3 flex items-center gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <img
                    src={imagePreviewUrl}
                    alt={imageName ?? "attached image"}
                    className="h-16 w-16 object-cover rounded-lg border border-muted/40"
                  />
                  <button
                    onClick={clearAttachment}
                    className="absolute -top-1.5 -right-1.5 bg-background border border-muted/40 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent border-none text-foreground/90 text-sm",
                "focus:outline-none placeholder:text-muted-foreground/40",
                "min-h-[44px]"
              )}
              style={{ overflow: "hidden" }}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {/* Attach file */}
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                whileTap={{ scale: 0.94 }}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors relative group"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>

              {/* Voice */}
              <motion.button
                type="button"
                onClick={() => setVoiceOpen(true)}
                disabled={disabled}
                whileTap={{ scale: 0.94 }}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                title="Voice Mode"
              >
                <Mic className="w-4 h-4" />
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_ALL_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {recentCommand && (
                  <motion.span
                    className="text-xs text-muted-foreground/60"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    Using {recentCommand}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Send button */}
              <motion.button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canSend
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <p className="inputbar-disclaimer">
          This AI can &quot;hallucinate&quot;,
          <br />
          so double-check responses.
        </p>
      </div>
    </>
  );
}

/* ──────────────────── Inline VoiceMode (from InputBar) ──────────────────── */
// Minimal voice overlay stub that delegates to the original VoiceMode logic.
// We import VoiceMode dynamically to avoid duplicating 250 lines of code.

import { API_URL, getToken } from "@/lib/api";
import { X } from "lucide-react";

type VoiceStatus = "idle" | "recording" | "thinking" | "speaking";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Hold to speak.",
  recording: "Recording...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

function VoiceModeOverlay({
  open,
  onClose,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<{
    user: string;
    assistant: string;
  } | null>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const startMeterLoop = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!activeRef.current) return;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      setVolume(sum / data.length / 255);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setVolume(0);
  }, []);

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

  const startRecording = useCallback(async () => {
    if (!activeRef.current || status === "thinking" || status === "speaking")
      return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (!activeRef.current) return;
        stopMeter();
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 1000) sendVoice(blob);
        else setStatus("idle");
      };
      recorder.start();
      setStatus("recording");
    } catch {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, conversationId, startMeterLoop, stopMeter]);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const sendVoice = useCallback(
    async (blob: Blob) => {
      if (!activeRef.current) return;
      setStatus("thinking");
      const token = getToken();
      if (!token) {
        onClose();
        return;
      }
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
        setTranscript({
          user: data.text_input ?? "",
          assistant: data.text_response ?? "",
        });
        setStatus("speaking");
        if (data.audio_base64) {
          const audio = new Audio(
            `data:audio/mpeg;base64,${data.audio_base64}`
          );
          audioRef.current = audio;
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
          } catch {
            /* fallback */
          }
          audio.onended = () => {
            if (activeRef.current) {
              stopMeter();
              audioRef.current = null;
              if (audioCtxRef.current?.state !== "closed")
                audioCtxRef.current?.close();
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, startMeterLoop, stopMeter]
  );

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
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isRecording = status === "recording";
  const isBusy = status === "thinking" || status === "speaking";
  const orbScale = 1 + volume * 0.5;

  return (
    <div className="voice-mode-overlay">
      <button
        className={cn(
          "voice-orb-wrapper",
          isBusy && "voice-orb-wrapper--disabled"
        )}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startRecording();
        }}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        onPointerCancel={stopRecording}
        aria-label={isRecording ? "Release to send" : "Hold to speak"}
        disabled={isBusy}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <div
          className={cn(
            "voice-orb",
            isRecording && "voice-orb--listening",
            status === "speaking" && "voice-orb--speaking",
            status === "thinking" && "voice-orb--thinking"
          )}
          style={{
            transform: `scale(${orbScale})`,
            boxShadow: `0 0 ${40 + volume * 80}px ${10 + volume * 40}px rgba(255,138,61,${0.25 + volume * 0.5})`,
          }}
        />
      </button>
      <p className="voice-status">{STATUS_LABELS[status]}</p>
      {transcript && (
        <div className="voice-transcript">
          <p className="voice-transcript-user">{transcript.user}</p>
          <p className="voice-transcript-assistant">{transcript.assistant}</p>
        </div>
      )}
      <button
        onClick={onClose}
        className="voice-close-btn"
        aria-label="Close voice mode"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

export default AnimatedInputBar;
