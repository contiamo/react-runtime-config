import { InjectedProps, Config, ResolvedConfigValue, AdminFields } from "./types";
import { useCallback, useMemo } from "react";
import { useWatchLocalStorageEvents } from "./utils";

export function createUseAdminConfig<TSchema extends Record<string, Config>, TNamespace extends string>(
  props: InjectedProps<TSchema, TNamespace>,
) {
  return () => {
    const localStorageDependency = useWatchLocalStorageEvents(props.storage, props.localOverride);

    const configKeys: (keyof TSchema)[] = useMemo(() => Object.keys(props.schema), [props.schema]);

    const fields = useMemo(() => {
      return configKeys.map(key => ({
        key,
        path: `${props.namespace}.${key}`,
        ...props.schema[key],
        windowValue: props.getWindowValue(key),
        storageValue: props.getStorageValue(key),
        isFromStorage: props.getStorageValue(key) !== null,
        value: props.getConfig(key),
        set: (value: ResolvedConfigValue<TSchema[typeof key]>) => props.setConfig(key, value),
      })) as AdminFields<TSchema>;
    }, [localStorageDependency, configKeys]);

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
