import { InjectedProps, Config, ResolvedConfigValue } from "./types";
import { useCallback, useMemo } from "react";
import { useWatchLocalstorageEvents } from "./utils";

export function createUseAdminConfig<T extends Record<string, Config>>(props: InjectedProps<T>) {
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
       * Namespace
       */
      namespace: props.namespace,
    };
  };
}

// export type Fields<T> = Array<TextField<T> | NumberField<T> | BooleanField<T>>;

// type StorageValue = string | boolean | null;

// type TextField<T, K extends keyof T = Extract<keyof T, string>> = {
//   path: K;
//   defaultValue: string | null;
//   windowValue: any;
//   storageValue: StorageValue;
//   value: string;
//   isFromStorage: boolean;
//   type: "string" | string[];
//   setValue: (value: string) => void;
// };

// type NumberField<T, K extends keyof T = Extract<keyof T, string>> = {
//   path: K;
//   defaultValue: number | null;
//   windowValue: any;
//   storageValue: StorageValue;
//   value: number;
//   isFromStorage: boolean;
//   type: "number";
//   setValue: (value: number) => void;
// };

// type BooleanField<T, K extends keyof T = Extract<keyof T, string>> = {
//   path: K;
//   defaultValue: boolean | null;
//   windowValue: any;
//   storageValue: StorageValue;
//   value: boolean;
//   isFromStorage: boolean;
//   type: "boolean";
//   setValue: (value: boolean) => void;
// };
