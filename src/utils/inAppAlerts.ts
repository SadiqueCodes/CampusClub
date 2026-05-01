export type InAppAlertPayload = {
  title: string;
  message: string;
};

type Listener = (payload: InAppAlertPayload) => void;

const listeners = new Set<Listener>();

export const emitInAppAlert = (payload: InAppAlertPayload) => {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      // no-op for listener failures
    }
  });
};

export const subscribeInAppAlert = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
