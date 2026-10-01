interface GoogleIdentity {
  initialize: (options: {
    client_id: string;
    nonce: string;
    callback: (response: { credential: string }) => void;
    auto_select: boolean;
    ux_mode: 'popup';
  }) => void;
  renderButton: (element: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'signin_with' | 'signup_with' | 'continue_with';
    shape: 'pill';
    width: number;
  }) => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

let pending: Promise<GoogleIdentity> | undefined;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in a browser.'));
  }
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (pending) return pending;
  pending = new Promise<GoogleIdentity>((resolve, reject) => {
    // Reuse a script added by a previous mount. React Strict Mode can mount,
    // clean up, and mount this component again while GIS is still loading.
    let script = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    const createdScript = !script;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
    }
    const fail = () => {
      window.clearTimeout(timeout);
      script?.removeEventListener('load', succeed);
      script?.removeEventListener('error', fail);
      if (createdScript) script?.remove();
      pending = undefined;
      reject(new Error('Google could not load. Check your connection or use email sign-in.'));
    };
    const succeed = () => {
      window.clearTimeout(timeout);
      script?.removeEventListener('load', succeed);
      script?.removeEventListener('error', fail);
      if (window.google?.accounts.id) resolve(window.google.accounts.id);
      else fail();
    };
    const timeout = window.setTimeout(fail, 15000);
    script.addEventListener('error', fail, { once: true });
    script.addEventListener('load', succeed, { once: true });
    if (createdScript) document.head.appendChild(script);
  });
  return pending;
}
