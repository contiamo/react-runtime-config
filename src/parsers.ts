import {
  Config,
  isBooleanConfig,
  isCustomConfig,
  isNumberConfig,
  isStringConfig,
  isStringEnumConfig,
  ResolvedConfigValue,
} from "./types";

function parseString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("not a string");
  }
  return value;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    if (!Number.isFinite(parseFloat(value))) {
      throw new Error("not a number");
    }
    return parseFloat(value);
  }
  throw new Error("not a number");
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) {
    return value === "true";
  }
  throw new Error("not a boolean");
}

export function parse<TConfig extends Config>(value: unknown, config: TConfig): ResolvedConfigValue<TConfig> {
  if (isStringEnumConfig(config)) {
    const parsedString = parseString(value) as ResolvedConfigValue<TConfig>;
    if (!config.enum.includes(parsedString as any)) {
      throw new Error(`${parsedString} not part of [${config.enum.map(i => `"${i}"`).join(", ")}]`);
    }
    return parsedString;
  }
  if (isStringConfig(config)) {
    return parseString(value) as ResolvedConfigValue<TConfig>;
  }
  if (isNumberConfig(config)) {
    const parsedNumber = parseNumber(value) as ResolvedConfigValue<TConfig>;
    if (typeof config.min === "number" && parsedNumber < config.min) {
      throw new Error(`${parseNumber} should be greater than ${config.min}`);
    }
    if (typeof config.max === "number" && parsedNumber > config.max) {
      throw new Error(`${parseNumber} should be lower than ${config.max}`);
    }
    return parsedNumber;
  }
  if (isBooleanConfig(config)) {
    return parseBoolean(value) as ResolvedConfigValue<TConfig>;
  }
  if (isCustomConfig(config)) {
    return config.parser(value) as ResolvedConfigValue<TConfig>;
  }
  throw new Error("unknown config type");
}
