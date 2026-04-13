import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Brain, Terminal, Users, Loader2, Trash2, Upload, X } from "lucide-react";
import { getToken, fetchMemories, deleteMemory, clearAllMemories, type MemoryEntry, fetchSkills, importSkill, type SkillEntry, deleteSkill, fetchSubagents, createSubagent, type SubagentEntry } from "@/lib/api";

const Customization = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("sof_token");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid hsl(var(--border))",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              cursor: "pointer",
              color: "hsl(var(--foreground))",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}>
            PERSONALIZAÇÃO
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "24px 20px",
        maxWidth: "1000px",
        margin: "0 auto",
        width: "100%",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {/* Memory Section */}
          <MemorySection token={token} />

          {/* Skills Section */}
          <SkillsSection token={token} />

          {/* Subagents Section */}
          <SubagentsSection token={token} />
        </div>
      </main>
    </div>
  );
};

// ─── Memory Section ────────────────────────────────────────────────────────────

function MemorySection({ token }: { token: string | null }) {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMemories(token)
      .then(setMemories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteMemory(token, id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!token || !confirm("Apagar toda a memória da SofIA? Ela vai esquecer tudo sobre você.")) return;
    setClearing(true);
    try {
      await clearAllMemories(token);
      setMemories([]);
    } catch { /* ignore */ } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid hsl(var(--border))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.9rem",
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}>
            MEMÓRIA DA SOFIA
          </span>
        </div>
        {memories.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid hsl(var(--destructive) / 0.4)",
              background: "hsl(var(--destructive) / 0.08)",
              color: "hsl(var(--destructive))",
              fontSize: "0.7rem",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            {clearing ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Trash2 style={{ width: 10, height: 10 }} />}
            Limpar
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", maxHeight: "400px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <Loader2 style={{ width: 20, height: 20, color: "hsl(var(--muted-foreground))" }} className="animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.8rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <Brain style={{ width: 28, height: 28, margin: "0 auto 12px", opacity: 0.3 }} />
            <p>Sem memórias ainda.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {memories.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px",
                  background: "hsl(var(--muted) / 0.3)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", lineHeight: 1.4, color: "hsl(var(--foreground) / 0.9)", margin: 0 }}>
                    {m.content}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--destructive))")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
                >
                  {deletingId === m.id ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Trash2 style={{ width: 10, height: 10 }} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid hsl(var(--border))",
        fontSize: "0.65rem",
        color: "hsl(var(--muted-foreground))",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {memories.length} {memories.length === 1 ? "memória" : "memórias"}
      </div>
    </div>
  );
}

// ─── Skills Section ────────────────────────────────────────────────────────────

function SkillsSection({ token }: { token: string | null }) {
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchSkills(token)
      .then(setSkills)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (!file.name.endsWith(".zip")) {
      alert("Por favor, selecione um arquivo .zip");
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await importSkill(token, base64, file.name);
          const updated = await fetchSkills(token);
          setSkills(updated);
        } catch (err: any) {
          alert(err.message);
        } finally {
          setImporting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setImporting(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    if (!token || !confirm(`Tem certeza que deseja deletar a skill "${skillId}"?`)) return;
    setDeletingId(skillId);
    try {
      await deleteSkill(token, skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid hsl(var(--border))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Terminal style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.9rem",
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}>
            SKILLS
          </span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".zip"
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid hsl(var(--primary) / 0.4)",
            background: "hsl(var(--primary) / 0.08)",
            color: "hsl(var(--primary))",
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            letterSpacing: "0.03em",
          }}
        >
          {importing ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Upload style={{ width: 10, height: 10 }} />}
          Importar
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", maxHeight: "400px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <Loader2 style={{ width: 20, height: 20, color: "hsl(var(--muted-foreground))" }} className="animate-spin" />
          </div>
        ) : skills.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.8rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <Terminal style={{ width: 28, height: 28, margin: "0 auto 12px", opacity: 0.3 }} />
            <p>Nenhuma skill importada.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {skills.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px",
                  background: "hsl(var(--muted) / 0.3)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "hsl(var(--foreground) / 0.9)", margin: 0 }}>
                    {s.id}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.uploaded_at ? new Date(s.uploaded_at).toLocaleDateString("pt-BR") : "Importada"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--destructive))")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
                >
                  {deletingId === s.id ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Trash2 style={{ width: 10, height: 10 }} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid hsl(var(--border))",
        fontSize: "0.65rem",
        color: "hsl(var(--muted-foreground))",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {skills.length} {skills.length === 1 ? "skill" : "skills"}
      </div>
    </div>
  );
}

// ─── Subagents Section ────────────────────────────────────────────────────────

function SubagentsSection({ token }: { token: string | null }) {
  const [subagents, setSubagents] = useState<SubagentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPersonality, setNewPersonality] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchSubagents(token)
      .then(setSubagents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName || !newPersonality) return;
    setCreating(true);
    try {
      const res = await createSubagent(token, newName, newPersonality);
      setSubagents((prev) => [res, ...prev]);
      setNewName("");
      setNewPersonality("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "16px",
        borderBottom: "1px solid hsl(var(--border))",
      }}>
        <Users style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.9rem",
          letterSpacing: "0.04em",
          fontWeight: 500,
        }}>
          SUBAGENTS
        </span>
      </div>

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        style={{
          padding: "12px",
          borderBottom: "1px solid hsl(var(--border))",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "hsl(var(--muted) / 0.2)",
        }}
      >
        <input
          type="text"
          placeholder="Nome"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          style={{
            padding: "6px 10px",
            borderRadius: 4,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
            fontSize: "0.75rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
        <textarea
          placeholder="Personalidade"
          value={newPersonality}
          onChange={(e) => setNewPersonality(e.target.value)}
          required
          style={{
            padding: "6px 10px",
            borderRadius: 4,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
            fontSize: "0.75rem",
            fontFamily: "'JetBrains Mono', monospace",
            minHeight: "60px",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          disabled={creating}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid hsl(var(--primary) / 0.4)",
            background: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            fontSize: "0.75rem",
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
          }}
        >
          {creating ? "Criando..." : "Criar"}
        </button>
      </form>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", maxHeight: "400px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <Loader2 style={{ width: 20, height: 20, color: "hsl(var(--muted-foreground))" }} className="animate-spin" />
          </div>
        ) : subagents.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.8rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <Users style={{ width: 28, height: 28, margin: "0 auto 12px", opacity: 0.3 }} />
            <p>Nenhum subagente criado.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {subagents.map((sa) => (
              <div
                key={sa.id}
                style={{
                  padding: "10px",
                  background: "hsl(var(--muted) / 0.3)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
              >
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "hsl(var(--foreground) / 0.9)", margin: 0 }}>
                  {sa.name}
                </p>
                <p style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
                  {sa.personality}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid hsl(var(--border))",
        fontSize: "0.65rem",
        color: "hsl(var(--muted-foreground))",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {subagents.length} {subagents.length === 1 ? "subagente" : "subagentes"}
      </div>
    </div>
  );
}

export default Customization;
