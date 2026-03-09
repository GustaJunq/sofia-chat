import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArrowUp, ImagePlus, X, Mic } from "lucide-react";
import { API_URL, getToken } from "@/lib/api";

/* ──────────────────── Voice Mode ──────────────────── */

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
}

type VoiceStatus = "listening" | "thinking" | "speaking";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  listening: "Ouvindo...",
  thinking: "Pensando...",
  speaking: "Falando...",
};

function VoiceMode({ open, onClose, conversationId }: VoiceModeProps) {
  const [status, setStatus] = useState<VoiceStatus>("listening");
  const [transcript, setTranscript] = useState<{ user: string; assistant: string } | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const closingRef = useRef(false);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    cancelAnimationFrame(rafRef.current);
    mediaRecRef.current?.stream?.getTracks().forEach((t) => t.stop());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    mediaRecRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!activeRef.current) return;
    setStatus("listening");
    setTranscript(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (closingRef.current) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        sendVoice(blob);
      };

      recorder.start();

      // Silence detection
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart: number | null = null;

      const checkSilence = () => {
        if (!activeRef.current) return;
        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;

        if (avg < 8) {
          if (!silenceStart) silenceStart = Date.now();
          else if (Date.now() - silenceStart > 1500) {
            stopRecording();
            return;
          }
        } else {
          silenceStart = null;
        }
        rafRef.current = requestAnimationFrame(checkSilence);
      };
      rafRef.current = requestAnimationFrame(checkSilence);
    } catch {
      // Mic permission denied — close
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const stopRecording = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = mediaRecRef.current;
    if (rec && rec.state === "recording") {
      rec.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }, []);

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

      // Play audio
      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
        audio.onended = () => { if (activeRef.current) startRecording(); };
        audio.onerror = () => { if (activeRef.current) startRecording(); };
        await audio.play();
      } else {
        if (activeRef.current) startRecording();
      }
    } catch {
      if (activeRef.current) startRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Open / close lifecycle
  useEffect(() => {
    if (open) {
      activeRef.current = true;
      closingRef.current = false;
      startRecording();
    } else {
      closingRef.current = true;
      cleanup();
    }
    return () => { closingRef.current = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="voice-mode-overlay">
      {/* Orb */}
      <button
        className="voice-orb-wrapper"
        onClick={() => {
          if (status === "listening") stopRecording();
        }}
        aria-label="Parar gravação"
      >
        <div className={`voice-orb ${status === "listening" ? "voice-orb--listening" : ""} ${status === "speaking" ? "voice-orb--speaking" : ""} ${status === "thinking" ? "voice-orb--thinking" : ""}`} />
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
