import { MessageSquare, Plus, X, Trash2 } from "lucide-react";
import type { ConversationSummary } from "@/lib/api";

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

const ChatHistory = ({ conversations, activeId, onSelect, onNew, onDelete, onDeleteAll, open, onClose }: ChatHistoryProps) => {
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

        <div className="sidebar-list">
          {conversations.length === 0 && (
            <p className="sidebar-empty">Nenhuma conversa ainda.</p>
          )}
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => onSelect(conv.id)}
              className={`sidebar-item ${activeId === conv.id ? "sidebar-item--active" : "sidebar-item--inactive"}`}
            >
              <MessageSquare className="sidebar-item-icon" />
              <span className="sidebar-item-title">{conv.title}</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="sidebar-item-delete">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {conversations.length > 0 && (
          <div className="sidebar-footer">
            <button onClick={onDeleteAll} className="sidebar-delete-all">
              <Trash2 className="w-3.5 h-3.5" />
              Apagar todo o histórico
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default ChatHistory;
