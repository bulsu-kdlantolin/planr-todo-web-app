/**
 * Utility to render high-resolution 1200x630 intention quote cards on an off-screen HTML5 Canvas.
 */
export function generateIntentionCardImage(
  intention: string,
  authorName: string,
  formattedDate: string,
  todayStr: string
): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

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

  // Inner Accent
  ctx.strokeStyle = '#65a30d';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 1110, 540);

  // Header Branding
  ctx.fillStyle = '#65a30d';
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillText('PLANR • DAILY FOCUS GOAL', 90, 120);

  ctx.fillStyle = '#57514d';
  ctx.font = '20px -apple-system, sans-serif';
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
  ctx.font = '22px -apple-system, sans-serif';
  ctx.fillText(`— ${authorName || 'Alex Morgan'}`, 90, y + 70);

  // Footer
  ctx.fillStyle = '#a8a29e';
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillText('Crafted with Planr • Private, Local Productivity', 90, 540);

  // Export image download
  const link = document.createElement('a');
  link.download = `planr-focus-goal-${todayStr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  return true;
}
