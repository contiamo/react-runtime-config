import get from "lodash/get";
import React from "react";

export interface ConfigProps<T> {
  children: (getConfig: (<K extends keyof T = Extract<keyof T, string>>(path: K) => T[K])) => React.ReactNode;
}

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
    return this.props.children(this.getConfig.bind(this));
  }

  /**
   * Get a value from the config
   */
  private getConfig<U>(path: string): U {
    // Update global config list
    this.props.configList.add(path);

    const storageValue = this.getStorageValue(path);
    const windowValue = get(window, `${this.props.namespace}${path}`, null);

    if (windowValue === null) {
      throw new Error(
        `INVALID CONFIG: ${path} must be present inside config map, under window.${this.props.namespace}`,
      );
    }

    return storageValue !== null ? storageValue : windowValue;
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
