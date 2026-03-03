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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            Histórico
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 pt-2">
              Nenhuma conversa ainda.
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-0.5 ${
                activeId === conv.id
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent transition-all text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <button
              onClick={onDeleteAll}
              className="flex items-center gap-2 text-xs text-sidebar-foreground/40 hover:text-destructive transition-colors"
            >
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
