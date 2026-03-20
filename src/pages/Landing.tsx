import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, Check, Plus } from "lucide-react";

function SpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.current = { x: e.clientX, y: e.clientY }; });

    interface Star { x:number;y:number;size:number;alpha:number;baseAlpha:number;twinkleSpeed:number;twinkleOffset:number;color:string;layer:number; }
    function makeStars(count:number, layer:number): Star[] {
      return Array.from({ length: count }, () => {
        const r = Math.random();
        const color = r>0.94?"200,180,255":r>0.88?"255,230,200":r>0.82?"180,210,255":"255,255,255";
        const size  = layer===0?0.2+Math.random()*0.6:layer===1?0.4+Math.random()*1.0:0.7+Math.random()*1.8;
        const baseAlpha = layer===0?0.12+Math.random()*0.35:layer===1?0.2+Math.random()*0.5:0.4+Math.random()*0.55;
        return { x:Math.random(),y:Math.random(),size,alpha:baseAlpha,baseAlpha,twinkleSpeed:0.2+Math.random()*(layer===2?1.8:0.8),twinkleOffset:Math.random()*Math.PI*2,color,layer };
      });
    }
    const starsAll:Star[] = [...makeStars(300,0),...makeStars(120,1),...makeStars(40,2)];

    interface Shoot { x:number;y:number;vx:number;vy:number;life:number;maxLife:number;active:boolean; }
    const shoots:Shoot[] = Array.from({length:5},()=>({x:0,y:0,vx:0,vy:0,life:0,maxLife:1,active:false}));
    function spawnShoot() {
      const s = shoots.find(sh=>!sh.active); if(!s)return;
      const angle=(Math.random()*30+15)*(Math.PI/180); const speed=0.4+Math.random()*0.5;
      s.x=Math.random()*0.9; s.y=Math.random()*0.4; s.vx=speed*Math.cos(angle); s.vy=speed*Math.sin(angle);
      s.maxLife=60+Math.random()*60; s.life=s.maxLife; s.active=true;
    }
    let shootTimer=0, nextShoot=180+Math.random()*300;

    interface ConstellationDef { stars:[number,number][];edges:[number,number][]; }
    const constellations:ConstellationDef[] = [
      { stars:[[0.07,0.14],[0.12,0.09],[0.17,0.11],[0.09,0.20],[0.15,0.21],[0.08,0.28],[0.12,0.30],[0.16,0.28]], edges:[[0,1],[1,2],[0,3],[2,4],[3,6],[4,6],[5,6],[6,7]] },
      { stars:[[0.80,0.09],[0.85,0.11],[0.89,0.10],[0.93,0.14],[0.91,0.19],[0.86,0.21],[0.82,0.19]], edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] },
      { stars:[[0.14,0.68],[0.20,0.63],[0.26,0.68],[0.20,0.73],[0.20,0.68]], edges:[[0,4],[2,4],[1,4],[3,4]] },
      { stars:[[0.70,0.12],[0.74,0.17],[0.78,0.14],[0.76,0.20],[0.72,0.20],[0.74,0.17]], edges:[[0,5],[1,2],[2,3],[3,4],[4,1],[0,1]] },
      { stars:[[0.44,0.06],[0.49,0.10],[0.54,0.06],[0.59,0.10],[0.64,0.06]], edges:[[0,1],[1,2],[2,3],[3,4]] },
    ];
    const cStarsFlat = constellations.flatMap(c=>c.stars.map(([x,y])=>({x,y})));

    let t=0;
    function draw() {
      t+=0.01;
      const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);

      // Milky Way band
      const mwAngle=0.35; const cx=W*0.5,cy=H*0.45;
      for(let i=0;i<4;i++){
        const bw=W*(0.18+i*0.06); const alpha=[0.028,0.018,0.010,0.006][i];
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(mwAngle);
        const grd=ctx.createLinearGradient(-bw,0,bw,0);
        grd.addColorStop(0,`rgba(120,100,180,0)`); grd.addColorStop(0.3,`rgba(150,130,210,${alpha})`);
        grd.addColorStop(0.5,`rgba(180,160,240,${alpha*1.4})`); grd.addColorStop(0.7,`rgba(150,130,210,${alpha})`); grd.addColorStop(1,`rgba(120,100,180,0)`);
        ctx.fillStyle=grd; ctx.fillRect(-W,-H,W*2,H*2); ctx.restore();
      }

      // nebula clouds
      const nebulas=[{x:0.18,y:0.28,r:0.38,cr:"60,30,120",a:0.055},{x:0.78,y:0.55,r:0.30,cr:"90,40,160",a:0.045},{x:0.52,y:0.80,r:0.25,cr:"40,20,100",a:0.04},{x:0.88,y:0.12,r:0.22,cr:"80,50,150",a:0.05},{x:0.35,y:0.60,r:0.18,cr:"50,80,140",a:0.03}];
      ctx.globalCompositeOperation="screen";
      for(const n of nebulas){
        const grd=ctx.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,n.r*Math.max(W,H));
        grd.addColorStop(0,`rgba(${n.cr},${n.a})`); grd.addColorStop(0.4,`rgba(${n.cr},${n.a*0.6})`);
        grd.addColorStop(0.75,`rgba(${n.cr},${n.a*0.2})`); grd.addColorStop(1,`rgba(${n.cr},0)`);
        ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
      }
      ctx.globalCompositeOperation="source-over";

      // far + mid stars
      for(const s of starsAll){
        if(s.layer===2)continue;
        const tw=s.layer===0?0.85+0.15*Math.sin(t*s.twinkleSpeed+s.twinkleOffset):0.65+0.35*Math.sin(t*s.twinkleSpeed+s.twinkleOffset);
        ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.size,0,Math.PI*2); ctx.fillStyle=`rgba(${s.color},${s.baseAlpha*tw})`; ctx.fill();
      }

      // near stars with glow + spikes
      for(const s of starsAll){
        if(s.layer!==2)continue;
        const tw=0.5+0.5*Math.sin(t*s.twinkleSpeed+s.twinkleOffset);
        const a=s.baseAlpha*tw; const sx=s.x*W,sy=s.y*H;
        const halo=ctx.createRadialGradient(sx,sy,0,sx,sy,s.size*4);
        halo.addColorStop(0,`rgba(${s.color},${a*0.5})`); halo.addColorStop(1,`rgba(${s.color},0)`);
        ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(sx,sy,s.size*4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx,sy,s.size,0,Math.PI*2); ctx.fillStyle=`rgba(${s.color},${Math.min(a*1.4,1)})`; ctx.fill();
        if(s.size>1.2&&a>0.5){
          const sp=s.size*5*tw;
          ctx.strokeStyle=`rgba(${s.color},${a*0.4})`; ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(sx-sp,sy); ctx.lineTo(sx+sp,sy); ctx.moveTo(sx,sy-sp); ctx.lineTo(sx,sy+sp); ctx.stroke();
        }
      }

      // constellation edges + stars
      let off=0;
      for(const c of constellations){
        for(const [a,b] of c.edges){
          const sa=c.stars[a],sb=c.stars[b];
          const pulse=0.45+0.12*Math.sin(t*0.5+off*0.3);
          ctx.beginPath(); ctx.moveTo(sa[0]*W,sa[1]*H); ctx.lineTo(sb[0]*W,sb[1]*H);
          ctx.strokeStyle=`rgba(160,120,255,${pulse*0.4})`; ctx.lineWidth=0.5; ctx.stroke();
        }
        for(const [sx,sy] of c.stars){
          const pulse=0.75+0.25*Math.sin(t*0.8+off*0.6);
          const glow=ctx.createRadialGradient(sx*W,sy*H,0,sx*W,sy*H,7);
          glow.addColorStop(0,`rgba(190,160,255,${0.5*pulse})`); glow.addColorStop(1,"rgba(190,160,255,0)");
          ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(sx*W,sy*H,7,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx*W,sy*H,1.4,0,Math.PI*2); ctx.fillStyle=`rgba(220,205,255,${0.95*pulse})`; ctx.fill();
          off++;
        }
      }

      // mouse proximity
      const mx=mouse.current.x,my=mouse.current.y;
      for(const s of cStarsFlat){
        const sx=s.x*W,sy=s.y*H; const dist=Math.hypot(sx-mx,sy-my);
        if(dist<170){
          const str=1-dist/170;
          ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(mx,my);
          ctx.strokeStyle=`rgba(180,140,255,${str*0.65})`; ctx.lineWidth=str*0.9; ctx.stroke();
          const hg=ctx.createRadialGradient(sx,sy,0,sx,sy,12*str);
          hg.addColorStop(0,`rgba(210,180,255,${0.8*str})`); hg.addColorStop(1,"rgba(210,180,255,0)");
          ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(sx,sy,12*str,0,Math.PI*2); ctx.fill();
        }
      }

      // cursor glow
      if(mx>0&&mx<W){
        const cg=ctx.createRadialGradient(mx,my,0,mx,my,50);
        cg.addColorStop(0,"rgba(130,90,255,0.06)"); cg.addColorStop(1,"rgba(130,90,255,0)");
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(mx,my,50,0,Math.PI*2); ctx.fill();
      }

      // shooting stars
      shootTimer++;
      if(shootTimer>=nextShoot){ spawnShoot(); shootTimer=0; nextShoot=200+Math.random()*400; }
      for(const s of shoots){
        if(!s.active)continue; s.life--;
        if(s.life<=0){s.active=false;continue;}
        const prog=s.life/s.maxLife; const alpha=Math.sin(prog*Math.PI)*0.85;
        const tailLen=(1-prog)*0.15;
        const x1=s.x*W,y1=s.y*H; const x0=x1-tailLen*W*s.vx,y0=y1-tailLen*H*s.vy;
        s.x+=s.vx/W*1.2; s.y+=s.vy/H*1.2;
        const grad=ctx.createLinearGradient(x0,y0,x1,y1);
        grad.addColorStop(0,"rgba(255,255,255,0)"); grad.addColorStop(0.7,`rgba(220,210,255,${alpha*0.5})`); grad.addColorStop(1,`rgba(255,255,255,${alpha})`);
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.strokeStyle=grad; ctx.lineWidth=1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x1,y1,1.5,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${alpha})`; ctx.fill();
      }

      raf=requestAnimationFrame(draw);
    }
    draw();
    return()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

function useReveal() {
  useEffect(()=>{
    const els=document.querySelectorAll(".landing-reveal");
    const io=new IntersectionObserver((entries)=>{
      entries.forEach((e,i)=>{ if(e.isIntersecting){setTimeout(()=>e.target.classList.add("landing-reveal-visible"),i*60);io.unobserve(e.target);} });
    },{threshold:0.07});
    els.forEach(el=>io.observe(el)); return()=>io.disconnect();
  },[]);
}

const ACCENT="147,100,255",ACCENT_HEX="#9364ff",ACCENT_LT="#b090ff";
const btnGhost="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium uppercase tracking-widest transition-all duration-200 border-white/15 text-white/45 hover:bg-white/5 hover:text-white/80 hover:border-white/25";
const btnSolid="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-200 text-white hover:scale-[1.02]";

function StarIcon({className,style}:{className?:string;style?:React.CSSProperties}){
  return(<svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6.5L20 12l-6.5 1.5L12 22l-1.5-6.5L4 12l6.5-1.5z"/><path d="M12 6l.8 3.5.7-.7-.7.7 3.5.8-3.5.7-.8 3.5-.8-3.5-3.5-.7 3.5-.8z" opacity="0.4"/></svg>);
}

const features=[
  {title:"Chat inteligente",desc:"Converse naturalmente. A SynastrIA entende contexto, memória da conversa e responde com precisão.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M8 9h8M8 13h6M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>},
  {title:"Raciocínio avançado",desc:"Resolva problemas complexos, análises matemáticas e lógicas com o modelo syn-v1-pro.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/></svg>},
  {title:"Geração de imagens",desc:"Descreva e crie imagens originais com IA. Basta digitar o que você quer ver.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 5 5"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>},
  {title:"Modo voz",desc:"Fale diretamente com a SynastrIA. Segure para gravar, ela processa e responde em áudio.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>},
  {title:"Visão computacional",desc:"Envie imagens e a SynastrIA analisa, descreve e responde perguntas sobre o que vê.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>},
  {title:"Histórico de chats",desc:"Todas as suas conversas salvas e acessíveis. Continue de onde parou, quando quiser.",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>},
];

const faqs=[
  {q:"O que é a SynastrIA?",a:"A SynastrIA é uma assistente de inteligência artificial criada para conversar, raciocinar e criar. Use para tirar dúvidas, escrever textos, resolver problemas e gerar imagens — tudo em uma interface simples e poderosa."},
  {q:"Preciso de cartão de crédito para começar?",a:"Não. O plano gratuito não exige cartão de crédito. Basta criar uma conta e já começar a usar. O cartão só é necessário para assinar o plano Pro."},
  {q:"Qual a diferença entre syn-v1-free e syn-v1-pro?",a:"O syn-v1-free é ótimo para o dia a dia. O syn-v1-pro possui raciocínio mais avançado — ideal para tarefas complexas como análises, código avançado e respostas mais elaboradas."},
  {q:"Posso cancelar o plano Pro quando quiser?",a:"Sim. O plano Pro é mensal e você pode cancelar a qualquer momento. Sem multas, sem burocracia."},
  {q:"Tem aplicativo para celular?",a:"A versão mobile está em desenvolvimento. Por enquanto, o site funciona muito bem no celular pelo navegador."},
];

function FaqItem({q,a}:{q:string;a:string}){
  const[open,setOpen]=useState(false);
  return(
    <div className="border-b transition-colors" style={{borderColor:open?`rgba(${ACCENT},0.25)`:"rgba(255,255,255,0.07)"}}>
      <button onClick={()=>setOpen(v=>!v)} className="w-full flex items-center justify-between py-5 gap-4 text-left transition-colors" style={{fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",fontSize:"0.76rem",letterSpacing:"0.04em",color:open?ACCENT_LT:"rgba(255,255,255,0.5)"}}>
        {q}<Plus className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300" style={{transform:open?"rotate(45deg)":"rotate(0deg)",color:open?ACCENT_LT:"rgba(255,255,255,0.25)"}}/>
      </button>
      <div className={`faq-answer-inner${open?" faq-answer-inner--open":""}`}>
        <p className="pb-5 pr-8" style={{fontSize:"0.71rem",color:"rgba(255,255,255,0.38)",lineHeight:1.9,letterSpacing:"0.025em"}}>{a}</p>
      </div>
    </div>
  );
}

const Landing=()=>{
  const navigate=useNavigate();
  useEffect(()=>{const token=sessionStorage.getItem("sof_token");if(token)navigate("/chats",{replace:true});},[navigate]);
  useReveal();
  const sectionLabel="text-[0.6rem] uppercase tracking-[0.2em] mb-12 flex items-center gap-3";

  return(
    <div className="relative overflow-x-hidden" style={{fontFamily:"'JetBrains Mono', ui-monospace, monospace",background:"#04030a",color:"#fff"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .landing-fade-1{animation:fadeUp .9s cubic-bezier(.22,.68,0,1.2) .1s both}
        .landing-fade-2{animation:fadeUp .9s cubic-bezier(.22,.68,0,1.2) .28s both}
        .landing-fade-3{animation:fadeUp .9s cubic-bezier(.22,.68,0,1.2) .42s both}
        .landing-scroll-hint{animation:fadeIn 1s ease 1.2s both}
        .landing-reveal{opacity:0;transform:translateY(18px);transition:opacity .65s cubic-bezier(.22,.68,0,1.1),transform .65s cubic-bezier(.22,.68,0,1.1)}
        .landing-reveal-visible{opacity:1;transform:translateY(0)}
        .faq-answer-inner{max-height:0;overflow:hidden;transition:max-height .38s cubic-bezier(.4,0,.2,1)}
        .faq-answer-inner--open{max-height:320px}
        .feature-card:hover .feature-icon{color:rgba(${ACCENT},0.85)!important}
        .feature-card:hover .feature-title{color:${ACCENT_LT}!important}
        .violet-glow{text-shadow:0 0 80px rgba(${ACCENT},0.28),0 0 200px rgba(${ACCENT},0.12)}
      `}</style>

      <SpaceCanvas/>

      <nav className="fixed inset-x-0 top-0 z-50">
        <div className="absolute inset-x-0 top-0 h-24" style={{background:"linear-gradient(to bottom, rgba(4,3,10,0.94) 50%, transparent)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <StarIcon className="w-4 h-4" style={{color:ACCENT_HEX}}/>
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]" style={{color:"rgba(255,255,255,0.9)"}}>SynastrIA</span>
          </div>
          <ul className="hidden md:flex gap-1 list-none">
            {[{label:"Recursos",href:"#recursos"},{label:"Planos",href:"#planos"},{label:"FAQ",href:"#faq"}].map(({label,href})=>(
              <li key={label}><a href={href} className="block px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.08em] transition-colors duration-150" style={{color:"rgba(255,255,255,0.32)"}} onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.8)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.32)")}>{label}</a></li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Link to="/login" className={btnGhost}>Entrar</Link>
            <Link to="/register" className={btnSolid} style={{background:ACCENT_HEX,boxShadow:`0 0 28px rgba(${ACCENT},0.35)`}}>Começar</Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 min-h-svh flex flex-col justify-end px-4 lg:px-6 pb-16">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="landing-fade-1 flex items-center gap-3" style={{color:`rgba(${ACCENT},0.65)`,fontSize:"0.6rem",letterSpacing:"0.2em",textTransform:"uppercase"}}>
            <div style={{width:20,height:1,background:`rgba(${ACCENT},0.5)`}}/>Inteligência guiada pelas estrelas
          </div>
          <h1 className="landing-fade-1 font-semibold leading-none violet-glow" style={{fontSize:"clamp(4.5rem,16vw,13rem)",letterSpacing:"-0.04em"}}>
            Synast<span style={{color:ACCENT_LT}}>rIA</span>
          </h1>
          <div className="landing-fade-2 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 flex-wrap">
            <p className="text-[0.82rem] leading-relaxed max-w-[28ch]" style={{color:"rgba(255,255,255,0.35)"}}>Inteligência artificial que responde,<br/>raciocina e cria — para você.</p>
            <div className="landing-fade-3 flex gap-3 items-center flex-wrap">
              <Link to="/register" className={btnSolid} style={{background:ACCENT_HEX,boxShadow:`0 0 28px rgba(${ACCENT},0.35)`}}>Começar grátis</Link>
              <a href="#recursos" className={btnGhost}>Ver recursos</a>
            </div>
          </div>
        </div>
        <div className="landing-scroll-hint absolute bottom-8 left-1/2 flex flex-col items-center gap-2" style={{transform:"translateX(-50%)",color:"rgba(255,255,255,0.15)",fontSize:"0.55rem",letterSpacing:"0.14em",textTransform:"uppercase"}}>
          <ArrowDown className="w-3.5 h-3.5"/>scroll
        </div>
      </section>

      <div className="relative z-10 mx-4 lg:mx-6" style={{height:1,background:`linear-gradient(to right, transparent, rgba(${ACCENT},0.2), transparent)`}}/>

      <section id="recursos" className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28">
        <p className={`landing-reveal ${sectionLabel}`} style={{color:"rgba(255,255,255,0.28)"}}>
          <span style={{display:"inline-block",width:16,height:1,background:`rgba(${ACCENT},0.55)`}}/>Recursos
        </p>
        <div className="grid" style={{gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))",gap:1,background:`rgba(${ACCENT},0.1)`,border:`1px solid rgba(${ACCENT},0.12)`}}>
          {features.map(f=>(
            <div key={f.title} className="landing-reveal feature-card p-8 flex flex-col gap-5 cursor-default transition-all duration-200" style={{background:"rgba(4,3,10,0.96)"}} onMouseEnter={e=>(e.currentTarget.style.background=`rgba(${ACCENT},0.07)`)} onMouseLeave={e=>(e.currentTarget.style.background="rgba(4,3,10,0.96)")}>
              <div className="feature-icon transition-colors duration-200" style={{color:"rgba(255,255,255,0.28)"}}>{f.icon}</div>
              <div>
                <p className="feature-title text-[0.72rem] font-semibold uppercase tracking-[0.08em] mb-2.5 transition-colors duration-200" style={{color:"rgba(255,255,255,0.75)"}}>{f.title}</p>
                <p className="text-[0.68rem]" style={{color:"rgba(255,255,255,0.32)",lineHeight:1.85}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28" style={{borderTop:`1px solid rgba(${ACCENT},0.1)`}}>
        <p className={`landing-reveal ${sectionLabel}`} style={{color:"rgba(255,255,255,0.28)"}}>
          <span style={{display:"inline-block",width:16,height:1,background:`rgba(${ACCENT},0.55)`}}/>Planos
        </p>
        <h2 className="landing-reveal font-semibold leading-tight mb-16" style={{fontSize:"clamp(1.8rem,4vw,3rem)",letterSpacing:"-0.035em"}}>Simples.<br/><span style={{color:"rgba(255,255,255,0.3)"}}>Sem surpresas.</span></h2>
        <div className="grid" style={{gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:1,background:`rgba(${ACCENT},0.1)`,border:`1px solid rgba(${ACCENT},0.12)`}}>
          <div className="landing-reveal flex flex-col gap-7 p-10" style={{background:"rgba(4,3,10,0.96)"}}>
            <div><p className="text-[0.6rem] uppercase tracking-[0.16em] mb-4" style={{color:"rgba(255,255,255,0.28)"}}>Free</p>
              <p className="font-semibold leading-none" style={{fontSize:"clamp(2.5rem,5vw,3.5rem)",letterSpacing:"-0.04em"}}>R$&nbsp;0 <span className="text-[0.68rem] font-normal" style={{color:"rgba(255,255,255,0.28)"}}>/ mês</span></p>
            </div>
            <p className="text-[0.68rem]" style={{color:"rgba(255,255,255,0.32)"}}>Para experimentar. Sem cartão de crédito.</p>
            <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>
            <ul className="flex flex-col gap-3.5">
              {["Modelo syn-v1-free","Mensagens limitadas por dia","Histórico de conversas","Modo voz"].map(item=>(
                <li key={item} className="flex items-start gap-2.5 text-[0.68rem]" style={{color:"rgba(255,255,255,0.38)"}}>
                  <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{color:"rgba(255,255,255,0.45)"}}/>{item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnGhost} justify-center mt-auto`}>Começar grátis</Link>
          </div>
          <div className="landing-reveal flex flex-col gap-7 p-10 relative overflow-hidden" style={{background:`rgba(${ACCENT},0.08)`}}>
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none" style={{background:`radial-gradient(circle, rgba(${ACCENT},0.18) 0%, transparent 70%)`}}/>
            <div>
              <span className="inline-block text-[0.55rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border mb-4" style={{borderColor:`rgba(${ACCENT},0.4)`,color:ACCENT_LT}}>Recomendado</span>
              <p className="text-[0.6rem] uppercase tracking-[0.16em] mb-3" style={{color:`rgba(${ACCENT},0.7)`}}>Pro</p>
              <p className="font-semibold leading-none" style={{fontSize:"clamp(2.5rem,5vw,3.5rem)",letterSpacing:"-0.04em"}}>R$&nbsp;24,99 <span className="text-[0.68rem] font-normal" style={{color:"rgba(255,255,255,0.28)"}}>/ mês</span></p>
            </div>
            <p className="text-[0.68rem]" style={{color:"rgba(255,255,255,0.35)"}}>Para quem usa de verdade. Sem limites, sem filas.</p>
            <div style={{height:1,background:`rgba(${ACCENT},0.22)`}}/>
            <ul className="flex flex-col gap-3.5">
              {["Modelos syn-v1-free e syn-v1-pro","Mensagens ilimitadas","Geração de imagens com IA","Raciocínio avançado","Suporte prioritário"].map(item=>(
                <li key={item} className="flex items-start gap-2.5 text-[0.68rem]" style={{color:"rgba(255,255,255,0.5)"}}>
                  <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{color:ACCENT_LT}}/>{item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnSolid} justify-center mt-auto`} style={{background:ACCENT_HEX,boxShadow:`0 0 28px rgba(${ACCENT},0.35)`}}>Assinar Pro</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28" style={{borderTop:`1px solid rgba(${ACCENT},0.1)`}}>
        <p className={`landing-reveal ${sectionLabel}`} style={{color:"rgba(255,255,255,0.28)"}}>
          <span style={{display:"inline-block",width:16,height:1,background:`rgba(${ACCENT},0.55)`}}/>Perguntas frequentes
        </p>
        <h2 className="landing-reveal font-semibold leading-tight mb-14" style={{fontSize:"clamp(1.8rem,4vw,3rem)",letterSpacing:"-0.035em"}}>Tem dúvidas?</h2>
        <div className="landing-reveal" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          {faqs.map(f=><FaqItem key={f.q} q={f.q} a={f.a}/>)}
        </div>
      </section>

      <footer className="relative z-10 px-4 lg:px-6 py-8" style={{borderTop:`1px solid rgba(${ACCENT},0.1)`}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <StarIcon className="w-3 h-3" style={{color:`rgba(${ACCENT},0.55)`}}/>
            <span className="text-[0.62rem] uppercase tracking-[0.14em]" style={{color:"rgba(255,255,255,0.18)"}}>SynastrIA © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            {[{label:"Entrar",to:"/login"},{label:"Cadastrar",to:"/register"}].map(({label,to})=>(
              <Link key={label} to={to} className="text-[0.6rem] uppercase tracking-[0.1em] transition-colors duration-150" style={{color:"rgba(255,255,255,0.18)",textDecoration:"none"}} onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.18)")}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
