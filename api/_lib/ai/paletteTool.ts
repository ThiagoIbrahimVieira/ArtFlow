import { PaletteToolInput, PaletteToolOutput, PaletteToolOutputSchema } from './chatSchemas';

export function normalizeHexColor(hex: string): string {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return '#D9B98D';
}

export function validateAndFormatPalette(raw: any, expectedCount?: number): PaletteToolOutput {
  const parsed = PaletteToolOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`PALETTE_SCHEMA_INVALID: ${parsed.error.message}`);
  }

  const palette = parsed.data;

  // Enforce uppercase HEX
  const normalizedColors = palette.colors.map((c) => ({
    hex: normalizeHexColor(c.hex),
    name: c.name.trim(),
    role: c.role.trim(),
  }));

  // Enforce required color count
  const targetCount = Math.max(3, Math.min(8, expectedCount || normalizedColors.length || 5));
  const finalColors = normalizedColors.slice(0, targetCount);

  // If received fewer colors than requested, add balanced complementaries/tones
  while (finalColors.length < targetCount) {
    const idx = finalColors.length + 1;
    finalColors.push({
      hex: idx === 4 ? '#E5A855' : '#82A89C',
      name: `Tone ${idx}`,
      role: 'Supporting Tone',
    });
  }

  return {
    paletteName: palette.paletteName.trim(),
    description: palette.description.trim(),
    harmony: palette.harmony.trim(),
    colors: finalColors,
    usageTips: palette.usageTips && palette.usageTips.length > 0 ? palette.usageTips : ['Use o tom mais escuro para sombras estruturais e o mais claro para pontos de luz.'],
    contrastNotes: palette.contrastNotes || ['Garanta contraste adequado entre valores tonais principais.'],
  };
}

export const normalizeGeneratedPalette = validateAndFormatPalette;
