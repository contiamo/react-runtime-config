import { InjectedProps, RuntimeType } from ".";
import { useCallback, useMemo } from "react";
import { useWatchLocalstorageEvents } from "./utils";
import get from "lodash/get";

export type Field<T, K extends keyof T = Extract<keyof T, string>> = Array<{
  path: K;
  defaultValue: T[K] | null;
  windowValue: any;
  storageValue: string | boolean | null;
  value: T[K];
  isFromStorage: boolean;
  type: RuntimeType;
}>;

export function useAdminConfig<T>(props: InjectedProps<T>) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride);

    const configKeys = useMemo(() => Object.keys(props.getAllConfig()) as Extract<keyof T, string>[], []);

    const fields: Field<T> = useMemo(() => {
      return configKeys
        .map(path => ({
          path,
          defaultValue: get(props.defaultConfig, path, null) as T[typeof path] | null,
          windowValue: props.getWindowValue(path),
          storageValue: props.getStorageValue(path),
          value: props.getConfig(path),
          type: get(props.types, path, "string") as RuntimeType,
        }))
        .map(field => ({
          ...field,
          isFromStorage: field.storageValue !== null,
        }));
    }, [localstorageDep, configKeys]);

    const reset = useCallback(() => {
      configKeys.forEach(path => {
        props.storage.removeItem(`${props.namespace}.${path}`);
      });
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
       * Proxy of setConfig
       */
      setConfig: props.setConfig,

      /**
       * Namespace
       */
      namespace: props.namespace,
    };
  };
}

export default useAdminConfig;
