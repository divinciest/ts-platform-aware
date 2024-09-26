/**
 * @fileoverview This module provides decorators and utility functions for managing cross-platform code.
 * The target platforms are defined as 'web', 'node', or 'unknown'.
 */

/** The platforms the code can run on. */
type TargetPlatformType = 'web' | 'node';
type PlatformType = TargetPlatformType | 'unknown';
type SimulatedPlatformType = PlatformType | undefined;

/** Toggle to enable or disable platform-specific logic. */
const enabled = true;
let simulatedPlatform: SimulatedPlatformType = undefined;

const crossPlatformSymbol = Symbol('crossPlatform');
const platformSpecificSymbol = Symbol('platformSpecificMethod');

/**
 * Determine the platform on which the code is running.
 * @returns {PlatformType} The current platform: 'web', 'node', or 'unknown'.
 */ const getCurrentPlatform: () => PlatformType = (): PlatformType => {
  if (simulatedPlatform) return simulatedPlatform;

  if (typeof window !== 'undefined') return 'web';

  if (typeof global?.process?.versions?.node !== 'undefined') return 'node';

  return 'unknown';
};

const setCurrentPlatform = (target: SimulatedPlatformType): boolean => {
  simulatedPlatform = target;
  return simulatedPlatform !== undefined;
};

/**
 * Defines a generic method type.
 * @template T The types of the method's arguments.
 * @template R The return type of the method.
 */
type MethodType<T extends unknown[], R> = (...args: T) => R;

/**
 * Defines a method decorator.
 * @template T The types of the method's arguments.
 * @template R The return type of the method.
 * @param {Record<string, any>} target The target object.
 * @param {string} propertyKey The key for the method.
 * @param {TypedPropertyDescriptor<MethodType<T, R>>} descriptor The property descriptor.
 */
type MethodDecorator<T extends unknown[], R> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: Record<string, any>,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<MethodType<T, R>>,
) => void;

/**
 * A decorator that marks methods as cross-platform.
 * @template T The types of the method's arguments.
 * @template R The return type of the method.
 * @returns {MethodDecorator<T, R>}
 */

function crossPlatformMethod<T extends unknown[], R>(): MethodDecorator<T, R> {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor: Record<string, any>,
    propertyKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    descriptor: TypedPropertyDescriptor<MethodType<T, R>>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    constructor[propertyKey][crossPlatformSymbol] = true;
  };
}

/**
 * A decorator that marks methods as platform-specific.
 * @template T The types of the method's arguments.
 * @template R The return type of the method.
 * @param {TargetPlatformType} platform The platform on which the method can run.
 * @returns {MethodDecorator<T, R>} A method decorator.
 */
