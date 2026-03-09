import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArrowUp, ImagePlus, X, Mic, Loader2 } from "lucide-react";
import { API_URL, getToken } from "@/lib/api";

interface InputBarProps {
  onSend: (message: string, imageBase64?: string, imageMediaType?: string) => void;
  onVoiceResponse?: (userText: string, assistantText: string, conversationId: string, audioBase64: string) => void;
  disabled?: boolean;
  conversationId?: string | null;
}

const InputBar = ({ onSend, onVoiceResponse, disabled, conversationId }: InputBarProps) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "loading" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const sendVoice = useCallback(async (blob: Blob) => {
    const token = getToken();
    if (!token) { setVoiceState("idle"); return; }

    setVoiceState("loading");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");
      if (conversationId) formData.append("conversation_id", conversationId);

      const res = await fetch(`${API_URL}/voice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Voice error");
      const data = await res.json();

      onVoiceResponse?.(data.text_input, data.text_response, data.conversation_id, data.audio_base64);

      if (data.audio_base64) {
        new Audio(`data:audio/mpeg;base64,${data.audio_base64}`).play().catch(() => {});
      }
      setVoiceState("idle");
    } catch {
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 600);
    }
  }, [conversationId, onVoiceResponse]);

  const startRecording = useCallback(async () => {
    if (voiceState !== "idle" || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) sendVoice(blob);
        else setVoiceState("idle");
      };
      recorder.start();
      setVoiceState("recording");
    } catch {
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 600);
    }
  }, [voiceState, disabled, sendVoice]);

  const canSend = (text.trim().length > 0 || !!imageBase64) && !disabled;

  return (
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
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={voiceState === "recording" ? stopRecording : undefined}
            disabled={disabled || voiceState === "loading"}
            className={`inputbar-voice ${voiceState === "recording" ? "voice-recording" : ""} ${voiceState === "error" ? "voice-error" : ""}`}
            title="Segurar para gravar"
          >
            {voiceState === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
            {voiceState !== "loading" && <Mic className="w-5 h-5" />}
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
  );
};

export default InputBar;