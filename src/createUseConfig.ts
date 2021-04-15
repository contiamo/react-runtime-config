import { Config, InjectedProps, NamespacedUseConfigReturnType } from "./types";
import { useCallback } from "react";
import { useWatchLocalStorageEvents, capitalize } from "./utils";

export function createUseConfig<TSchema extends Record<string, Config>, Namespace extends string>(
  props: InjectedProps<TSchema, Namespace>,
) {
  return () => {
    const localStorageDependency = useWatchLocalStorageEvents(props.storage, props.localOverride);

    const getConfig = useCallback(props.getConfig, [localStorageDependency]);
    const getAllConfig = useCallback(props.getAllConfig, [localStorageDependency]);

    return {
      [`get${capitalize(props.configNamespace)}Config`]: getConfig,
      [`getAll${capitalize(props.configNamespace)}Config`]: getAllConfig,
      [`set${capitalize(props.configNamespace)}Config`]: props.setConfig,
    } as NamespacedUseConfigReturnType<TSchema, Namespace>;
  };
}