function platformSpecificMethod<T extends unknown[], R>(
  platform: TargetPlatformType,
): MethodDecorator<T, R> {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: Record<string, any>,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<MethodType<T, R>>,
  ) {
    const originalMethod = descriptor.value;
    if (!enabled) {
      return originalMethod;
    }
    if (!originalMethod) {
      throw new Error(
        `platformSpecificMethod decorator should be applied on methods only.`,
      );
    }
    if (
      typeof descriptor.value === 'function' &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (descriptor as any).value[crossPlatformSymbol]
    ) {
      return;
    }
    descriptor.value = function (...args: T): R {
      assertPlatform(
        platform,
        `Method ${propertyKey} can only be called in a ${platform} environment, current platform is ${getCurrentPlatform()}.`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: R = originalMethod.apply(this, args);
      return result;
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (descriptor.value as any)[platformSpecificSymbol] = true;
  };
}

/**
 * Defines the type of a platform-specific function.
 * @template T The types of the function's arguments.
 * @template R The return type of the function.
 */
type PlatformSpecificFuncType<T extends unknown[], R> = (...args: T) => R;

/**
 * Convert a regular function into a platform-specific function.
 * @template T The types of the function's arguments.
 * @template R The return type of the function.
 * @param {TargetPlatformType} platform The platform on which the function can run.
 * @param {PlatformSpecificFuncType<T, R>} func The function to make platform-specific.
 * @returns {PlatformSpecificFuncType<T, R>} The platform-specific function.
 */
function makePlatformSpecific<T extends unknown[], R>(
  platform: TargetPlatformType,
  func: PlatformSpecificFuncType<T, R>,
): PlatformSpecificFuncType<T, R> {
  const originalFunc = func;
  if (!enabled) {
    return originalFunc;
  }
  func = (...args: T): R => {
    assertPlatform(
      platform,
      `Function ${
        originalFunc.name
      } can only be called in a ${platform} environment, current platform is ${getCurrentPlatform()}.`,
    );
    return originalFunc(...args);
  };
  return func;
}

/**
 * Defines the type of a property.
 */
type PropertyType = unknown;

/**
 * Defines a property decorator.
 * @template T The type of the property.
 * @param {Record<string, any>} target The target object.
 * @param {string} propertyKey The key for the property.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PropertyDecorator<T extends PropertyType> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: Record<string, any>,
  propertyKey: string,
) => void;

/** Stores the properties that are marked as cross-platform. */
const platformSpecificProperties: Record<string, Set<PropertyKey>> = {};
const crossPlatformProperties: Record<string, Set<PropertyKey>> = {};

function addToCrossPlatformProperties(className: string, propertyKey: string) {
  if (!crossPlatformProperties[className]) {
    crossPlatformProperties[className] = new Set();
  }
  // Add the property to the class's Set
  crossPlatformProperties[className].add(propertyKey);
}
function addToPlatformSpecificProperties(
  className: string,
  propertyKey: string,
) {
  if (!platformSpecificProperties[className]) {
    platformSpecificProperties[className] = new Set();
  }
  // Add the property to the class's Set
  platformSpecificProperties[className].add(propertyKey);
}

function isInPlatformSpecificProperties(
  className: string,
  propertyKey: string,
) {
  if (!platformSpecificProperties[className]) {
    platformSpecificProperties[className] = new Set();
  }
  return platformSpecificProperties[className].has(propertyKey);
}

function isInCrossPlatformProperties(className: string, propertyKey: string) {
  if (!crossPlatformProperties[className]) {
    crossPlatformProperties[className] = new Set();
  }
  return crossPlatformProperties[className].has(propertyKey);
}

/**
 * A decorator that marks properties as cross-platform.
 * @template T The type of the property.
 * @returns {PropertyDecorator<T>}
 */
function crossPlatformProperty<T extends PropertyType>(): PropertyDecorator<T> {
  return (target, propertyKey) => {
    addToCrossPlatformProperties(target.constructor.name, propertyKey);
  };
}

/**
 * A decorator that marks properties as platform-specific.
 * @template T The type of the property.
 * @param {TargetPlatformType} platform The platform on which the property can be accessed.
 * @returns {PropertyDecorator<T>} A property decorator.
 */
function platformSpecificProperty<T extends PropertyType>(
  platform: TargetPlatformType,
): PropertyDecorator<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: Record<string, any>, propertyKey: string) {
    if (enabled) {
      let value: T = target[propertyKey] as T;
      const className = target.constructor.name; // This is the class name

      if (isInCrossPlatformProperties(className, propertyKey)) {
        return; // Skip properties marked as cross-platform
      }
      addToPlatformSpecificProperties(className, propertyKey);

      Object.defineProperty(target, propertyKey, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        get: function () {
          if (enabled && platform != getCurrentPlatform()) {
            throw new Error(
              `Property ${propertyKey} of type ${className} can only be accessed in a ${platform} environment, current environment is ${getCurrentPlatform()}.`,
            );
          }

          return value;
        },
        set: function (newValue: T) {
          value = newValue;
        },
      });
    }
  };
}

/**
/**
 * A decorator that marks a class as platform-specific.
 * @param {TargetPlatformType} platform The platform on which the class can be used.
 * @returns {ClassDecorator} A class decorator.
 */
function platformSpecificClass(platform: TargetPlatformType): ClassDecorator {
  return function (constructor: { prototype: Record<string, unknown> }) {
    // A utility function to generate instances of a class
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function construct(constructor: any, args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const instance: any = Reflect.construct(constructor, args);

      const instanceProperties = Object.getOwnPropertyNames(instance);
      const prototypeProperties = Object.getOwnPropertyNames(
        Object.getPrototypeOf(instance),
      );
      const allProperties = [...instanceProperties, ...prototypeProperties];

      // Loop over the properties of the instance and apply platform-specific property decorator
      for (const key of allProperties) {
        // Skip anything marked as cross-platform

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const className: string = constructor.name; // This is the class name
        // this should be checked before accessing property or we may risk exception being thrown
        if (
          !(
            isInCrossPlatformProperties(className, key) ||
            isInPlatformSpecificProperties(className, key)
          )
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const alreadyDecorated = (instance[key][crossPlatformSymbol] ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            instance[key][platformSpecificSymbol]) as boolean;
          if (!alreadyDecorated) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-explicit-any
            if ((typeof (instance as any)[key] as string) === 'function') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const originalMethod = instance[key];
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
              instance[key] = function (...args: any): any {
                assertPlatform(
                  platform,
                  `Method ${key} can only be called in a ${platform} environment, current platform is ${getCurrentPlatform()}.`,
                );
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                const result: any = originalMethod.apply(this, args);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return result;
              };
            } else {
              // Skip properties marked as cross-platform
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              let value = instance[key];
              Object.defineProperty(instance, key, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                get: function () {
                  assertPlatform(
                    platform,
                    `Property ${key} of type ${className} can only be accessed in a ${platform} environment, current environment is ${getCurrentPlatform()}.`,
                  );
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                  return value;
                },
                set: function (newValue) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  value = newValue;
                },
              });
            }
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return instance;
    }
    if (enabled) {
      // Hold a reference to the original constructor
      const original = constructor;
      // The new constructor behaviour
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f: any = function (...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return construct(original, args);
      };
      // Copy prototype so instanceof operator still works
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      f.prototype = original.prototype;
      // Return the new constructor (will override the original)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return f;
    }
  };
}

