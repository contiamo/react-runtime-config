# React runtime config

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Why](#why)
- [Getting started](#getting-started)
- [Usage](#usage)
- [Options](#options)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why

As front-end developer, we often need to deal with an external environment (servers, clients need for example).
To response to this flexibility, a runtime configuration is just perfect!

Indeed, with runtime configuration, we can provide a generic application and permit a total customization of this one:

- theme constant
- backend url
- feature flippings
- enable dev-tools :)
- …

With this package, the idea is to have a conveniant way to have a runtime configuration inside a react application.

The configuration can be set by:

- injecting an object into `window` as base configuration, very easy to manipulate in server side or ops
- local override into `localStorage`, so it's easy to have a custom environment on dev

And we can consume this configuration easily, with a simple react component.

## Getting started

1. `npm i react-runtime-config`

## Usage

First of all, you need to create a namespace for your config.

```tsx
// components/Config.tsx
import createConfig from "react-runtime-config";

export const { Config, configList } = createConfig({ namespace: "myapp" });

export default Config;
```

You can now use the created component everywhere in your application.

```tsx
// components/MyComponents.tsx
import react from "React";
import Config from "./Config";

const MyComponent = () => (
  <Config path="color" defaultValue="red">
    {color => <h1 style={{ color }}>My title</h1>}
  </Config>
);
```

The title will have a different color regarding our current environment.
The fallback order is the following:

- `localStorage.getItem("myapp.color")`
- `window.myapp.color`
- `defaultValue` props (`red` in this example)

The `configList` is a `Set<string>` of all config paths used in the application, very useful to create a config page to override locally any values :wink:

## Options

```ts
interface ConfigOptions {
  namespace: string;
  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: StorageAdapter;
  /**
   * Permit to overidde any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
  /**
   * Throw an error if the config value is not set in window
   *
   * @default false
   */
  forceWindowConfig?: boolean;
}
```
