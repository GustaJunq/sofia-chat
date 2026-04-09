import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  const cubeRef = useRef<HTMLVideoElement>(null);
  const iconRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    [cubeRef, iconRef].forEach((ref) => {
      if (ref.current) ref.current.play().catch(() => {});
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=soria@400,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ln-root {
          background: #000;
          color: #fff;
          min-height: 100vh;
          font-family: 'Soria', Georgia, serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }

        .ln-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 24px 0;
          width: 100%;
          max-width: 540px;
          text-align: center;
        }

        .ln-wordmark {
          font-family: 'Soria', Georgia, serif;
          font-size: clamp(2.6rem, 9vw, 3.6rem);
          font-weight: 400;
          letter-spacing: -0.01em;
          color: #fff;
          line-height: 1;
          margin-bottom: 32px;
        }

        .ln-cube-wrap {
          width: clamp(160px, 42vw, 220px);
          aspect-ratio: 1;
          margin-bottom: 28px;
        }

        .ln-cube-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ln-subtitle {
          font-family: 'Soria', Georgia, serif;
          font-size: clamp(0.95rem, 3.2vw, 1.12rem);
          font-weight: 400;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
          max-width: 300px;
          margin-bottom: 36px;
          letter-spacing: 0.01em;
        }

        .ln-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 36px;
          background: #fff;
          color: #000;
          font-family: 'Soria', Georgia, serif;
          font-size: 0.88rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 100px;
          transition: opacity 0.2s ease;
          margin-bottom: 80px;
        }

        .ln-cta:hover { opacity: 0.82; }

        .ln-align {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 24px;
          width: 100%;
          max-width: 540px;
          text-align: center;
        }

        .ln-icon-wrap {
          width: clamp(80px, 22vw, 110px);
          aspect-ratio: 1;
          border-radius: 26px;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 0 40px 6px rgba(0, 255, 100, 0.12);
        }

        .ln-icon-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ln-heading {
          font-family: 'Soria', Georgia, serif;
          font-size: clamp(3.2rem, 12vw, 5.2rem);
          font-weight: 400;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: #fff;
          margin-bottom: 24px;
        }

        .ln-desc {
          font-family: 'Soria', Georgia, serif;
          font-size: clamp(0.88rem, 2.9vw, 1.02rem);
          font-weight: 400;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          max-width: 280px;
          margin-bottom: 72px;
          letter-spacing: 0.01em;
        }

        .ln-trynow-wrap {
          width: 100%;
          max-width: 540px;
          padding: 0 24px 100px;
          text-align: center;
        }

        .ln-trynow {
          font-family: 'Soria', Georgia, serif;
          font-size: clamp(4.8rem, 18vw, 8rem);
          font-weight: 400;
          line-height: 0.92;
          letter-spacing: -0.03em;
          color: #fff;
          text-decoration: none;
          display: inline-block;
          transition: opacity 0.2s ease;
        }

        .ln-trynow:hover { opacity: 0.7; }

        .ln-footer {
          width: 100%;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ln-footer-copy {
          font-family: 'Soria', Georgia, serif;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.18);
        }

        .ln-footer-links { display: flex; gap: 24px; }

        .ln-footer-link {
          font-family: 'Soria', Georgia, serif;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.18);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .ln-footer-link:hover { color: rgba(255,255,255,0.5); }

        /* Desktop Adaptations */
        @media (min-width: 1024px) {
          .ln-hero {
            max-width: 1200px;
            padding: 100px 40px 0;
            flex-direction: row;
            justify-content: center;
            text-align: left;
            gap: 80px;
          }

          .ln-hero-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .ln-wordmark {
            font-size: 5rem;
            margin-bottom: 24px;
          }

          .ln-cube-wrap {
            width: 400px;
            margin-bottom: 0;
            order: 2;
          }

          .ln-subtitle {
            font-size: 1.5rem;
            max-width: 450px;
            margin-bottom: 48px;
          }

          .ln-align {
            max-width: 1200px;
            flex-direction: row-reverse;
            justify-content: center;
            text-align: left;
            gap: 100px;
            padding: 120px 40px;
          }

          .ln-align-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .ln-icon-wrap {
            width: 280px;
            margin-bottom: 0;
          }

          .ln-heading {
            font-size: 6rem;
          }

          .ln-desc {
            font-size: 1.2rem;
            max-width: 450px;
          }

          .ln-trynow-wrap {
            max-width: 1200px;
            padding-bottom: 160px;
          }

          .ln-trynow {
            font-size: 12rem;
          }
        }

        @keyframes ln-fade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ln-wordmark  { animation: ln-fade 0.7s ease both; }
        .ln-cube-wrap { animation: ln-fade 0.7s 0.1s ease both; }
        .ln-subtitle  { animation: ln-fade 0.7s 0.2s ease both; }
        .ln-cta       { animation: ln-fade 0.7s 0.3s ease both; }
        .ln-icon-wrap { animation: ln-fade 0.7s 0.35s ease both; }
        .ln-heading   { animation: ln-fade 0.7s 0.45s ease both; }
        .ln-desc      { animation: ln-fade 0.7s 0.55s ease both; }
        .ln-trynow    { animation: ln-fade 0.7s 0.65s ease both; }
      `}</style>

      <div className="ln-root">
        <div className="ln-hero">
          <div className="ln-cube-wrap">
            <video ref={cubeRef} src="/cube.mp4" autoPlay loop muted playsInline />
          </div>

          <div className="ln-hero-content">
            <h1 className="ln-wordmark">Synastria</h1>
            <p className="ln-subtitle">
              A constellation of AI agents<br />inside a single chatbot.
            </p>
            <Link to="/register" className="ln-cta">Get started</Link>
          </div>
        </div>

        <div className="ln-align">
          <div className="ln-icon-wrap">
            <video ref={iconRef} src="/icon.mp4" autoPlay loop muted playsInline />
          </div>

          <div className="ln-align-content">
            <h2 className="ln-heading">Where AI<br />systems align</h2>
            <p className="ln-desc">
              Create specialized AI agents, connect them into
              a unified system, and run everything through a single
              intelligent chatbot.
            </p>
          </div>
        </div>

        <div className="ln-trynow-wrap">
          <Link to="/register" className="ln-trynow">Try now.</Link>
        </div>

        <footer className="ln-footer">
          <span className="ln-footer-copy">SynastrIA © {new Date().getFullYear()}</span>
          <div className="ln-footer-links">
            <Link to="/login" className="ln-footer-link">Entrar</Link>
            <Link to="/register" className="ln-footer-link">Cadastrar</Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
