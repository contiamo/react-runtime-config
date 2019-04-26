import get from "lodash/get";
import uniq from "lodash/uniq";
import React from "react";

import AdminConfigBase, { AdminConfigProps } from "./AdminConfig";
import ConfigBase, { ConfigProps } from "./Config";

export { ConfigProps, AdminConfigProps };

export interface ConfigOptions<TConfig> {
  namespace: string;
  /**
   * Config default values
   */
  defaultConfig?: Partial<TConfig>;
  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: Storage;
  /**
   * Permit to overidde any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
}

export interface InjectedProps<TConfig> extends Required<ConfigOptions<TConfig>> {
  getConfig: <K extends Extract<keyof TConfig, string> = Extract<keyof TConfig, string>>(path: K) => TConfig[K];
  setConfig: <K extends Extract<keyof TConfig, string> = Extract<keyof TConfig, string>>(
    path: K,
    value: TConfig[K],
  ) => void;
  getAllConfig: () => TConfig;
  getWindowValue: (path: Extract<keyof TConfig, string>) => any;
  getStorageValue: (path: Extract<keyof TConfig, string>) => string | boolean | null;
}

export function createConfig<TConfig>(options: ConfigOptions<TConfig>) {
  const { namespace } = options;
  const injected = {
    storage: window.localStorage,
    localOverride: true,
    defaultConfig: {},
    ...options,
    namespace: namespace.slice(-1) === "." ? namespace : `${namespace}.`,
  };

  /**
   * Get a config value from the storage (localstorage by default)
   */
  const getStorageValue = (path: Extract<keyof TConfig, string>) => {
    if (injected.storage && injected.localOverride) {
      const value = injected.storage.getItem(`${injected.namespace}${path}`);
      return value === "true" || value === "false" ? value === "true" : value;
    } else {
      return null;
    }
  };

  /**
   * Get a config value from window)
   */
  const getWindowValue = (path: Extract<keyof TConfig, string>) => get(window, `${injected.namespace}${path}`, null);

  /**
   * Get a config value from storage, window or defaultValues
   */
  function getConfig<K extends Extract<keyof TConfig, string> = Extract<keyof TConfig, string>>(path: K): TConfig[K] {
    const defaultValue = options.defaultConfig && options.defaultConfig[path];
    const storageValue = getStorageValue(path);
    const windowValue = getWindowValue(path);

    if (windowValue === null && defaultValue === undefined) {
      throw new Error(`INVALID CONFIG: ${path} must be present inside config map, under window.${injected.namespace}`);
    }

    return storageValue !== null ? storageValue : windowValue !== null ? windowValue : defaultValue;
  }

  /**
   * Set a config value in the storage.
   * This will also remove the value if the value is the same as the window one.
   */
  function setConfig<K extends Extract<keyof TConfig, string> = Extract<keyof TConfig, string>>(
    path: K,
    value: TConfig[K],
  ) {
    if (getWindowValue(path) === value) {
      injected.storage.removeItem(`${injected.namespace}${path}`);
    } else {
      injected.storage.setItem(`${injected.namespace}${path}`, String(value));
    }
    window.dispatchEvent(new Event("storage"));
  }

  /**
   * Get all consolidate config values.
   */
  function getAllConfig(): TConfig {
    // `slice(0, -1)`is for removing the trailing point
    const windowKeys = Object.keys(get(window, injected.namespace.slice(0, -1), {})) as any;
    const defaultKeys = Object.keys(options.defaultConfig || {});

    return uniq([...windowKeys, ...defaultKeys]).reduce((mem, key) => ({ ...mem, [key]: getConfig(key) }), {});
  }

  return {
    Config(props: ConfigProps<TConfig>) {
      return (
        <ConfigBase
          getConfig={getConfig}
          getAllConfig={getAllConfig}
          getStorageValue={getStorageValue}
          getWindowValue={getWindowValue}
          setConfig={setConfig}
          {...injected}
          {...props}
        />
      );
    },
    AdminConfig(props: AdminConfigProps<TConfig>) {
      return (
        <AdminConfigBase
          getConfig={getConfig}
          getAllConfig={getAllConfig}
          getStorageValue={getStorageValue}
          getWindowValue={getWindowValue}
          setConfig={setConfig}
          {...injected}
          {...props}
        />
      );
    },
    getConfig,
    setConfig,
    getAllConfig,
  };
}

export default createConfig;
