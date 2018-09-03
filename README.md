# React runtime config

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Why](#why)
- [Getting started](#getting-started)
- [Usage](#usage)
- [Options](#options)
- [Create an administration page](#create-an-administration-page)

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

export interface IConfig {
  color: string;
}

export const { Config, AdminConfig } = createConfig<IConfig>({ namespace: "myapp" });

export default Config;
```

You can now use the created component everywhere in your application.

```tsx
// components/MyComponents.tsx
import react from "React";
import Config from "./Config";

const MyComponent = () => <Config>{getConfig => <h1 style={{ color: getConfig("color") }}>My title</h1>}</Config>;
```

The title will have a different color regarding our current environment.
The fallback order is the following:

- `localStorage.getItem("myapp.color")`
- `window.myapp.color`

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
}
```

## Create an administration page

To allow easy management of your configuration, we provide a smart component called `<AdminConfig />` that give you out of the box everything you need to create an awesome administration page.

Note, we are using `@operational/components` for this example, but it's obviously working with everything else :wink:

```ts
// pages/ConfigurationPage.tsx
import { Page, Card, Input, Button } from "@operational/components";
import { AdminConfig } from "./components/Config";

export default (ConfirationPage = () => (
  <Page title="Configuration">
    <Card title="Configaration">
      <AdminConfig>
        {({ fields, onFieldChange, submit, reset }) =>
          fields.map(field => (
            <Input value={field.value} label={field.path} onChange={val => field.onChange(field.path, val)} />
          ))
        }
        <Button onClick={submit}>Update config</Button>
        <Button onClick={reset}>Reset config</Button>
      </AdminConfig>
    </Card>
  </Page>
));
```

You have also access to `field.windowValue` and `field.storageValue` if you want implement more advanced UX on this page.
