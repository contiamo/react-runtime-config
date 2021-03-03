import { InjectedProps } from ".";
import React from "react";

export function useConfig<T>(props: InjectedProps<T>) {
  return () => {
    const [forceUpdateKey, setForceUpdateKey] = React.useState(0);
    const forceUpdate = React.useCallback(() => setForceUpdateKey(i => (i + 1) % 10), [setForceUpdateKey]);

    // Watch localstorage events
    React.useEffect(() => {
      const onStorageUpdate = (_: StorageEvent) => {
        if (props.storage && props.localOverride) {
          forceUpdate();
        }
      };

      window.addEventListener("storage", onStorageUpdate);

      return () => window.removeEventListener("storage", onStorageUpdate);
    }, []);

    const getConfig = React.useCallback(props.getConfig, [forceUpdateKey]);
    const getAllConfig = React.useCallback(props.getAllConfig, [forceUpdateKey]);

    return {
      getConfig,
      getAllConfig,
      setConfig: props.setConfig,
    };
  };
}

export default useConfig;
