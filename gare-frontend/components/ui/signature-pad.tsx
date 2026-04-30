"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSign?: (signed: boolean) => void;
  className?: string;
}

export function SignaturePadComponent({ onSign, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.strokeStyle = "#1F2937";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    
    setCtx(context);
    
    // Remplir le canvas avec un fond blanc/transparent
    context.fillStyle = "#F9FAFB";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x: Math.max(0, Math.min(x, canvas.width)), y: Math.max(0, Math.min(y, canvas.height)) };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    setHasSignature(true);
    onSign?.(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.beginPath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#F9FAFB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSign?.(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Signature électronique
        </label>
        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full h-36 bg-gray-50 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <button
            onClick={clearSignature}
            className="absolute top-2 right-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 bg-white rounded-md shadow-sm transition z-10"
          >
            Effacer
          </button>
          <div className="absolute bottom-3 left-4 right-4 border-b border-dashed border-gray-300 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span className="text-orange-500">✍️</span> Signez dans le cadre ci-dessus
        </p>
        {hasSignature && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            ✅ Signature enregistrée
          </p>
        )}
      </div>
    </div>
  );
}