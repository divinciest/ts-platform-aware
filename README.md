# ts-platform-aware

A TypeScript utility library for managing cross-platform code targeting web and Node.js environments.

## Repository URL

[https://github.com/divinciest/ts-platform-aware](https://github.com/divinciest/ts-platform-aware)

## Overview

This repository contains a single file, `platform.ts`, which provides a set of decorators and utility functions to help manage code that needs to run on different platforms (web browsers and Node.js). It allows developers to write platform-specific code and ensure it's only executed in the appropriate environment.

## Features

- Platform detection (web, node, or unknown)
- Decorators for platform-specific methods, properties, and classes
- Utility functions for platform-specific code execution
- Cross-platform method and property decorators
- Platform assertion functionality
- Support for simulating different platforms (useful for testing)

## Usage

To use this library in your TypeScript project, you can import the necessary functions and decorators from the `platform.ts` file:

```typescript
import {
  platformSpecificMethod,
  platformSpecificProperty,
  platformSpecificClass,
  crossPlatformMethod,
  crossPlatformProperty,
  isWeb,
  isNode,
  assertPlatform,
  // ... other imports as needed
} from './platform';
```

### Examples

1. Creating a platform-specific method:

```typescript
class MyClass {
  @platformSpecificMethod('web')
  webOnlyMethod() {
    console.log('This method only runs in web environments');
  }
}
```

2. Creating a platform-specific property:

```typescript
class MyClass {
  @platformSpecificProperty('node')
  nodeOnlyProperty: string = 'This property is only accessible in Node.js';
}
```

3. Creating a platform-specific class:

```typescript
@platformSpecificClass('web')
class WebOnlyClass {
  // This class can only be instantiated in web environments
}
```

4. Using utility functions:

```typescript
if (isWeb()) {
  // Web-specific code
} else if (isNode()) {
  // Node.js-specific code
}

assertPlatform('web'); // Throws an error if not running in a web environment
```

## Contributing

Contributions to improve the `platform.ts` file or expand its functionality are welcome. Please submit issues or pull requests through the GitHub repository.

## License

[MIT License](https://opensource.org/licenses/MIT)