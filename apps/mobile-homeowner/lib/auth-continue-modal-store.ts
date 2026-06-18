export type AuthContinueModalState = {
  visible: boolean;
  title: string;
  message: string;
};

type Listener = (state: AuthContinueModalState) => void;

let state: AuthContinueModalState = {
  visible: false,
  title: '',
  message: '',
};

let pendingResolve: ((confirmed: boolean) => void) | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(state));
}

export function subscribeAuthContinueModal(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function showAuthContinueModal(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    state = { visible: true, title, message };
    emit();
  });
}

export function resolveAuthContinueModal(confirmed: boolean) {
  pendingResolve?.(confirmed);
  pendingResolve = null;
  state = { visible: false, title: '', message: '' };
  emit();
}
