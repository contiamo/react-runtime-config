import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import React from "react";
import { cleanup, render, act } from "@testing-library/react";
import { Mock } from "ts-mockery";

import createConfig from "./";
import { ConfigProps } from "./Config";
import { AdminConfigProps } from "./AdminConfig";
import "@testing-library/jest-dom/extend-expect";
import { HookResult, renderHook } from "@testing-library/react-hooks";

// Localstorage mock
let store = {};

const storage = Mock.of<Storage>({
  getItem: (path: string) => get(store, path, null),
  setItem: (path: string, value: string) => {
    set(store, path, value);
    window.dispatchEvent(new Event("storage"));
  },
  removeItem: (path: string) => {
    unset(store, path);
    window.dispatchEvent(new Event("storage"));
  },
  clear: () => {
    store = {};
    window.dispatchEvent(new Event("storage"));
  },
});

interface IConfig {
  foo: string;
  riri: string;
  picsou: string;
  loulou: string;
  donald: string;
  aBoolean: boolean;
}

describe("localStorage mock", () => {
  afterEach(() => {
    storage.clear();
  });

  it("should set and get an item", () => {
    storage.setItem("plop", "coucou");
    expect(storage.getItem("plop")).toEqual("coucou");
  });

  it("should clear the store", () => {
    storage.setItem("plop", "coucou");
    storage.clear();

    expect(store).toEqual({});
  });

  it("should return null if the value is not in the store", () => {
    expect(storage.getItem("plop")).toBeNull();
  });
});

