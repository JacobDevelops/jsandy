# @jsandy/rpc

## 2.2.0

### Minor Changes

- 62cdf98: Added Cloudflare Queue Adapter
- 62cdf98: Added client and adapter sub-exports
- 48502a6: Update to allow relative paths for client side api client

## 2.1.2

### Patch Changes

- 84ceb84: Fixed typing issues of client method inputs
- 208a21e: Fix up error handling for nested subrouters

## 2.1.1

### Patch Changes

- 0aa9fe1: revert and fix baseUrl for client

## 2.1.0

### Minor Changes

- 0db8c13: Remove dependance on upstash

### Patch Changes

- db285ec: bump deps
- 3c56aa2: Loosen restrictions on createClient baseUrl param

## 2.0.0

### Major Changes

- ca00ffd: Dropped support for zod v3 to only use zod v4

## 1.2.1

### Patch Changes

- 9bc89b1: Fix Bug Where `.$get` and `.$post` weren't callable for nested routes

## 1.2.0

### Minor Changes

- 8ef5d81: Update to support exposure of open-api schemas

## 1.1.1

### Patch Changes

- 8e986d2: Update files array in package.json and add repository information

## 1.1.0

### Minor Changes

- e792622: Added support for zod v4

### Patch Changes

- dd8963e: Minor Updates of Dependencies
- e792622: Fixed up types to prevent errors from proper usage

## 1.0.0

### Major Changes

- 9f78268: v1 Release

### Minor Changes

- 150d759: Added support for getting the schema of the rpc routers
