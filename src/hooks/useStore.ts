import { useState, useEffect } from 'react';
import { appStore } from '../store/appStore';

export function useStore() {
  const [state, setState] = useState(appStore.getState());

  useEffect(() => {
    const unsub = appStore.subscribe(() => {
      setState(appStore.getState());
    });
    return unsub;
  }, []);

  return state;
}
