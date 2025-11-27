type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeNotificationUpdates = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitNotificationUpdate = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('Notification listener error:', error);
    }
  });
};

