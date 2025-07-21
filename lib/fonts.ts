// Centralized font configuration
// Change font file names here to update fonts across the entire application

export const fontConfig = {
  // Heading font - used for titles, headings, and important labels
  heading: {
    name: "Bungee",
    fileName: "Bungee-Regular.ttf",
    fallback: "system-ui, sans-serif",
    cssClass: "font-heading",
  },

  // Content font - used for body text, descriptions, and general content
  content: {
    name: "Domine",
    fileName: "Domine-Regular.ttf",
    fallback: "Georgia, serif",
    cssClass: "font-content",
  },
} as const

// CSS font-face declarations
export const getFontFaceCSS = () => `
  @font-face {
    font-family: '${fontConfig.heading.name}';
    src: url('/fonts/${fontConfig.heading.fileName}') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: '${fontConfig.content.name}';
    src: url('/fonts/${fontConfig.content.fileName}') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`

// Tailwind CSS utility classes
export const fontClasses = {
  heading: `font-['${fontConfig.heading.name}',${fontConfig.heading.fallback}]`,
  content: `font-['${fontConfig.content.name}',${fontConfig.content.fallback}]`,
} as const
