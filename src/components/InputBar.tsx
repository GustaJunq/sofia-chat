import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, ImagePlus, X } from "lucide-react";

interface InputBarProps {
  onSend: (message: string, imageBase64?: string, imageMediaType?: string) => void;
  disabled?: boolean;
}

const InputBar = ({ onSend, disabled }: InputBarProps) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
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
