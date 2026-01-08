# Static Assets Directory

This folder contains all static files that are served directly by Next.js.

## Folder Structure

```
public/
├── images/          # Images and graphics
│   ├── logos/       # Logo files
│   ├── backgrounds/ # Background images
│   └── icons/       # Icon images
├── fonts/           # Custom font files (if needed)
├── assets/          # Other static files (PDFs, etc.)
└── favicon.ico      # Site favicon
```

## How to Use

### Images
Files in `public/images/` are accessible at `/images/filename.png`

```tsx
// Regular img tag
<img src="/images/logo.png" alt="Logo" />

// Next.js Image component (recommended)
import Image from 'next/image'
<Image 
  src="/images/hero.jpg" 
  alt="Hero" 
  width={800} 
  height={600}
  priority // for above-the-fold images
/>
```

### Other Assets
Files in `public/assets/` are accessible at `/assets/filename.pdf`

```tsx
<a href="/assets/document.pdf" download>Download</a>
```

## Notes

- Files in `public/` are served from the root URL (`/`)
- Use Next.js `Image` component for better performance
- Keep file sizes optimized for web
- Use descriptive folder names for organization

