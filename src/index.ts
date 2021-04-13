import get from "lodash/get";
import { parse } from "./parsers";
import {
  ConfigOptions,
  InjectedProps,
  Config,
  ResolvedSchema,
  isStringEnumConfig,
  isNumberConfig,
  isCustomConfig,
  isBooleanConfig,
  isStringConfig,
  StringConfig,
  NumberConfig,
  BooleanConfig,
  CustomConfig,
  AdminField,
  AdminFields,
} from "./types";
import { createUseAdminConfig } from "./createUseAdminConfig";
import { createUseConfig } from "./createUseConfig";

export {
  // Options
  ConfigOptions,
  // Configs
  Config,
  StringConfig,
  NumberConfig,
  BooleanConfig,
  CustomConfig,
  // Typeguards
  isStringEnumConfig,
  isNumberConfig,
  isCustomConfig,
  isBooleanConfig,
  isStringConfig,
  // useConfigAdmin.fields
  AdminField,
  AdminFields,
};

export function createConfig<TSchema extends Record<string, Config>>(options: ConfigOptions<TSchema>) {
  const injected: Pick<InjectedProps<TSchema>, keyof ConfigOptions<TSchema>> = {
    storage: window.localStorage,
    localOverride: true,
    ...options,
  };

  /**
   * Get a config value from the storage (localstorage by default)
   */
  const getStorageValue = (path: keyof TSchema) => {
    if (injected.storage && injected.localOverride) {
      try {
        const rawValue = injected.storage.getItem(`${injected.namespace}.${path}`);
        return parse(rawValue, options.schema[path]);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  };

  /**
   * Get a config value from window
   *
   * @throws
   */
  const getWindowValue = (path: keyof TSchema) => {
    try {
      const rawValue = get(window, `${injected.namespace}.${path}`, null);
      return rawValue === null ? null : parse(rawValue, options.schema[path]);
    } catch (e) {
      throw new Error(`Config key "${path}" not valid: ${e.message}`);
    }
  };

  /**
   * Get a config value from storage, window or defaultValues
   */
  function getConfig<K extends keyof ResolvedSchema<TSchema>>(path: K): ResolvedSchema<TSchema>[K] {
    const defaultValue = options.schema[path].default as ResolvedSchema<TSchema>[K];
    const storageValue = getStorageValue(path);
    const windowValue = getWindowValue(path);

    return storageValue !== null ? storageValue : windowValue !== null ? windowValue : defaultValue;
  }

  /**
   * Set a config value in the storage.
   * This will also remove the value if the value is the same as the window one.
   *
   * @throws
   */
  function setConfig<K extends keyof ResolvedSchema<TSchema>>(path: K, value: ResolvedSchema<TSchema>[K]) {
    const config = options.schema[path];
    try {
      parse(value, config); // Runtime validation of the value
    } catch (e) {
      if (isCustomConfig(config)) {
        throw e;
      }
      if (isStringEnumConfig(config)) {
        throw new Error(`Expected "${path}=${value}" to be one of: ${config.enum.join(", ")}`);
      } else if (isNumberConfig(config) && Number.isFinite(value)) {
        if (typeof config.min === "number" && value < config.min) {
          throw new Error(`Expected "${path}=${value}" to be greater than ${config.min}`);
        }
        if (typeof config.max === "number" && value > config.max) {
          throw new Error(`Expected "${path}=${value}" to be lower than ${config.max}`);
        }
      }

      throw new Error(`Expected "${path}=${value}" to be a "${config.type}"`);
    }
    if (getWindowValue(path) === value) {
      injected.storage.removeItem(`${injected.namespace}.${path}`);
    } else {
      injected.storage.setItem(`${injected.namespace}.${path}`, String(value));
    }
    window.dispatchEvent(new Event("storage"));
  }

  /**
   * Get all consolidate config values.
   */
  function getAllConfig(): ResolvedSchema<TSchema> {
    return Object.keys(options.schema).reduce(
      (mem, key) => ({ ...mem, [key]: getConfig(key) }),
      {} as ResolvedSchema<TSchema>,
    );
  }

  // Validate all config from `window.{namespace}`
  getAllConfig();

  return {
    useConfig: createUseConfig<TSchema>({
      getConfig,
      getAllConfig,
      getStorageValue,
      getWindowValue,
      setConfig,
      ...injected,
    }),
    useAdminConfig: createUseAdminConfig<TSchema>({
      getConfig,
      getAllConfig,
      getStorageValue,
      getWindowValue,
      setConfig,
      ...injected,
    }),
    getConfig,
    setConfig,
    getAllConfig,
  };
}

export default createConfig;
