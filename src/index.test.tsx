import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import { Mock } from "ts-mockery";

import createConfig from "./";
import { renderHook, act } from "@testing-library/react-hooks";
import { Config } from "./types";

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
  const createConfigWithDefaults = (schema: Record<string, Config> = {}) =>
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
              return { url: value.url as string, displayName: value.displayName as string };
            }
            throw new Error("Monitoring link invalid!");
          },
        },
        ...schema,
      },
    });

  beforeEach(() => {
    set(window, namespace, {
      color: "blue",
      backend: "http://localhost",
      monitoringLink: {
        url: "http://localhost:5000",
        displayName: "Monitoring",
      },
    });
  });
  afterEach(() => {
    act(() => storage.clear());
    delete (window as any)[namespace];
  });

  describe("getConfig", () => {
    it("should return the default value", () => {
      const { getConfig } = createConfigWithDefaults();
      expect(getConfig("port")).toBe(8000);
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

    it("should return the localstorage value (storage set by the lib", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      setConfig("color", "green");
      expect(getConfig("color")).toBe("green");
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
    it("should set a value", () => {
      const { getConfig, setConfig } = createConfigWithDefaults();
      expect(getConfig("color")).toBe("blue");
      setConfig("color", "pink");
      expect(getConfig("color")).toBe("pink");
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
          "monitoringLink": Object {
            "displayName": "Monitoring",
            "url": "http://localhost:5000",
          },
          "port": 8000,
        }
      `);
    });
  });

  describe("useAdminConfig", () => {
    it("should have all the metadata about a field", () => {
      const { useAdminConfig } = createConfigWithDefaults();
      storage.setItem(`${namespace}.color`, "pink");
      const { result } = renderHook(useAdminConfig);
      const color = result.current.fields.find(({ path }) => path === "color");

      expect(color).toMatchInlineSnapshot(`
        Object {
          "description": "Main color of the application",
          "enum": Array [
            "blue",
            "green",
            "pink",
          ],
          "isFromStorage": true,
          "path": "color",
          "set": [Function],
          "storageValue": "pink",
          "type": "string",
          "value": "pink",
          "windowValue": "blue",
        }
      `);
    });
  });
});
