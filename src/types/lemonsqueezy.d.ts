/* eslint-disable @typescript-eslint/no-explicit-any */

// Lemon.js global types
// See: https://docs.lemonsqueezy.com/help/lemonjs

interface LemonSqueezyEventPayload {
  event: string;
  data?: any;
}

interface LemonSqueezyGlobal {
  Setup: (config: {
    eventHandler: (event: LemonSqueezyEventPayload) => void;
  }) => void;
  Url: {
    Open: (url: string) => void;
    Close: () => void;
  };
  Refresh: () => void;
}

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: LemonSqueezyGlobal;
  }
}

export {};
