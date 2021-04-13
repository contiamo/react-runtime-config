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

export const isStringConfig = (value: Config): value is StringConfig => value.type === "string";
export const isStringEnumConfig = (value: Config): value is StringEnumValue =>
  value.type === "string" && Array.isArray(value.enum);
export const isNumberConfig = (value: Config): value is NumberConfig => value.type === "number";
export const isBooleanConfig = (value: Config): value is BooleanConfig => value.type === "boolean";
export const isCustomConfig = (value: Config): value is CustomConfig => value.type === "custom";

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
