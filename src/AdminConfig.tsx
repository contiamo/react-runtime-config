import get from "lodash/get";
import React from "react";

import { InjectedProps } from ".";

export type Field<T, K extends keyof T = Extract<keyof T, string>> = Array<{
  path: K;
  windowValue: any;
  storageValue: string | boolean | null;
  value: T[K];
}>;

export interface AdminConfigProps<T> {
  children: (
    options: {
      /**
       * List of all config values
       */
      fields: Field<T>;
      /**
       * Handler to update `fields.value`
       */
      onFieldChange: <L extends keyof T = Extract<keyof T, string>>(path: L, value: T[L]) => void;
      /**
       * Set all `value` to `storageValue`
       */
      submit: () => void;
      /**
       * Reset the store
       */
      reset: () => void;
    },
  ) => React.ReactNode;
}

export interface AdminConfigState {
  [key: string]: any;
}

export class AdminConfig<T> extends React.Component<AdminConfigProps<T> & InjectedProps<T>, AdminConfigState> {
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
    const fields = this.getConfigKeys().map(path => ({
      path,
      windowValue: this.props.getWindowValue(path),
      storageValue: this.props.getStorageValue(path),
      value: get(this.state, path, this.props.getConfig(path)),
    }));

    return this.props.children({
      fields,
      onFieldChange: this.onFieldChange,
      submit: this.onSubmit,
      reset: this.onReset,
    });
  }

  /**
   * Store the current field into the state.
   */
  private onFieldChange = <K extends keyof T = Extract<keyof T, string>>(path: K, value: T[K]) => {
    this.setState({ [path]: value });
  };

  /**
   * Update the store regarding the user values
   */
  private onSubmit = () => {
    Object.entries(this.state).map(([path, value]) => {
      this.props.setConfig(path as any, value);
    });
  };

  /**
   * Reset every storage values.
   */
  private onReset = () => {
    // Reset storage
    this.getConfigKeys().forEach(path => {
      this.props.storage.removeItem(`${this.props.namespace}${path}`);
    });

    // Reset user values
    this.setState(() => this.getConfigKeys().reduce((mem, path) => ({ ...mem, [path]: undefined }), {}));
  };

  /**
   * Handler for storage event.
   */
  private onStorageUpdate = (_: StorageEvent) => {
    if (this.props.storage && this.props.localOverride) {
      this.forceUpdate();
    }
  };

  /**
   * Returns every config keys
   */
  private getConfigKeys = (): Array<Extract<keyof T, string>> => {
    return Object.keys(this.props.getAllConfig()) as any;
  };
}

export default AdminConfig;
