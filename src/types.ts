export interface ConfigOptions<TSchema extends Record<string, Config>> {
  /**
   * Namespace of the configuration
   *
   * This namespace is used to consume the configuration from `window` and `localstorage`
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
   * Permit to overidde any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
}

export type Config = StringConfig | NumberConfig | BooleanConfig | CustomConfig;

interface StringConfig {
  type: "string";
  enum?: string[];
  default?: string;
  description?: string;
}

interface StringEnumValue extends StringConfig {
  /**
   * List of allowed values
   */
  enum: string[];
}

interface NumberConfig {
  type: "number";
  min?: number;
  max?: number;
  default?: number;
  description?: string;
}

interface BooleanConfig {
  type: "boolean";
  default?: boolean;
  description?: string;
}

interface CustomConfig<T = unknown> {
  type: "custom";
  default?: T;
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

export type ResolvedConfigValue<TValue extends Config> = TValue extends StringEnumValue
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
export const isStringEnumConfig = (config: Config): config is StringEnumValue =>
  config.type === "string" && Array.isArray(config.enum);
export const isNumberConfig = (config: Config): config is NumberConfig => config.type === "number";
export const isBooleanConfig = (config: Config): config is BooleanConfig => config.type === "boolean";
export const isCustomConfig = (config: Config): config is CustomConfig => config.type === "custom";

export interface InjectedProps<TSchema extends Record<string, Config>, TConfig = ResolvedSchema<TSchema>> {
  namespace: string;
  schema: TSchema;
  storage: Storage;
  localOverride: boolean;
  getConfig: <K extends keyof TSchema>(path: K) => ResolvedConfigValue<TSchema[K]>;
  setConfig: <K extends keyof TSchema>(path: K, value: ResolvedConfigValue<TSchema[K]>) => void;
  getAllConfig: () => TConfig;
  getWindowValue: <K extends keyof TSchema>(path: K) => ResolvedConfigValue<TSchema[K]> | null;
  getStorageValue: <K extends keyof TSchema>(path: K) => ResolvedConfigValue<TSchema[K]> | null;
}

export type AdminField<TSchema extends Record<string, Config>, TPath extends keyof TSchema> = TSchema[TPath] & {
  path: TPath;
  windowValue: ResolvedConfigValue<TSchema[TPath]> | null;
  storageValue: ResolvedConfigValue<TSchema[TPath]> | null;
  isFromStorage: boolean;
  value: ResolvedConfigValue<TSchema[TPath]>;
  set: (value: ResolvedConfigValue<TSchema[TPath]>) => void;
};

type Lookup<T, K> = K extends keyof T ? T[K] : never;
type TupleFromInterface<T, K extends Array<keyof T> = Array<keyof T>> = { [I in keyof K]: Lookup<T, K[I]> };

export type AdminFields<TSchema extends Record<string, Config>> = TupleFromInterface<
  {
    [key in keyof TSchema]: AdminField<TSchema, key>;
  }
>;