describe("react-runtime-config", () => {
  beforeEach(() => {
    set(window, "test", { picsou: "a", donald: "b", riri: "c", loulou: "d", foo: "from-window", aBoolean: true });
  });
  afterEach(() => {
    cleanup();
    storage.clear();
    delete (window as any).test;
  });

  describe("Config", () => {
    it("should get the localhost value", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-localstorage");
    });

    it("should get the window value", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

      render(<Config children={children} />);

      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-window");
    });

    it("should ignore trailing dot in the namespace", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test.", storage });
      const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-localstorage");
    });

    it("should rerender the component on localstorage update", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-localstorage");

      storage.setItem("test.foo", "from-localstorage-modified");

      expect(children.mock.calls.length).toEqual(2);
      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-localstorage-modified");
    });

    it("should rerender the component on localstorage update (hook)", async () => {
      const { useConfig } = createConfig<IConfig>({ namespace: "test", storage });
      let renderCount = 0;
      const App = () => {
        const { getConfig } = useConfig();
        renderCount++;
        return <div data-testid="foo">{getConfig("foo")}</div>;
      };

      storage.setItem("test.foo", "from-localstorage");

      const { findByTestId } = render(<App />);
      const value = await findByTestId("foo");

      expect(value).toHaveTextContent("from-localstorage");

      act(() => {
        storage.setItem("test.foo", "from-localstorage-modified");
      });

      expect(value).toHaveTextContent("from-localstorage-modified");
      expect(renderCount).toBe(2);
    });

    it("should not rerender the component on localstorage update if localOverride is disable", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage, localOverride: false });
      const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      storage.setItem("test.foo", "from-localstorage-modified");

      expect(children.mock.calls.length).toEqual(1);
      expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-window");
    });

    it("should not rerender the component on localstorage update if localOverride is disable (hook)", async () => {
      const { useConfig } = createConfig<IConfig>({ namespace: "test", storage, localOverride: false });
      let renderCount = 0;
      const App = () => {
        const { getConfig } = useConfig();
        renderCount++;
        return <div data-testid="foo">{getConfig("foo")}</div>;
      };

      storage.setItem("test.foo", "from-localstorage");

      const { findByTestId } = render(<App />);
      const value = await findByTestId("foo");

      act(() => {
        storage.setItem("test.foo", "from-localstorage-modified");
      });

      expect(value).toHaveTextContent("from-window");
      expect(renderCount).toBe(1);
    });

    it("should throw if the value is not set in window", () => {
      unset(window, "test.foo");
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });

      expect(() => render(<Config children={({ getConfig }) => getConfig("foo")} />)).toThrowError(
        "INVALID CONFIG: foo must be present inside config map, under window.test",
      );
    });

    describe("boolean values", () => {
      it("should return true from window config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        set(window, "test.aBoolean", true);
        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("aBoolean")).toEqual(true);
      });

      it("should return false from window config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        set(window, "test.aBoolean", false);
        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("aBoolean")).toEqual(false);
      });

      it("should return true from localstorage config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        set(window, "test.foo", false);
        storage.setItem("test.foo", "true");
        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("foo")).toEqual(true);
      });

      it("should return false from localstorage config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        set(window, "test.foo", true);
        storage.setItem("test.foo", "false");
        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("foo")).toEqual(false);
      });
    });

    describe("default config", () => {
      it("should return the default config value", () => {
        unset(window, "test.foo");
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultConfig: { foo: "from-default" },
        });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-default");
      });

      it("should return the window value if defined", () => {
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultConfig: { foo: "from-default" },
        });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);

        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-window");
      });

      it("should return the storage value if defined", () => {
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultConfig: { foo: "from-default" },
        });
        const children = jest.fn<React.ReactNode, Parameters<ConfigProps<IConfig>["children"]>>(() => <div />);
        storage.setItem("test.foo", "from-localstorage");

        render(<Config children={children} />);

        expect(children.mock.calls[0][0].getConfig("foo")).toEqual("from-localstorage");
      });
    });

    it("should have correct type definition", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      render(
        <Config>
          {({ getConfig, setConfig }) => {
            const val: boolean = getConfig("aBoolean");
            const val2: string = getConfig("donald");
            setConfig("loulou", "plop");
            setConfig("aBoolean", true);
            return (
              <h1>
                {val}
                {val2}
              </h1>
            );
          }}
        </Config>,
      );

      expect(1).toBe(1);
    });
  });

  describe("AdminConfig", () => {
    const defaultConfig = {
      batman: "from-default",
    };
    let config = createConfig<IConfig & typeof defaultConfig>({ namespace: "test", storage, defaultConfig });
    let children: jest.Mock<React.ReactNode, Parameters<AdminConfigProps<IConfig & typeof defaultConfig>["children"]>>;

    beforeEach(() => {
      config = createConfig<IConfig & typeof defaultConfig>({
        namespace: "test",
        storage,
        defaultConfig,
        types: {
          aBoolean: "boolean",
          riri: ["c", "d"],
        },
      });
      children = jest.fn<React.ReactNode, Parameters<AdminConfigProps<IConfig & typeof defaultConfig>["children"]>>(
        () => <div />,
      );

      const { AdminConfig } = config;

      storage.setItem("test.picsou", "$$$");

      // expose children called by AdminConfig
      render(<AdminConfig>{children}</AdminConfig>);
    });

    it("should return all the config fields", () => {
      expect(children.mock.calls[0][0].fields).toMatchInlineSnapshot(`
        Array [
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": false,
            "path": "aBoolean",
            "storageValue": null,
            "type": "boolean",
            "value": true,
            "windowValue": true,
          },
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": false,
            "path": "riri",
            "storageValue": null,
            "type": Array [
              "c",
              "d",
            ],
            "value": "c",
            "windowValue": "c",
          },
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": true,
            "path": "picsou",
            "storageValue": "$$$",
            "type": "string",
            "value": "$$$",
            "windowValue": "a",
          },
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": false,
            "path": "donald",
            "storageValue": null,
            "type": "string",
            "value": "b",
            "windowValue": "b",
          },
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": false,
            "path": "loulou",
            "storageValue": null,
            "type": "string",
            "value": "d",
            "windowValue": "d",
          },
          Object {
            "defaultValue": null,
            "isEditing": false,
            "isFromStorage": false,
            "path": "foo",
            "storageValue": null,
            "type": "string",
            "value": "from-window",
            "windowValue": "from-window",
          },
          Object {
            "defaultValue": "from-default",
            "isEditing": false,
            "isFromStorage": false,
            "path": "batman",
            "storageValue": null,
            "type": "string",
            "value": "from-default",
            "windowValue": null,
          },
        ]
      `);
    });

    it("should change the value on field change", () => {
      children.mock.calls[0][0].onFieldChange("picsou", "plop");

      const picsouField = children.mock.calls[1][0].fields.find(i => i.path === "picsou");

      expect(picsouField).toEqual({
        path: "picsou",
        isFromStorage: true,
        isEditing: true,
        defaultValue: null,
        storageValue: "$$$",
        value: "plop",
        windowValue: "a",
        type: "string",
      });
    });

    it("should update storage value on submit", () => {
      expect(storage.getItem("test.picsou")).toEqual("$$$");

      children.mock.calls[0][0].onFieldChange("picsou", "plop");
      children.mock.calls[1][0].submit();

      const picsouField = children.mock.calls[2][0].fields.find(i => i.path === "picsou");
      expect(picsouField).toEqual({
        path: "picsou",
        isFromStorage: true,
        isEditing: false,
        defaultValue: null,
        storageValue: "plop",
        value: "plop",
        windowValue: "a",
        type: "string",
      });
      expect(storage.getItem("test.picsou")).toEqual("plop");
    });

    it("should reset the local storage", () => {
      children.mock.calls[0][0].onFieldChange("picsou", "plop");
      children.mock.calls[1][0].reset();

      expect(children.mock.calls[9][0].fields.reduce((mem, field) => mem || field.isFromStorage, false)).toEqual(false);
      // One call by field (localstorage events)
      expect(children.mock.calls.length).toBe(10);
    });

    it("should not erase values if I'm submit just after a reset", () => {
      children.mock.calls[0][0].onFieldChange("picsou", "plop");
      children.mock.calls[1][0].reset();
      children.mock.calls[2][0].submit(); // This don't call another loop since all user values are undefined

      const picsouField = children.mock.calls[9][0].fields.find(i => i.path === "picsou");
      expect(picsouField).toEqual({
        path: "picsou",
        isFromStorage: false,
        isEditing: false,
        defaultValue: null,
        storageValue: null,
        value: "a",
        windowValue: "a",
        type: "string",
      });
      // One call by field (localstorage events)
      expect(children.mock.calls.length).toBe(10);
    });
  });

  describe("useAdminConfig", () => {
    type BatmanStore = {
      batman: string;
      robin: string;
      catwoman: string;
      isBadass: boolean;
      vilain: "Joker" | "Mr Freeze";
      anniversary: number;
    };
    const options = {
      namespace: "test",
      storage,
      defaultConfig: {
        batman: "from-default",
        catwoman: "from-default",
      },
      types: {
        catwoman: "string" as const,
        isBadass: "boolean" as const,
        anniversary: "number" as const,
        vilain: ["Joker", "Mr Freeze"],
      },
    };

    const { useAdminConfig } = createConfig<BatmanStore>(options);
    let result: HookResult<ReturnType<typeof useAdminConfig>>;

    beforeEach(() => {
      set(window, "test", { robin: "from-window", isBadass: true, anniversary: 80, vilain: "Joker" });

      const { useAdminConfig } = createConfig<BatmanStore>(options);
      const hookResults = renderHook(() => useAdminConfig());
      result = hookResults.result;
      act(() => {
        storage.setItem("test.catwoman", "from-localstorage");
      });
    });

    it("should have the correct namespace", () => {
      expect(result.current.namespace).toBe("test");
    });

    it("should return all the configs fields", () => {
      expect(result.current.fields).toMatchInlineSnapshot(`
        Array [
          Object {
            "defaultValue": "from-default",
            "isFromStorage": true,
            "path": "catwoman",
            "storageValue": "from-localstorage",
            "type": "string",
            "value": "from-localstorage",
            "windowValue": null,
          },
          Object {
            "defaultValue": null,
            "isFromStorage": false,
            "path": "isBadass",
            "storageValue": null,
            "type": "boolean",
            "value": true,
            "windowValue": true,
          },
          Object {
            "defaultValue": null,
            "isFromStorage": false,
            "path": "anniversary",
            "storageValue": null,
            "type": "number",
            "value": 80,
            "windowValue": 80,
          },
          Object {
            "defaultValue": null,
            "isFromStorage": false,
            "path": "vilain",
            "storageValue": null,
            "type": Array [
              "Joker",
              "Mr Freeze",
            ],
            "value": "Joker",
            "windowValue": "Joker",
          },
          Object {
            "defaultValue": null,
            "isFromStorage": false,
            "path": "robin",
            "storageValue": null,
            "type": "string",
            "value": "from-window",
            "windowValue": "from-window",
          },
          Object {
            "defaultValue": "from-default",
            "isFromStorage": false,
            "path": "batman",
            "storageValue": null,
            "type": "string",
            "value": "from-default",
            "windowValue": null,
          },
        ]
      `);
    });

    it("should be able to reset the store", () => {
      // Have some localstorage values before
      expect(result.current.fields.reduce((mem, field) => mem || field.isFromStorage, false)).toEqual(true);

      // Reset
      act(() => result.current.reset());

      // No more locastorage values
      expect(result.current.fields.reduce((mem, field) => mem || field.isFromStorage, false)).toEqual(false);
    });
    it("should proxy setConfig", () => {
      act(() => {
        result.current.setConfig("isBadass", false);
      });

      expect(result.current.fields.find(f => f.path === "isBadass")).toEqual({
        defaultValue: null,
        isFromStorage: true, // <-
        path: "isBadass",
        storageValue: false, // <-
        type: "boolean",
        value: false, // <-
        windowValue: true,
      });
    });
  });

  describe("getAllConfig", () => {
    it("should return all the config available", () => {
      const { getAllConfig } = createConfig<IConfig>({ namespace: "test", storage });

      expect(getAllConfig()).toEqual({
        aBoolean: true,
        donald: "b",
        foo: "from-window",
        loulou: "d",
        picsou: "a",
        riri: "c",
      });
    });

    it("should return an empty config if window is undefined", () => {
      const { getAllConfig } = createConfig<IConfig>({ namespace: "unknown", storage });

      expect(getAllConfig()).toEqual({});
    });
  });
});
