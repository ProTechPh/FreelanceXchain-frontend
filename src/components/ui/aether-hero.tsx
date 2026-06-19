'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

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
  overlayGradient = 'linear-gradient(180deg, #000000bb, #00000055 40%, transparent)',
  textColor = '#ffffff',

  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor = [0, 0, 0, 1],

  height = '100vh',
  className = '',
  ariaLabel = 'Aurora hero background',
}: AetherHeroProps) {
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

    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

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
  }, [fragmentSource, dprMax, clearColor]);

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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
      `}</style>

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
          background: overlayGradient,
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
          justifyContent: justify,
          padding: 'min(6vw, 64px)',
          color: textColor,
          fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth,
            marginInline: align === 'center' ? 'auto' : undefined,
            textAlign,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#c4b5fd',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Powered by Blockchain &amp; AI
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              fontWeight: 700,
              textShadow: '0 6px 36px rgba(0,0,0,0.45)',
            }}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              style={{
                marginTop: '1rem',
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                lineHeight: 1.6,
                opacity: 0.9,
                textShadow: '0 4px 24px rgba(0,0,0,0.35)',
                maxWidth: 700,
                marginInline: align === 'center' ? 'auto' : undefined,
              }}
            >
              {subtitle}
            </p>
          ) : null}

          <div
            style={{
              display: 'inline-flex',
              gap: '12px',
              marginTop: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {ctaLabel ? (
              <Link
                href={ctaHref}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {ctaLabel}
              </Link>
            ) : null}

            {secondaryCtaLabel ? (
              <Link
                href={secondaryCtaHref}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'transparent',
                  color: textColor,
                  opacity: 0.9,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
                  backdropFilter: 'blur(2px)',
                  transition: 'transform 0.2s, opacity 0.2s',
                }}
              >
                {secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export { AetherHero };
