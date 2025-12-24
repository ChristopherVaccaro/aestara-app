type StyleThumbVariant = 'combined' | 'before' | 'after';

export interface StyleExampleThumbSources {
  primary: string;
  fallback: string;
}

function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getRealAssetPath(filterId: string, variant: StyleThumbVariant): string {
  if (variant === 'before') {
    return '/style-examples/base.png';
  }

  if (variant === 'after' || variant === 'combined') {
    return `/style-examples/${filterId}-after.png`;
  }

  return `/style-examples/${filterId}-after.png`;
}

function buildThumbSvg(filterId: string, filterName: string, variant: StyleThumbVariant): string {
  const hue = hashStringToHue(filterId);
  const accent1 = `hsl(${hue} 90% 60%)`;
  const accent2 = `hsl(${(hue + 40) % 360} 90% 60%)`;
  const label = filterName.length > 16 ? `${filterName.slice(0, 16)}…` : filterName;

  if (variant === 'before') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f2937"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="160" height="80" rx="14" fill="url(#bg)"/>
  <rect x="10" y="10" width="140" height="60" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
  <text x="80" y="45" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="12" fill="rgba(255,255,255,0.85)">Before</text>
</svg>`;
  }

  if (variant === 'after') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent1}"/>
      <stop offset="1" stop-color="${accent2}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="160" height="80" rx="14" fill="url(#bg)"/>
  <rect x="10" y="10" width="140" height="60" rx="12" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.25)"/>
  <text x="80" y="40" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="12" fill="rgba(255,255,255,0.95)">After</text>
  <text x="80" y="56" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="10" fill="rgba(255,255,255,0.85)">${label}</text>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <defs>
    <linearGradient id="before" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f2937"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="after" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent1}"/>
      <stop offset="1" stop-color="${accent2}"/>
    </linearGradient>
    <clipPath id="clip">
      <rect x="0" y="0" width="160" height="80" rx="14"/>
    </clipPath>
  </defs>

  <g clip-path="url(#clip)">
    <rect x="0" y="0" width="80" height="80" fill="url(#before)"/>
    <rect x="80" y="0" width="80" height="80" fill="url(#after)"/>
    <rect x="0" y="0" width="160" height="80" fill="rgba(0,0,0,0.10)"/>

    <line x1="80" y1="10" x2="80" y2="70" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>

    <text x="40" y="18" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="10" fill="rgba(255,255,255,0.85)">Before</text>
    <text x="120" y="18" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="10" fill="rgba(255,255,255,0.92)">After</text>

    <rect x="10" y="46" width="140" height="22" rx="11" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.18)"/>
    <text x="80" y="61" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="10" fill="rgba(255,255,255,0.92)">${label}</text>
  </g>
</svg>`;
}

export function getStyleExampleThumb(filterId: string, filterName: string, variant: StyleThumbVariant = 'combined'): string {
  return svgToDataUrl(buildThumbSvg(filterId, filterName, variant));
}

export function getStyleExampleThumbSources(
  filterId: string,
  filterName: string,
  variant: StyleThumbVariant = 'combined'
): StyleExampleThumbSources {
  return {
    primary: getRealAssetPath(filterId, variant),
    fallback: getStyleExampleThumb(filterId, filterName, variant),
  };
}
