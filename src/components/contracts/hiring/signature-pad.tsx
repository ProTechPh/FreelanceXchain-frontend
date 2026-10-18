'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Point = { x: number; y: number };

/**
 * Canvas signature pad (pointer events: mouse, pen and touch). Emits a PNG data
 * URL, or null when cleared. The typed-name tab in SignContractDialog is the
 * keyboard / screen-reader alternative.
 */
export function SignaturePad({ onChange, label = 'Draw your signature' }: { onChange: (dataUrl: string | null) => void; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // The exported PNG must read on white paper in both themes.
    ctx.strokeStyle = '#111827';
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0]!.x, stroke[0]!.y);
      if (stroke.length === 1) ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y + 0.1);
      for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, []);

  const emit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) {
      onChange(null);
      return;
    }
    // Export with a white background so the signature stays visible in any viewer.
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext('2d');
    if (!octx) return onChange(null);
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);
    onChange(out.toDataURL('image/png'));
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border border-input bg-white">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={strokeCount > 0 ? `${label}: signature drawn` : `${label}: empty`}
          className="block h-40 w-full cursor-crosshair touch-none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            strokesRef.current.push([pointFrom(event)]);
            redraw();
          }}
          onPointerMove={(event) => {
            if (!drawingRef.current) return;
            strokesRef.current[strokesRef.current.length - 1]?.push(pointFrom(event));
            redraw();
          }}
          onPointerUp={() => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            setStrokeCount(strokesRef.current.length);
            emit();
          }}
          onPointerCancel={() => { drawingRef.current = false; }}
        />
        {strokeCount === 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-neutral-500" aria-hidden="true">
            Sign here with your mouse, pen or finger
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={strokeCount === 0}
          onClick={() => {
            strokesRef.current.pop();
            setStrokeCount(strokesRef.current.length);
            redraw();
            emit();
          }}
        >
          <Undo2 aria-hidden="true" /> Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={strokeCount === 0}
          onClick={() => {
            strokesRef.current = [];
            setStrokeCount(0);
            redraw();
            emit();
          }}
        >
          <Eraser aria-hidden="true" /> Clear
        </Button>
      </div>
    </div>
  );
}
