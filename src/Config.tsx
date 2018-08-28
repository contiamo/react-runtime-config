import get from "lodash/get";
import React from "react";

function isWithPath<T>(
  props: Readonly<ConfigProps<T> & InjectedConfigProps> & Readonly<{ children?: React.ReactNode }>,
): props is ConfigPropsWithPath<T> & InjectedConfigProps {
  return Boolean(props && props.path !== undefined);
}

export interface ConfigPropsWithPath<T> {
  path: string;
  defaultValue: T;
  forceWindowConfig?: boolean;
  children: (value: T) => React.ReactNode;
}

export interface ConfigPropsWithoutPath {
  path?: never;
  defaultValue?: never;
  forceWindowConfig?: boolean;
  children: (getConfig: <T>(path: string, defaultValue: T) => T) => React.ReactNode;
}

export type ConfigProps<T> = ConfigPropsWithPath<T> | ConfigPropsWithoutPath;

export interface InjectedConfigProps {
  localOverride: boolean;
  namespace: string;
  storage: Storage;
  configList: Set<string>;
}

export class Config<T> extends React.Component<ConfigProps<T> & InjectedConfigProps> {
  public componentDidMount() {
    if (this.props.localOverride) {
      window.addEventListener("storage", this.onStorageUpdate);
    }
  }

  public componentWillUnmount() {
    if (this.props.localOverride) {
      window.removeEventListener("storage", this.onStorageUpdate);
    }
  }

  public render() {
    if (isWithPath(this.props)) {
      return this.props.children(this.getConfig(this.props.path, this.props.defaultValue) as T);
    } else {
      return this.props.children(this.getConfig.bind(this));
    }
  }

  /**
   * Get a value from the config
   */
  private getConfig<U>(path: string, defaultValue: U): U {
    // Update global config list
    this.props.configList.add(path);

    const storageValue = this.getStorageValue(path);
    const windowValue = get(window, `${this.props.namespace}${path}`, null);

    if (this.props.forceWindowConfig && windowValue === null) {
      throw new Error(
        process.env.NODE_ENV !== "production"
          ? `INVALID CONFIG: ${path} must be present inside config map, under window.${this.props.namespace}`
          : "INVALID CONFIG MAP",
      );
    }

    let value = defaultValue;

    if (storageValue !== null) {
      value = storageValue;
    } else if (windowValue !== null) {
      value = windowValue;
    }

    return value as U;
  }

  /**
   * Return the storage value if exists and `localOverride` is allow.
   */
  private getStorageValue = (path: string): any | null => {
    if (this.props.storage && this.props.localOverride) {
      const value = this.props.storage.getItem(`${this.props.namespace}${path}`);
      return value === "true" || value === "false" ? value === "true" : value;
    } else {
      return null;
    }
  };

  /**
   * Handler for storage event.
   */
  private onStorageUpdate = (_: StorageEvent) => {
    if (this.props.storage && this.props.localOverride) {
      this.forceUpdate();
    }
  };
}

export default Config;
