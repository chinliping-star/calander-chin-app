export function AuthAnimatedBg() {
  return (
    <>
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33%       { transform: translateY(-40px) translateX(20px) rotate(120deg); }
          66%       { transform: translateY(20px) translateX(-30px) rotate(240deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50%       { transform: translateY(-60px) translateX(40px) scale(1.15); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          40%       { transform: translateY(50px) rotate(180deg) scale(0.85); }
          80%       { transform: translateY(-30px) rotate(320deg) scale(1.1); }
        }
        @keyframes blobMorph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%       { border-radius: 50% 60% 30% 60% / 30% 70% 60% 40%; }
          75%       { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes drift {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.6; }
          25%  { transform: translateY(-80px) translateX(30px) rotate(90deg); opacity: 1; }
          50%  { transform: translateY(-160px) translateX(-20px) rotate(180deg); opacity: 0.7; }
          75%  { transform: translateY(-240px) translateX(40px) rotate(270deg); opacity: 0.4; }
          100% { transform: translateY(-320px) translateX(0) rotate(360deg); opacity: 0; }
        }
        @keyframes rotateGem {
          0%   { transform: rotateY(0deg) rotateX(15deg); }
          100% { transform: rotateY(360deg) rotateX(15deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(255,127,177,0.3), 0 0 60px 10px rgba(255,127,177,0.1); }
          50%       { box-shadow: 0 0 40px 12px rgba(255,127,177,0.5), 0 0 100px 20px rgba(255,127,177,0.2); }
        }
        @keyframes orbitRing {
          from { transform: rotateZ(0deg) rotateX(70deg); }
          to   { transform: rotateZ(360deg) rotateX(70deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Full-screen bg container */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,127,177,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 90%, rgba(167,139,250,0.15) 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 60% 40%, rgba(255,182,213,0.10) 0%, transparent 50%),
              linear-gradient(160deg, #fff8fb 0%, #fdf4ff 40%, #f8f0ff 70%, #fff4fa 100%)
            `,
          }}
        />

        {/* Big morphing blob — top-left */}
        <div
          className="absolute"
          style={{
            width: 520, height: 520,
            top: '-120px', left: '-140px',
            background: 'radial-gradient(circle at 35% 40%, rgba(255,127,177,0.22) 0%, rgba(255,182,213,0.12) 50%, transparent 75%)',
            animation: 'blobMorph 12s ease-in-out infinite, floatB 18s ease-in-out infinite',
            filter: 'blur(2px)',
          }}
        />

        {/* Big morphing blob — bottom-right */}
        <div
          className="absolute"
          style={{
            width: 600, height: 600,
            bottom: '-180px', right: '-160px',
            background: 'radial-gradient(circle at 60% 55%, rgba(167,139,250,0.20) 0%, rgba(216,180,254,0.10) 50%, transparent 75%)',
            animation: 'blobMorph 15s ease-in-out infinite reverse, floatA 22s ease-in-out infinite',
            filter: 'blur(3px)',
          }}
        />

        {/* Mid blob — center-right */}
        <div
          className="absolute"
          style={{
            width: 300, height: 300,
            top: '30%', right: '8%',
            background: 'radial-gradient(circle at 40% 40%, rgba(255,200,220,0.25) 0%, rgba(255,127,177,0.08) 60%, transparent 80%)',
            animation: 'blobMorph 9s ease-in-out infinite, floatC 14s ease-in-out infinite',
            filter: 'blur(1px)',
          }}
        />

        {/* 3D Gem / Crystal — top right */}
        <div
          className="absolute"
          style={{ top: '8%', right: '12%', perspective: '600px' }}
        >
          <div
            style={{
              width: 60, height: 60,
              transformStyle: 'preserve-3d',
              animation: 'rotateGem 8s linear infinite, floatB 6s ease-in-out infinite',
            }}
          >
            {/* Gem faces using rotated divs */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 60, height: 60,
                  transformOrigin: '50% 50%',
                  transform: `rotateY(${deg}deg) translateZ(30px)`,
                  background: i % 2 === 0
                    ? 'rgba(255,127,177,0.35)'
                    : 'rgba(216,180,254,0.30)',
                  border: '1px solid rgba(255,127,177,0.4)',
                  backdropFilter: 'blur(4px)',
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* 3D Ring — bottom left */}
        <div
          className="absolute"
          style={{ bottom: '15%', left: '8%', perspective: '800px' }}
        >
          <div
            style={{
              width: 80, height: 80,
              transformStyle: 'preserve-3d',
              animation: 'orbitRing 6s linear infinite, floatA 10s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: '3px solid rgba(255,127,177,0.50)',
                boxShadow: '0 0 16px rgba(255,127,177,0.3), inset 0 0 16px rgba(255,127,177,0.1)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Small 3D cube — top left area */}
        <div
          className="absolute"
          style={{ top: '22%', left: '6%', perspective: '400px' }}
        >
          <div
            style={{
              width: 36, height: 36,
              transformStyle: 'preserve-3d',
              animation: 'rotateGem 5s linear infinite reverse, floatC 8s ease-in-out infinite',
            }}
          >
            {[
              { transform: 'rotateY(0deg) translateZ(18px)',   bg: 'rgba(255,127,177,0.40)' },
              { transform: 'rotateY(90deg) translateZ(18px)',  bg: 'rgba(167,139,250,0.35)' },
              { transform: 'rotateY(180deg) translateZ(18px)', bg: 'rgba(255,182,213,0.40)' },
              { transform: 'rotateY(270deg) translateZ(18px)', bg: 'rgba(216,180,254,0.35)' },
              { transform: 'rotateX(90deg) translateZ(18px)',  bg: 'rgba(255,127,177,0.30)' },
              { transform: 'rotateX(-90deg) translateZ(18px)', bg: 'rgba(167,139,250,0.30)' },
            ].map((face, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 36, height: 36,
                  transform: face.transform,
                  background: face.bg,
                  border: '1px solid rgba(255,127,177,0.35)',
                  backdropFilter: 'blur(2px)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating sparkle dots */}
        {[
          { top: '15%', left: '25%', delay: '0s',    dur: '3.2s', size: 6  },
          { top: '45%', left: '15%', delay: '0.8s',  dur: '2.8s', size: 4  },
          { top: '70%', left: '35%', delay: '1.6s',  dur: '3.5s', size: 8  },
          { top: '25%', right: '30%', delay: '0.4s', dur: '2.5s', size: 5  },
          { top: '60%', right: '20%', delay: '1.2s', dur: '3.8s', size: 6  },
          { top: '80%', right: '40%', delay: '2.0s', dur: '2.9s', size: 4  },
          { top: '10%', left: '55%', delay: '1.0s',  dur: '3.1s', size: 7  },
          { top: '88%', left: '60%', delay: '0.6s',  dur: '2.6s', size: 5  },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              ...{ top: s.top, left: (s as { left?: string }).left, right: (s as { right?: string }).right },
              width: s.size, height: s.size,
              borderRadius: '50%',
              background: i % 3 === 0
                ? 'rgba(255,127,177,0.8)'
                : i % 3 === 1
                ? 'rgba(167,139,250,0.7)'
                : 'rgba(255,200,220,0.9)',
              animation: `sparkle ${s.dur} ease-in-out infinite`,
              animationDelay: s.delay,
              boxShadow: `0 0 ${s.size * 2}px rgba(255,127,177,0.6)`,
            }}
          />
        ))}

        {/* Floating emoji icons */}
        {[
          { emoji: '🌸', top: '12%', left: '18%',  delay: '0s',   dur: '7s',  size: 22 },
          { emoji: '✨', top: '55%', left: '5%',   delay: '1.5s', dur: '9s',  size: 18 },
          { emoji: '💗', top: '78%', left: '22%',  delay: '3s',   dur: '8s',  size: 16 },
          { emoji: '🌙', top: '18%', right: '22%', delay: '0.7s', dur: '10s', size: 20 },
          { emoji: '⭐', top: '65%', right: '10%', delay: '2s',   dur: '7s',  size: 16 },
          { emoji: '🎀', top: '40%', right: '4%',  delay: '1s',   dur: '11s', size: 18 },
        ].map((e, i) => (
          <div
            key={i}
            className="absolute select-none"
            style={{
              ...{ top: e.top, left: (e as { left?: string }).left, right: (e as { right?: string }).right },
              fontSize: e.size,
              opacity: 0.55,
              animation: `floatA ${e.dur} ease-in-out infinite`,
              animationDelay: e.delay,
              filter: 'drop-shadow(0 2px 8px rgba(255,127,177,0.3))',
            }}
          >
            {e.emoji}
          </div>
        ))}

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,127,177,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,127,177,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Noise texture overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />
      </div>
    </>
  );
}
