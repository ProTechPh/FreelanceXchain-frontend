'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export type AetherHeroProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;

  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  overlayGradient?: string;
  textColor?: string;

  fragmentSource?: string;
  dprMax?: number;
  clearColor?: [number, number, number, number];

  height?: string | number;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;	
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

export default function AetherHero({
  title = 'Decentralize Your Freelance Career',
  subtitle = 'The future of work is here. Get matched with projects using AI, secure payments with smart contracts, and build an immutable reputation on-chain.',
  ctaLabel = 'Find Work',
  ctaHref = '/register',
  secondaryCtaLabel = 'Hire Talent',
  secondaryCtaHref = '/register',

  align = 'center',
  maxWidth = 960,
  overlayGradient,
  textColor,

  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor,

  height = '100dvh',
  className = '',
  ariaLabel = 'Aurora hero background',
}: AetherHeroProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  // Default to dark until mounted (matches the app's default theme, avoids a flash)
  const isDark = !mounted || resolvedTheme !== 'light';

  const resolvedOverlayGradient = overlayGradient ?? (isDark
    ? 'linear-gradient(180deg, #000000bb, #00000055 40%, transparent)'
    : 'linear-gradient(180deg, #ffffffcc, #ffffff66 40%, transparent)');
  const resolvedTextColor = textColor ?? (isDark ? '#ffffff' : '#0a0a0a');
  const resolvedClearColor = useMemo<[number, number, number, number]>(
    () => clearColor ?? (isDark ? [0, 0, 0, 1] : [0.98, 0.98, 0.98, 1]),
    [clearColor, isDark]
  );

  const badgeClass = isDark
    ? 'bg-white/[0.08] border-white/15 text-white/80'
    : 'bg-black/[0.05] border-black/10 text-black/70';
  const secondaryBtnClass = isDark
    ? 'glass border-white/20 text-white hover:bg-white/10 hover:border-white/30'
    : 'glass border-black/10 text-black hover:bg-black/5 hover:border-black/20';
  const dividerBorderClass = isDark ? 'border-white/10' : 'border-black/10';
  const statLabelClass = isDark ? 'text-white/50' : 'text-black/50';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufRef = useRef<WebGLBuffer | null>(null);
  const uniTimeRef = useRef<WebGLUniformLocation | null>(null);
  const uniResRef = useRef<WebGLUniformLocation | null>(null);
  const rafRef = useRef<number | null>(null);

  const compileShader = (gl: WebGL2RenderingContext, src: string, type: number) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) || 'Unknown shader error';
      gl.deleteShader(sh);
      throw new Error(info);
    }
    return sh;
  };
  const createProgram = (gl: WebGL2RenderingContext, vs: string, fs: string) => {
    const v = compileShader(gl, vs, gl.VERTEX_SHADER);
    const f = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog) || 'Program link error';
      gl.deleteProgram(prog);
      throw new Error(info);
    }
    return prog;
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;
    glRef.current = gl;

    let prog: WebGLProgram;
    try {
      prog = createProgram(gl, VERT_SRC, fragmentSource);
    } catch (e) {
      console.error(e);
      return;
    }
    programRef.current = prog;

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    const buf = gl.createBuffer()!;
    bufRef.current = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    uniTimeRef.current = gl.getUniformLocation(prog, 'time');
    uniResRef.current = gl.getUniformLocation(prog, 'resolution');

    gl.clearColor(resolvedClearColor[0], resolvedClearColor[1], resolvedClearColor[2], resolvedClearColor[3]);

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax));
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const W = Math.floor(cssW * dpr);
      const H = Math.floor(cssH * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const onResize = () => fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    window.addEventListener('resize', onResize);

    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (uniResRef.current) gl.uniform2f(uniResRef.current, canvas.width, canvas.height);
      if (uniTimeRef.current) gl.uniform1f(uniTimeRef.current, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (bufRef.current) gl.deleteBuffer(bufRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
  }, [fragmentSource, dprMax, resolvedClearColor]);

  const justify =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign =
    align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

  return (
    <section
      className={['aurora-hero', className].join(' ')}
      style={{ height, position: 'relative', overflow: 'hidden' }}
      aria-label="Hero"
    >

      <canvas
        ref={canvasRef}
        className="aurora-canvas"
        role="img"
        aria-label={ariaLabel}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          userSelect: 'none',
          touchAction: 'none',
        }}
      />

      <div
        className="aurora-overlay"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: resolvedOverlayGradient,
          pointerEvents: 'none',
        }}
      />

      <div
        className="aurora-content"
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          color: resolvedTextColor,
        }}
      >
        <div
          className="w-full px-6 sm:px-10 md:px-16 py-24"
          style={{
            maxWidth,
            marginInline: align === 'center' ? 'auto' : undefined,
          }}
        >
          <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-medium', badgeClass)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Powered by Blockchain &amp; AI
          </div>

          <h1
            className={cn(
              'mt-0 text-[clamp(2.4rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.03em] font-extrabold drop-shadow-2xl',
              'text-center md:text-left'
            )}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className={cn(
                'mt-4 text-[clamp(0.95rem,2vw,1.2rem)] leading-relaxed opacity-90 drop-shadow-lg max-w-[600px]',
                'text-center md:text-left mx-auto md:mx-0'
              )}
            >
              {subtitle}
            </p>
          ) : null}

          <div className={cn('flex flex-wrap gap-3 mt-8', 'justify-center md:justify-start')}>
            {ctaLabel ? (
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl gradient-primary text-white font-semibold text-base transition-all duration-200 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]"
              >
                {ctaLabel}
              </Link>
            ) : null}

            {secondaryCtaLabel ? (
              <Link
                href={secondaryCtaHref}
                className={cn('inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200', secondaryBtnClass)}
              >
                {secondaryCtaLabel}
              </Link>
            ) : null}
          </div>

          <div className={cn('flex flex-wrap gap-8 mt-10 pt-8 border-t', dividerBorderClass, 'justify-center md:justify-start')}>
            {[
              { value: '2,400+', label: 'Freelancers' },
              { value: '$1.2M+', label: 'Secured in Escrow' },
              { value: '180+', label: 'Countries' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className={cn('text-xs uppercase tracking-widest', statLabelClass)}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

export { AetherHero };
