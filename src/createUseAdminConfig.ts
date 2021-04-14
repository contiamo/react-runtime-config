import { InjectedProps, Config, ResolvedConfigValue, AdminFields } from "./types";
import { useCallback, useMemo } from "react";
import { useWatchLocalstorageEvents } from "./utils";

export function createUseAdminConfig<T extends Record<string, Config>, TNamespace extends string>(
  props: InjectedProps<T, TNamespace>,
) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride);

    const configKeys: (keyof T)[] = useMemo(() => Object.keys(props.schema), [props.schema]);

    const fields = useMemo(() => {
      return configKeys.map(path => ({
        path,
        ...props.schema[path],
        windowValue: props.getWindowValue(path),
        storageValue: props.getStorageValue(path),
        isFromStorage: props.getStorageValue(path) !== null,
        value: props.getConfig(path),
        set: (value: ResolvedConfigValue<T[typeof path]>) => props.setConfig(path, value),
      })) as AdminFields<T>;
    }, [localstorageDep, configKeys]);

    const reset = useCallback(() => {
      configKeys.forEach(path => {
        props.storage.removeItem(`${props.namespace}.${path}`);
      });
      window.dispatchEvent(new Event("storage"));
    }, [configKeys, props.namespace]);

    return {
      /**
       * List of all config values
       */
      fields,

      /**
       * Reset the store
       */
      reset,

      /**
       * Namespace
       */
      namespace: props.namespace,
    };
  };
}
