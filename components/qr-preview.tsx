"use client";

import { useState } from "react";

interface QrPreviewProps {
  url: string;
  pngDataUrl: string;
  svg: string;
}

export function QrPreview({ url, pngDataUrl, svg }: QrPreviewProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadPng() {
    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = "navkar-care-trust-organisation-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "navkar-care-trust-organisation-qr.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="qr-preview">
      <div className="qr-preview-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pngDataUrl} alt="QR code for organisation registration" width={220} height={220} />
      </div>
      <p className="qr-preview-url" title={url}>
        {url}
      </p>
      <div className="qr-preview-actions">
        <button type="button" className="button button-outline" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button type="button" className="button button-outline" onClick={downloadPng}>
          Download PNG
        </button>
        <button type="button" className="button button-outline" onClick={downloadSvg}>
          Download SVG
        </button>
      </div>
    </div>
  );
}
