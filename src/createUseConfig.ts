import { Config, InjectedProps, NamespacedUseConfigReturnType } from "./types";
import { useCallback } from "react";
import { useWatchLocalstorageEvents, capitalize } from "./utils";

export function createUseConfig<TSchema extends Record<string, Config>, Namespace extends string>(
  props: InjectedProps<TSchema, Namespace>,
) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride);

    const getConfig = useCallback(props.getConfig, [localstorageDep]);
    const getAllConfig = useCallback(props.getAllConfig, [localstorageDep]);

    return {
      [`get${capitalize(props.useConfigNamespace)}Config`]: getConfig,
      [`getAll${capitalize(props.useConfigNamespace)}Config`]: getAllConfig,
      [`set${capitalize(props.useConfigNamespace)}Config`]: props.setConfig,
    } as NamespacedUseConfigReturnType<TSchema, Namespace>;
  };
}
