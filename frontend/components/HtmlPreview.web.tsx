/**
 * Web-specific HTML renderer for comparison questions.
 * Uses an iframe with Tailwind CDN so the HTML mockups render correctly.
 */
import React from 'react';

interface Props {
  html: string;
  height?: number;
}

export default function HtmlPreview({ html, height = 220 }: Props) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8px; background: transparent; font-family: sans-serif; }
  </style>
</head>
<body>${html}</body>
</html>`;

  return (
    <iframe
      srcDoc={fullHtml}
      style={{
        width: '100%',
        height,
        border: 'none',
        borderRadius: 10,
        display: 'block',
      }}
      sandbox="allow-scripts"
      scrolling="no"
    />
  );
}
