/* eslint-disable @typescript-eslint/no-explicit-any */

import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import { Mock } from "ts-mockery";

import createConfig from ".";
import { renderHook, act } from "@testing-library/react-hooks";
import { ConfigOptions } from "./types";

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
  const namespace = "test";
  const createConfigWithDefaults = (
    config: Pick<Partial<ConfigOptions<never, "">>, "localOverride" | "namespace"> = {},
  ) =>
    createConfig({
      namespace,
      storage,
      schema: {
        color: {
          type: "string",
          enum: ["blue" as const, "green" as const, "pink" as const],
          description: "Main color of the application",
        },
        backend: {
          type: "string",
          description: "Backend url",
        },
        port: {
          type: "number",
          description: "Backend port",
          min: 1,
          max: 65535,
          default: 8000,
        },
        monitoringLink: {
          type: "custom",
          description: "Link of the monitoring",
          parser: value => {
            if (typeof value === "object" && typeof value.url === "string" && typeof value.displayName === "string") {
              return {
                url: value.url as string,
                displayName: value.displayName as string,
              };
            }
            throw new Error("Monitoring link invalid!");
          },
        },
        isLive: {
          type: "boolean",
          default: false,
        },
        isAwesome: {
          type: "boolean",
        },
      },
      ...config,
    });

  beforeEach(() => {
    set(window, namespace, {
      color: "blue",
      backend: "http://localhost",
      monitoringLink: {
        url: "http://localhost:5000",
        displayName: "Monitoring",
      },
      isAwesome: true,
    });
  });
  afterEach(() => {
    act(() => storage.clear());
    delete (window as any)[namespace];
  });

  it("should throw if a window value don't fit the schema", () => {
    set(window, `${namespace}.color`, "red");
    expect(() => createConfigWithDefaults()).toThrowErrorMatchingInlineSnapshot(
      `"Config key \\"color\\" not valid: red not part of [\\"blue\\", \\"green\\", \\"pink\\"]"`,
    );
  });

  describe("getConfig", () => {
    it("should return the default value", () => {
      const { getConfig } = createConfigWithDefaults();
      expect(getConfig("port")).toBe(8000);
    });

    it("should return the default value (function)", () => {
      let port = 8000;
      const getPort = () => port;
      const { getConfig } = createConfig({
        namespace,
        storage,
        schema: {
          port: {
            type: "number",
            default: getPort,
          },
        },
      });
      expect(getConfig("port")).toBe(8000);
      port = 9000;
      expect(getConfig("port")).toBe(9000);
    });

    it("should return the window default", () => {
      const { getConfig } = createConfigWithDefaults();
      expect(getConfig("color")).toBe("blue");
    });

    it("should return a custom parsed value", () => {
      const { getConfig } = createConfigWithDefaults();
      const monitoringLink = getConfig("monitoringLink");
      expect(monitoringLink.url).toBe("http://localhost:5000");
      expect(monitoringLink.displayName).toBe("Monitoring");
    });

    it("should return the localstorage value (storage set before)", () => {
      storage.setItem(`${namespace}.color`, "pink");
      const { getConfig } = createConfigWithDefaults();
      expect(getConfig("color")).toBe("pink");
    });

    it("should return the localstorage value (storage set after)", () => {
      const { getConfig } = createConfigWithDefaults();
      storage.setItem(`${namespace}.color`, "pink");
      expect(getConfig("color")).toBe("pink");
    });

    it("should return the localstorage value (with setConfig)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      setConfig("color", "green");
      expect(getConfig("color")).toBe("green");
    });

    it("should ignore the storage value (localOverride=false)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults({
        localOverride: false,
      });
      setConfig("color", "green");
      expect(getConfig("color")).toBe("blue");
    });

    it("should throw on corrupted window value", () => {
      const { getConfig } = createConfigWithDefaults();
      set(window, `${namespace}.color`, 42);
      expect(() => getConfig("color")).toThrowError(`Config key "color" not valid: not a string`);
    });

    it("should ignore corrupted storage value", () => {
      const { getConfig } = createConfigWithDefaults();
      storage.setItem(`${namespace}.color`, "42");
      expect(getConfig("color")).toBe("blue");
    });
  });

  describe("getAllConfig", () => {
    it("should return the entire consolidate configuration", () => {
      const { getAllConfig, setConfig } = createConfigWithDefaults();
      setConfig("color", "green");

      expect(getAllConfig()).toMatchInlineSnapshot(`
        Object {
          "backend": "http://localhost",
          "color": "green",
          "isAwesome": true,
          "isLive": false,
          "monitoringLink": Object {
            "displayName": "Monitoring",
            "url": "http://localhost:5000",
          },
          "port": 8000,
        }
      `);
    });
  });

  describe("setConfig", () => {
    it("should set a value (enum)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("color")).toBe("blue");
      setConfig("color", "pink");
      expect(getConfig("color")).toBe("pink");
    });

    it("should set a value (string)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("backend")).toBe("http://localhost");
      setConfig("backend", "https://local");
      expect(getConfig("backend")).toBe("https://local");
    });

    it("should set a value (number)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("port")).toBe(8000);
      setConfig("port", 42);
      expect(getConfig("port")).toBe(42);
    });

    it("should set a value (boolean=true)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("isLive")).toBe(false);
      setConfig("isLive", true);
      expect(getConfig("isLive")).toBe(true);
    });

    it("should set a value (boolean=false)", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("isAwesome")).toBe(true);
      setConfig("isAwesome", false);
      expect(getConfig("isAwesome")).toBe(false);
    });

    it("should remove the localstorage value if same as the window one", () => {
      const { setConfig } = createConfigWithDefaults();
      // Add a custom value
      setConfig("isAwesome", false);
      expect(storage.getItem("test.isAwesome")).toBe("false");

      // Set back the default value
      setConfig("isAwesome", true);
      expect(storage.getItem("test.isAwesome")).toBe(null);
    });

    it("should remove the localstorage value if same as the default one", () => {
      const { setConfig } = createConfigWithDefaults();
      // Add a custom value
      setConfig("isLive", true);
      expect(storage.getItem("test.isLive")).toBe("true");

      // Set back the default value
      setConfig("isLive", false);
      expect(storage.getItem("test.isLive")).toBe(null);
    });

    it("should throw if the type is not respected", () => {
      const { setConfig } = createConfigWithDefaults();
      expect(() => setConfig("port", "yolo" as any)).toThrowErrorMatchingInlineSnapshot(
        `"Expected \\"port=yolo\\" to be a \\"number\\""`,
      );
    });

    it("should throw if the min value is not respected", () => {
      const { setConfig } = createConfigWithDefaults();
      expect(() => setConfig("port", -1)).toThrowErrorMatchingInlineSnapshot(
        `"Expected \\"port=-1\\" to be greater than 1"`,
      );
    });

    it("should throw if the max value is not respected", () => {
      const { setConfig } = createConfigWithDefaults();
      expect(() => setConfig("port", 100000)).toThrowErrorMatchingInlineSnapshot(
        `"Expected \\"port=100000\\" to be lower than 65535"`,
      );
    });

    it("should throw if the enum value is not respected", () => {
      const { setConfig } = createConfigWithDefaults();
      expect(() => setConfig("color", "red" as any)).toThrowErrorMatchingInlineSnapshot(
        `"Expected \\"color=red\\" to be one of: blue, green, pink"`,
      );
    });

    it("should throw if the value is not respecting a custom parser", () => {
      const { setConfig } = createConfigWithDefaults();
      expect(() => setConfig("monitoringLink", "red" as any)).toThrowErrorMatchingInlineSnapshot(
        `"Monitoring link invalid!"`,
      );
    });
  });

  describe("useConfig", () => {
    it("should return the correct value from getConfig", () => {
      const { useConfig } = createConfigWithDefaults();
      const { result } = renderHook(useConfig);
      const color = result.current.getConfig("color");
      expect(color).toBe("blue");
    });

    it("should return the correct value after setConfig", () => {
      const { useConfig } = createConfigWithDefaults();
      const { result } = renderHook(useConfig);
      act(() => result.current.setConfig("color", "green"));
      const color = result.current.getConfig("color");
      expect(color).toBe("green");
    });

    it("should be able to get all the config", () => {
      const { useConfig } = createConfigWithDefaults();
      const { result } = renderHook(useConfig);
      act(() => result.current.setConfig("color", "green"));
      const all = result.current.getAllConfig();
      expect(all).toMatchInlineSnapshot(`
        Object {
          "backend": "http://localhost",
          "color": "green",
          "isAwesome": true,
          "isLive": false,
          "monitoringLink": Object {
            "displayName": "Monitoring",
            "url": "http://localhost:5000",
          },
          "port": 8000,
        }
      `);
    });

    it("should return namespaced method", () => {
      const { useConfig } = createConfig({
        namespace,
        schema: {
          oh: { type: "string", default: "yeah" },
        },
        useConfigNamespace: "boom",
      });
      const { result } = renderHook(useConfig);
      const { getAllBoomConfig, getBoomConfig, setBoomConfig } = result.current;

      expect(typeof getAllBoomConfig).toBe("function");
      expect(typeof getBoomConfig).toBe("function");
      expect(typeof setBoomConfig).toBe("function");

      expect(getBoomConfig("oh")).toBe("yeah");
      act(() => setBoomConfig("oh", "popopo"));
      expect(getAllBoomConfig()).toMatchInlineSnapshot(`
        Object {
          "oh": "popopo",
        }
      `);
    });
  });

  describe("useAdminConfig", () => {
    it("should send back the namespace", () => {
      const { useAdminConfig } = createConfigWithDefaults();
      const { result } = renderHook(useAdminConfig);
      expect(result.current.namespace).toBe("test");
    });

    it("should have all the metadata about a field", () => {
      const { useAdminConfig } = createConfigWithDefaults();
      storage.setItem(`${namespace}.color`, "pink");
      const { result } = renderHook(useAdminConfig);
      const color = result.current.fields.find(({ key }) => key === "color");

      expect(color).toMatchInlineSnapshot(`
        Object {
          "description": "Main color of the application",
          "enum": Array [
            "blue",
            "green",
            "pink",
          ],
          "isFromStorage": true,
          "key": "color",
          "path": "test.color",
          "set": [Function],
          "storageValue": "pink",
          "type": "string",
          "value": "pink",
          "windowValue": "blue",
        }
      `);
    });

    it("should be able to set some fields or reset everything", () => {
      const { useAdminConfig } = createConfigWithDefaults();
      const { result } = renderHook(useAdminConfig);
      // Set some values
      result.current.fields.forEach(field => {
        if (field.key === "backend") {
          act(() => field.set("http://my-app.com"));
        }
        if (field.type === "number") {
          act(() => field.set(42));
        }
      });

      // Check the resulting state
      result.current.fields.forEach(field => {
        if (field.key === "backend") {
          expect(field.windowValue).toBe("http://localhost");
          expect(field.value).toBe("http://my-app.com");
          expect(field.storageValue).toBe("http://my-app.com");
          expect(field.isFromStorage).toBe(true);
        } else if (field.type === "number") {
          expect(field.storageValue).toBe(42);
          expect(field.value).toBe(42);
          expect(field.isFromStorage).toBe(true);
        } else {
          expect(field.isFromStorage).toBe(false);
        }
      });

      // Reset the store
      act(() => result.current.reset());

      // Check if everything is reset
      result.current.fields.forEach(field => {
        expect(field.isFromStorage).toBe(false);
        expect(field.storageValue).toBe(null);
      });
    });
  });
});
