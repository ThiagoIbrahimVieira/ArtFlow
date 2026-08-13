import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ColorPickerProps {
  color: string; // HEX
  onChange: (hex: string) => void;
}

// Color conversion helpers
function hexToHsb(hex: string): { h: number; s: number; b: number } {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const bVal = parseInt(clean.substring(4, 6), 16) / 255 || 0;

  const max = Math.max(r, g, bVal);
  const min = Math.min(r, g, bVal);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - bVal) / delta) % 6;
    else if (max === g) h = (bVal - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const b = Math.round(max * 100);

  return { h, s, b };
}

function hsbToHex(h: number, s: number, b: number): string {
  s /= 100;
  b /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  const r = Math.round(255 * f(5)).toString(16).padStart(2, '0');
  const g = Math.round(255 * f(3)).toString(16).padStart(2, '0');
  const blue = Math.round(255 * f(1)).toString(16).padStart(2, '0');
  return `#${r}${g}${blue}`.toUpperCase();
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hsb, setHsb] = useState<{ h: number; s: number; b: number }>(() => hexToHsb(color || '#D9B98D'));
  const [hexInput, setHexInput] = useState(color?.toUpperCase() || '#D9B98D');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const satAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingSat = useRef(false);

  useEffect(() => {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      setHexInput(color.toUpperCase());
      setHsb(hexToHsb(color));
    }
  }, [color]);

  const updateColorFromHsb = useCallback(
    (newHsb: { h: number; s: number; b: number }) => {
      setHsb(newHsb);
      const newHex = hsbToHex(newHsb.h, newHsb.s, newHsb.b);
      setHexInput(newHex);
      onChange(newHex);
    },
    [onChange]
  );

  const handleSatAreaMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!satAreaRef.current) return;
      const rect = satAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const s = Math.round((x / rect.width) * 100);
      const b = Math.round((1 - y / rect.height) * 100);

      updateColorFromHsb({ ...hsb, s, b });
    },
    [hsb, updateColorFromHsb]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingSat.current = true;
    handleSatAreaMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSat.current) {
        handleSatAreaMove(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      isDraggingSat.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSatAreaMove]);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSatAreaMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHsb(hexToHsb(val));
      onChange(val);
    }
  };

  const pureHueHex = hsbToHex(hsb.h, 100, 100);
  const currentHex = hsbToHex(hsb.h, hsb.s, hsb.b);

  return (
    <div className="w-full bg-[#191715] p-3 rounded-2xl border border-[#3A332C] space-y-3 select-none text-left">
      {/* 2D Saturation & Brightness Box */}
      <div
        ref={satAreaRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        style={{
          backgroundColor: pureHueHex,
          backgroundImage: `
            linear-to-right, #FFFFFF, transparent),
            linear-to-top, #000000, transparent)
          `,
        }}
        className="relative w-full h-32 rounded-xl cursor-crosshair overflow-hidden shadow-inner border border-white/10"
      >
        {/* Saturation gradient layer */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #FFFFFF 0%, transparent 100%)',
          }}
        />
        {/* Brightness gradient layer */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, #000000 0%, transparent 100%)',
          }}
        />

        {/* Picker Pin */}
        <div
          style={{
            left: `${hsb.s}%`,
            top: `${100 - hsb.b}%`,
            backgroundColor: currentHex,
          }}
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md pointer-events-none"
        />
      </div>

      {/* Hue Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-sans text-[#A99D8E]">
          <span>Hue (Matiz)</span>
          <span>{hsb.h}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={hsb.h}
          onChange={(e) => updateColorFromHsb({ ...hsb, h: parseInt(e.target.value, 10) || 0 })}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)',
          }}
        />
      </div>

      {/* Brightness / Value Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-sans text-[#A99D8E]">
          <span>Brightness (Brilho)</span>
          <span>{hsb.b}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={hsb.b}
          onChange={(e) => updateColorFromHsb({ ...hsb, b: parseInt(e.target.value, 10) || 0 })}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #000000 0%, ${hsbToHex(hsb.h, hsb.s, 100)} 100%)`,
          }}
        />
      </div>

      {/* Swatch & Value Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-[#3A332C]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
            style={{ backgroundColor: currentHex }}
          />
          <span className="font-mono text-xs text-[#F1E2CB] font-medium">{currentHex}</span>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] font-sans text-[#D9B98D] hover:text-[#E8DAC7] underline"
        >
          {showAdvanced ? 'Ocultar HEX' : 'HEX Avançado'}
        </button>
      </div>

      {showAdvanced && (
        <div className="pt-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            placeholder="#HEX"
            maxLength={7}
            className="w-full px-3 py-1.5 text-xs bg-[#272320] border border-[#433D37] rounded-xl text-[#F1E2CB] font-mono focus:outline-none focus:border-[#D9B98D]"
          />
        </div>
      )}
    </div>
  );
};