/**
 * Execute a piece of code if the current platform matches the target platform.
 * @template R The return type of the code.
 * @param {TargetPlatformType} targetPlatform The target platform.
 * @param {PlatformSpecificFuncType<[], R>} code The code to execute.
 * @returns {R | undefined} The result of the code if the platform matches, otherwise undefined.
 */
function platformSpecificCode<R>(
  targetPlatform: TargetPlatformType,
  code: PlatformSpecificFuncType<[], R>,
): R | undefined {
  if (!enabled || getCurrentPlatform() === targetPlatform) {
    return code();
  }
}

/**
 * Check if the current platform is 'web'.
 * @returns {boolean} True if the current platform is 'web', otherwise false.
 */
const isWeb: () => boolean = () => getCurrentPlatform() == 'web';

/**
 * Check if the current platform is 'node'.
 * @returns {boolean} True if the current platform is 'node', otherwise false.
 */
const isNode: () => boolean = () => getCurrentPlatform() == 'node';

/**
 * Defines a map for platform-specific functions.
 * Each function is mapped to a platform type ('web', 'node', 'unknown').
 */
type PlatformSpecificFunctionMap = {
  [K in PlatformType]?: () => unknown;
};

/**
 * Execute a function based on the current platform.
 * @param {PlatformSpecificFunctionMap} map A map of platform-specific functions.
 * @returns {unknown} The result of the function that corresponds to the current platform, if it exists.
 * @throws {Error} If there is no function corresponding to the current platform.
 */
function switchPlatform(map: PlatformSpecificFunctionMap) {
  const fn = map[getCurrentPlatform()];
  if (!fn) {
    throw new Error(
      `No function specified for platform: ${getCurrentPlatform()}`,
    );
  }
  return fn();
}

/**
 * Asserts that the current platform is the same as the target platform.
 * @param {TargetPlatformType} target The target platform to compare with the current platform.
 * @throws {Error} If the current platform is not the same as the target platform.
 */
function assertPlatform(
  target: TargetPlatformType,
  msg: string | undefined = undefined,
) {
  if (enabled && getCurrentPlatform() !== target) {
    throw new Error(
      msg ? msg : `This code should only run in a ${target} environment.`,
    );
  }
}

/**
 * An abstract class that forces subclasses to specify a platform.
 * Objects of subclasses can only be instantiated in the specified platform.
 */
class PlatformSpecificType {
  /**
   * The constructor checks if the current platform is the same as the target platform.
   * @param {TargetPlatformType} targetPlatform The platform that objects of this class are allowed to run in.
   */
  constructor(targetPlatform: TargetPlatformType) {
    assertPlatform(targetPlatform);
  }
}

/**
 * A subclass of PlatformSpecificType that can only be instantiated in a Node.js environment.
 */
class NodeJsSpecificType extends PlatformSpecificType {
  constructor() {
    super('node');
  }
}

/**
 * A subclass of PlatformSpecificType that can only be instantiated in a Web environment.
 */
class WebSpecificType extends PlatformSpecificType {
  constructor() {
    super('web');
  }
}

// The following is needed to make our decorators work on non-web environment
platformSpecificCode('node', () => {
  if (typeof global.HTMLElement === 'undefined') {
    global.HTMLElement = {} as typeof HTMLElement;
  }
});

export {
  getCurrentPlatform,
  setCurrentPlatform,
  assertPlatform,
  isWeb,
  isNode,
  platformSpecificProperty,
  platformSpecificClass,
  platformSpecificMethod,
  platformSpecificCode,
  crossPlatformMethod,
  crossPlatformProperty,
  makePlatformSpecific,
  switchPlatform,
  PlatformType,
  TargetPlatformType,
  PlatformSpecificFunctionMap,
  SimulatedPlatformType,
  PlatformSpecificType,
  NodeJsSpecificType,
  WebSpecificType,
};
