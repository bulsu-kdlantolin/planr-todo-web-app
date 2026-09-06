/**
 * Utility to render high-resolution 1200x630 intention quote cards on an off-screen HTML5 Canvas.
 * Supports native Web Share API (mobile & supported desktop) with automatic download fallback.
 */

export function renderIntentionCanvas(
  intention: string,
  authorName: string,
  formattedDate: string
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background Gradient (Bone white to warm linen)
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, '#faf9f6');
  grad.addColorStop(1, '#f0ede8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Outer Border
  ctx.strokeStyle = '#d6cdc7';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, 1140, 570);

  // Inner Accent (Sage green)
  ctx.strokeStyle = '#65a30d';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 1110, 540);

  // Header Branding
  ctx.fillStyle = '#65a30d';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('PLANR • DAILY FOCUS GOAL', 90, 120);

  ctx.fillStyle = '#57514d';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(formattedDate.toUpperCase(), 90, 155);

  // Intention Quote
  ctx.fillStyle = '#1a1c1a';
  ctx.font = 'italic 44px Georgia, serif';
  const quote = `"${intention}"`;

  // Word wrap rendering
  const words = quote.split(' ');
  let line = '';
  let y = 270;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 980 && n > 0) {
      ctx.fillText(line, 90, y);
      line = words[n] + ' ';
      y += 60;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 90, y);

  // Author
  ctx.fillStyle = '#857c74';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`— ${authorName || 'Friend'}`, 90, y + 70);

  // Footer & Viral Backlink
  ctx.fillStyle = '#a8a29e';
  ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Crafted with Planr • Intentional Focus & Clarity • planr.lifestyle', 90, 540);

  return canvas;
}

export function downloadIntentionCardImage(
  canvas: HTMLCanvasElement,
  todayStr: string
): boolean {
  try {
    const link = document.createElement('a');
    link.download = `planr-focus-goal-${todayStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to download intention card image:', err);
    return false;
  }
}

/**
 * Backwards-compatible synchronous download generator
 */
export function generateIntentionCardImage(
  intention: string,
  authorName: string,
  formattedDate: string,
  todayStr: string
): boolean {
  const canvas = renderIntentionCanvas(intention, authorName, formattedDate);
  if (!canvas) return false;
  return downloadIntentionCardImage(canvas, todayStr);
}

/**
 * Share via native Web Share API if supported, falling back to direct PNG download.
 */
export async function shareOrDownloadIntentionCard(
  intention: string,
  authorName: string,
  formattedDate: string,
  todayStr: string
): Promise<'shared' | 'downloaded' | 'failed'> {
  const canvas = renderIntentionCanvas(intention, authorName, formattedDate);
  if (!canvas) return 'failed';

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob) {
        const file = new File([blob], `planr-focus-goal-${todayStr}.png`, {
          type: 'image/png'
        });

        if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Daily Focus Goal on Planr',
            text: `"${intention}" — Focused with Planr (planr.lifestyle)`,
            files: [file]
          });
          return 'shared';
        }

        // Try text share if files aren't supported
        await navigator.share({
          title: 'My Daily Focus Goal on Planr',
          text: `"${intention}" — Focused with Planr (planr.lifestyle)`,
          url: 'https://planr.lifestyle'
        });
        return 'shared';
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'shared'; // User simply dismissed share sheet
      }
      console.warn('Web Share failed or cancelled, falling back to download:', err);
    }
  }

  // Fallback to direct file download
  const downloaded = downloadIntentionCardImage(canvas, todayStr);
  return downloaded ? 'downloaded' : 'failed';
}
