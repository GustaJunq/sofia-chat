import { useState, useRef, useCallback } from "react";
import { MessageSquare, Plus, X, Trash2, Camera, Pencil, Check } from "lucide-react";
import type { ConversationSummary } from "@/lib/api";
import { useProfile } from "@/hooks/useProfile";

interface ChatHistoryProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  open: boolean;
  onClose: () => void;
}

// ─── Swipeable item ────────────────────────────────────────────────────────────

interface SwipeItemProps {
  conv: ConversationSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = 60; // px to trigger reveal
const MAX_SWIPE = 80;       // max translate

const SwipeItem = ({ conv, isActive, onSelect, onDelete }: SwipeItemProps) => {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const startXRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = startXRef.current - e.touches[0].clientX;
    if (dx < 0) {
      // swiping right — snap back if already revealed
      if (revealed) {
        const raw = Math.max(0, MAX_SWIPE + dx);
        currentOffsetRef.current = raw;
        setOffset(raw);
      }
      return;
    }
    const raw = Math.min(dx, MAX_SWIPE);
    currentOffsetRef.current = raw;
    setOffset(raw);
  }, [revealed]);

  const handleTouchEnd = useCallback(() => {
    if (currentOffsetRef.current > SWIPE_THRESHOLD) {
      setOffset(MAX_SWIPE);
      setRevealed(true);
    } else {
      setOffset(0);
      setRevealed(false);
    }
    startXRef.current = null;
  }, []);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    // animate out
    if (itemRef.current) {
      itemRef.current.style.transition = "max-height 0.25s ease, opacity 0.2s ease";
      itemRef.current.style.maxHeight = "0px";
      itemRef.current.style.opacity = "0";
    }
    await new Promise((r) => setTimeout(r, 260));
    onDelete(conv.id);
  }, [conv.id, onDelete]);

  return (
    <div
      ref={itemRef}
      className="swipe-item-wrapper"
      style={{ position: "relative", overflow: "hidden", maxHeight: "56px" }}
    >
      {/* Delete action — revealed on swipe */}
      <div
        className="swipe-delete-bg"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: MAX_SWIPE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(0 72% 51% / 0.15)",
          borderRadius: "0 10px 10px 0",
        }}
      >
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            color: "hsl(0 72% 65%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <Trash2 className="w-4 h-4" />
          Deletar
        </button>
      </div>

      {/* Main item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (!revealed) onSelect(conv.id); }}
        className={`group sidebar-item ${isActive ? "sidebar-item--active" : "sidebar-item--inactive"}`}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: startXRef.current === null ? "transform 0.22s cubic-bezier(.25,.8,.25,1)" : "none",
          position: "relative",
          zIndex: 1,
          cursor: "pointer",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        <MessageSquare className="sidebar-item-icon" />
        <span className="sidebar-item-title">{conv.title}</span>
        {/* Desktop delete button (visible on hover, hidden on mobile) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="sidebar-item-delete"
          style={{ touchAction: "none" }}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ─── Profile section ───────────────────────────────────────────────────────────

const ProfileSection = () => {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await uploadAvatar(file);
      updateProfile({ avatarUrl: dataUrl });
    } catch {}
    e.target.value = "";
  };

  return (
    <div
      style={{
        padding: "16px 12px 12px",
        borderBottom: "1px solid hsl(var(--border))",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              overflow: "hidden",
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "hsl(var(--accent))",
              border: "1px solid hsl(var(--border))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
            }}
            title="Trocar foto"
          >
            <Camera style={{ width: 9, height: 9 }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditing(false); }}
                autoFocus
                maxLength={32}
                style={{
                  flex: 1,
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: "0.8rem",
                  color: "hsl(var(--foreground))",
                  outline: "none",
                  width: "100%",
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleSaveName}
                style={{ color: "hsl(var(--foreground))", background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
              >
                <Check style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "hsl(var(--foreground))",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.name}
              </span>
              <button
                onClick={() => { setNameInput(profile.name); setEditing(true); }}
                style={{ color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
                title="Editar nome"
              >
                <Pencil style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
          <span
            style={{
              fontSize: "0.68rem",
              color: "hsl(var(--muted-foreground))",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Perfil
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const ChatHistory = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onDeleteAll,
  open,
  onClose,
}: ChatHistoryProps) => {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar--open" : "sidebar--closed"}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Histórico</span>
          <div className="flex items-center gap-1">
            <button onClick={onNew} className="sidebar-icon-btn" title="Nova conversa">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="sidebar-icon-btn">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Profile section ── */}
        <ProfileSection />

        {/* ── Conversation list ── */}
        <div className="sidebar-list" style={{ overflowX: "hidden" }}>
          {conversations.length === 0 && (
            <p className="sidebar-empty">Nenhuma conversa ainda.</p>
          )}
          {conversations.map((conv) => (
            <SwipeItem
              key={conv.id}
              conv={conv}
              isActive={activeId === conv.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>

        {conversations.length > 0 && (
          <div className="sidebar-footer">
            <button onClick={onDeleteAll} className="sidebar-delete-all">
              <Trash2 className="w-3.5 h-3.5" />
              Limpar histórico
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default ChatHistory;
