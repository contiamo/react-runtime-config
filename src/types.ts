export interface ConfigOptions<TSchema extends Record<string, Config>, TNamespace extends string> {
  /**
   * Namespace of the configuration
   *
   * This namespace is used to consume the configuration from `window` and `localStorage`
   */
  namespace: string;

  /**
   * Schema of the configuration (used for runtime validation)
   */
  schema: TSchema;

  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: Storage;

  /**
   * Permit to override any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;

  /**
   * Namespace for `useConfig()` return methods.
   *
   * Example:
   * ```
   *  // MyConfig.ts
   *  export const { useConfig } = createConfig({
   *    useConfigNamespace: "hello"
   *   });
   *
   * // In a react component
   * const {
   *   getHelloConfig,
   *   setHelloConfig,
   *   getAllHelloConfig,
   * } = useConfig();
   * ```
   */
  configNamespace?: TNamespace;
}

export type Config = StringConfig | NumberConfig | BooleanConfig | CustomConfig;

export interface StringConfig {
  type: "string";
  enum?: string[];
  default?: string | (() => string);
  description?: string;
}

export interface StringEnumConfig extends StringConfig {
  /**
   * List of allowed values
   */
  enum: string[];
}

export interface NumberConfig {
  type: "number";
  min?: number;
  max?: number;
  default?: number | (() => number);
  description?: string;
}

export interface BooleanConfig {
  type: "boolean";
  default?: boolean | (() => boolean);
  description?: string;
}

export interface CustomConfig<T = unknown> {
  type: "custom";
  default?: T | (() => T);
  description?: string;
  /**
   * Custom parser.
   *
   * Should throw an error if the value can't be parsed
   */
  parser: (value: any) => T;
}

export type ResolvedSchema<TSchema extends Record<string, Config>> = {
  [key in keyof TSchema]: ResolvedConfigValue<TSchema[key]>;
};

export type ResolvedConfigValue<TValue extends Config> = TValue extends StringEnumConfig
  ? TValue["enum"][-1]
  : TValue extends StringConfig
  ? string
  : TValue extends NumberConfig
  ? number
  : TValue extends BooleanConfig
  ? boolean
  : TValue extends CustomConfig
  ? ReturnType<TValue["parser"]>
  : never;

export const isStringConfig = (config: Config): config is StringConfig => config.type === "string";
export const isStringEnumConfig = (config: Config): config is StringEnumConfig =>
  config.type === "string" && Array.isArray(config.enum);
export const isNumberConfig = (config: Config): config is NumberConfig => config.type === "number";
export const isBooleanConfig = (config: Config): config is BooleanConfig => config.type === "boolean";
export const isCustomConfig = (config: Config): config is CustomConfig => config.type === "custom";

export interface InjectedProps<
  TSchema extends Record<string, Config>,
  TNamespace extends string,
  TConfig = ResolvedSchema<TSchema>
> {
  namespace: string;
  configNamespace: TNamespace;
  schema: TSchema;
  storage: Storage;
  localOverride: boolean;
  getConfig: <K extends keyof TSchema>(key: K) => ResolvedConfigValue<TSchema[K]>;
  setConfig: <K extends keyof TSchema>(key: K, value: ResolvedConfigValue<TSchema[K]>) => void;
  getAllConfig: () => TConfig;
  getWindowValue: <K extends keyof TSchema>(key: K) => ResolvedConfigValue<TSchema[K]> | null;
  getStorageValue: <K extends keyof TSchema>(key: K) => ResolvedConfigValue<TSchema[K]> | null;
}

// useAdminConfig types
export type AdminField<TSchema extends Record<string, Config>, TKey extends keyof TSchema> = TSchema[TKey] & {
  /**
   * Schema key of the config
   */
  key: TKey;
  /**
   * Full path of the config (with `namespace`)
   */
  path: string;
  /**
   * Value stored in `window.{path}`
   */
  windowValue: ResolvedConfigValue<TSchema[TKey]> | null;
  /**
   * Value stored in `storage.getItem({path})`
   */
  storageValue: ResolvedConfigValue<TSchema[TKey]> | null;
  /**
   * True if a value is store on the localStorage
   */
  isFromStorage: boolean;
  /**
   * Computed value from storage, window, schema[key].default
   */
  value: ResolvedConfigValue<TSchema[TKey]>;
  /**
   * Value setter
   */
  set: (value: ResolvedConfigValue<TSchema[TKey]>) => void;
};

type Lookup<T, K> = K extends keyof T ? T[K] : never;
type TupleFromInterface<T, K extends Array<keyof T> = Array<keyof T>> = {
  [I in keyof K]: Lookup<T, K[I]>;
};

export type AdminFields<TSchema extends Record<string, Config>> = TupleFromInterface<
  {
    [key in keyof TSchema]: AdminField<TSchema, key>;
  }
>;

// useAdminConfig generic types
type AdminProps<T, U = T> = {
  key: string;
  path: string;
  windowValue: T | null;
  storageValue: T | null;
  isFromStorage: boolean;
  value: T;
  set: (value: U) => void;
};

/**
 * `useAdminConfig.fields` in a generic version.
 *
 * This should be used if you are implementing a generic component
 * that consume any `fields` as prop.
 *
 * Note: "custom" type and "string" with enum are defined as `any` to be
 * compatible with any schemas. You will need to validate them in your
 * implementation to retrieve a strict type.
 */
export type GenericAdminFields = Array<
  | (StringConfig & AdminProps<string>)
  | (NumberConfig & AdminProps<number>)
  | (BooleanConfig & AdminProps<boolean>)
  | (StringEnumConfig & AdminProps<string, any>)
  | (CustomConfig<any> & AdminProps<any>)
>;

// useConfig types
type UseConfigReturnType<TSchema extends Record<string, Config>> = {
  getConfig: <K extends keyof TSchema>(path: K) => ResolvedConfigValue<TSchema[K]>;
  getAllConfig: () => ResolvedSchema<TSchema>;
  setConfig: <K extends keyof TSchema>(path: K, value: ResolvedConfigValue<TSchema[K]>) => void;
};

/**
 * Helper to inject a namespace inside the keys of the `useConfig` return type.
 *
 * example:
 * ```
 * type Namespaced<{getConfig: any; getAllConfig: any; setConfig: any}, "foo">
 * // { getFooConfig: any; getAllFooConfig: any; setFooConfig: any }
 * ```
 */
type Namespaced<T, TNamespace extends string> = {
  [P in keyof T as P extends `getConfig`
    ? `get${Capitalize<TNamespace>}Config`
    : P extends "getAllConfig"
    ? `getAll${Capitalize<TNamespace>}Config`
    : `set${Capitalize<TNamespace>}Config`]: T[P];
};

export type NamespacedUseConfigReturnType<
  TSchema extends Record<string, Config>,
  TNamespace extends string
> = Namespaced<UseConfigReturnType<TSchema>, TNamespace>;
