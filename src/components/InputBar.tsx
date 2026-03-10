import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArrowUp, ImagePlus, X, Mic } from "lucide-react";
import { API_URL, getToken } from "@/lib/api";

/* ──────────────────── Voice Mode ──────────────────── */

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
}

type VoiceStatus = "idle" | "recording" | "thinking" | "speaking";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Segure para falar",
  recording: "Gravando...",
  thinking: "Pensando...",
  speaking: "Falando...",
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
        aria-label={isRecording ? "Solte para enviar" : "Segure para falar"}
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
      <button onClick={onClose} className="voice-close-btn" aria-label="Fechar modo voz">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

/* ──────────────────── Input Bar ──────────────────── */

interface InputBarProps {
  onSend: (message: string, imageBase64?: string, imageMediaType?: string) => void;
  disabled?: boolean;
  conversationId?: string | null;
}

const InputBar = ({ onSend, disabled, conversationId }: InputBarProps) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
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

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageMediaType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",", 2)[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleImageSelect(file);
        break;
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMediaType("image/jpeg");
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !imageBase64) || disabled) return;
    onSend(trimmed, imageBase64 ?? undefined, imageBase64 ? imageMediaType : undefined);
    setText("");
    handleRemoveImage();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (text.trim().length > 0 || !!imageBase64) && !disabled;

  return (
    <>
      <VoiceMode open={voiceOpen} onClose={() => setVoiceOpen(false)} conversationId={conversationId ?? null} />

      <div className="inputbar-wrapper">
        <div className="inputbar-surface">
          {imagePreview && (
            <div className="inputbar-image-preview">
              <img src={imagePreview} alt="Imagem selecionada" className="inputbar-image-thumb" />
              <button onClick={handleRemoveImage} className="inputbar-image-remove" title="Remover imagem">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="inputbar-row">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="inputbar-attach"
              title="Enviar imagem"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={imageBase64 ? "Pergunte sobre a imagem..." : "Faça uma pergunta..."}
              disabled={disabled}
              rows={1}
              className="inputbar-textarea"
            />

            <button
              onClick={() => setVoiceOpen(true)}
              disabled={disabled}
              className="inputbar-mic"
              title="Modo voz"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button onClick={handleSend} disabled={!canSend} className="inputbar-send">
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="inputbar-disclaimer">
          sofIA pode "alucinar" nas respostas,<br />então confira bem as respostas.
        </p>
      </div>
    </>
  );
};

export default InputBar;
