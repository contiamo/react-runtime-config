import get from "lodash/get";
import React from "react";

export interface ConfigProps<T> {
  path: string;
  defaultValue: T;
  forceWindowConfig?: boolean;
  children: (value: T) => React.ReactNode;
}

export interface InjectedConfigProps {
  localOverride: boolean;
  namespace: string;
  storage: Storage;
}

export class Config<T> extends React.Component<ConfigProps<T> & InjectedConfigProps> {
  private currentValue: T | null = null;

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
    const storageValue = this.getStorageValue();
    const windowValue = get(window, `${this.props.namespace}${this.props.path}`, null);

    if (this.props.forceWindowConfig && windowValue === null) {
      throw new Error(
        process.env.NODE_ENV !== "production"
          ? `INVALID CONFIG: ${this.props.path} must be present inside config map, under window.${this.props.namespace}`
          : "INVALID CONFIG MAP",
      );
    }

    this.currentValue = this.props.defaultValue;

    if (storageValue !== null) {
      this.currentValue = storageValue;
    } else if (windowValue !== null) {
      this.currentValue = windowValue;
    }

    return this.props.children(this.currentValue as T);
  }

  /**
   * Return the storage value if exists and `localOverride` is allow.
   */
  private getStorageValue = (): any | null => {
    if (this.props.storage && this.props.localOverride) {
      const value = this.props.storage.getItem(`${this.props.namespace}${this.props.path}`);
      return value === "true" || value === "false" ? value === "true" : value;
    } else {
      return null;
    }
  };

  /**
   * Handler for storage event.
   */
  private onStorageUpdate = (_: StorageEvent) => {
    if (this.getStorageValue() !== this.currentValue) {
      this.forceUpdate();
    }
  };
}

export default Config;
