import StarLogo from "./StarLogo";
import { Globe, BookOpen, FileText, Lightbulb, BarChart3, Languages, Code, FileSearch } from "lucide-react";

const PROMPT_SHORTCUTS = [
  { label: "Pesquisa na web", icon: Globe, template: "Faça uma pesquisa sobre [SEU ASSUNTO], por gentileza." },
  { label: "Tarefas de casa", icon: BookOpen, template: "Me ajude com essa tarefa de casa: [DESCREVA A TAREFA]." },
  { label: "Redação / Texto", icon: FileText, template: "Escreva um texto sobre [TEMA] com tom [FORMAL/INFORMAL]." },
  { label: "Me dê ideias", icon: Lightbulb, template: "Me dê ideias criativas para [SEU PROJETO OU SITUAÇÃO]." },
  { label: "Analisar dados", icon: BarChart3, template: "Analise os seguintes dados e me dê insights: [COLE SEUS DADOS AQUI]." },
  { label: "Traduzir texto", icon: Languages, template: "Traduza o seguinte texto para [IDIOMA]: [SEU TEXTO AQUI]." },
  { label: "Ajuda com código", icon: Code, template: "Me ajude com o seguinte código em [LINGUAGEM]: [COLE SEU CÓDIGO AQUI]." },
  { label: "Resumir conteúdo", icon: FileSearch, template: "Resuma o seguinte conteúdo de forma clara e objetiva: [COLE O CONTEÚDO AQUI]." },
];

interface HeroViewProps {
  visible: boolean;
  onSelectPrompt?: (template: string) => void;
}

const HeroView = ({ visible, onSelectPrompt }: HeroViewProps) => {
  return (
    <div
      className="hero-container"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-40px)",
      }}
    >
      <div className="hero-inner">
        <StarLogo className="w-[100px] h-[100px] animate-star-pulse relative z-10" />

        <div className="prompt-shortcuts">
          {PROMPT_SHORTCUTS.map((s) => (
            <button
              key={s.label}
              className="prompt-shortcut-btn"
              onClick={() => onSelectPrompt?.(s.template)}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroView;
