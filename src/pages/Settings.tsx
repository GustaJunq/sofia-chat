import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight, Palette, LogOut } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("sof_token");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sof_token");
    navigate("/login", { replace: true });
  };

  const settingsOptions = [
    {
      id: "customization",
      label: "Personalização",
      description: "Gerencie subagentes, skills e memória",
      icon: Palette,
      onClick: () => navigate("/settings/customization"),
    },
  ];

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
        <div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}>
            CONFIGURAÇÕES
          </h1>
        </div>
        <button
          onClick={() => navigate("/chats")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Voltar aos Chats
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "24px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}>
        {/* Settings Options */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 32,
        }}>
          <h2 style={{
            fontSize: "0.9rem",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
            color: "hsl(var(--muted-foreground))",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Opções
          </h2>
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(var(--muted) / 0.5)";
                  e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(var(--card))";
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                  <Icon style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
                  <div>
                    <p style={{ fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
                      {option.label}
                    </p>
                    <p style={{
                      fontSize: "0.8rem",
                      color: "hsl(var(--muted-foreground))",
                      margin: "4px 0 0",
                    }}>
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: "hsl(var(--muted-foreground))" }} />
              </button>
            );
          })}
        </div>

        {/* Logout Section */}
        <div style={{
          borderTop: "1px solid hsl(var(--border))",
          paddingTop: 24,
        }}>
          <h2 style={{
            fontSize: "0.9rem",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
            color: "hsl(var(--muted-foreground))",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Conta
          </h2>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 6,
              border: "1px solid hsl(var(--destructive) / 0.3)",
              background: "hsl(var(--destructive) / 0.05)",
              color: "hsl(var(--destructive))",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--destructive) / 0.1)";
              e.currentTarget.style.borderColor = "hsl(var(--destructive) / 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--destructive) / 0.05)";
              e.currentTarget.style.borderColor = "hsl(var(--destructive) / 0.3)";
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            Sair
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
