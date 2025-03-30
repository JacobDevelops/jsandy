# @jsandy/ui

A design system with individually importable components, inspired by Radix with shadcn styling.

## Installation

To install the design system, run the following command:

```bash
npm install @jsandy/ui
```

or if you're using yarn:

```bash
yarn add @jsandy/ui
```

## Usage

This design system provides a wide range of components and utilities that can be imported individually. Here's a basic example of how to use a component:

```jsx
import { Button } from '@jsandy/ui/button';

function MyComponent() {
  return <Button variant="default">Click me</Button>;
}
```

## Available Components

The design system includes the following components:

- Alert
- AlertDialog
- Badge
- Button
- Card
- Checkbox
- Collapsible
- Dialog
- DropdownMenu
- Input
- Label
- Menu
- Pagination
- RadioGroup
- Select
- Separator
- Sheet
- Skeleton
- Switch
- Table
- Tabs
- Textarea
- Toast
- Tooltip

Each component can be imported from its respective path. For example:

```jsx
import { Alert } from '@jsandy/ui/alert';
import { Card } from '@jsandy/ui/card';
```

## Utilities

The design system also provides several utility functions and hooks:

- cn (for combining class names)
- useId
- useCallbackRef
- useControllableState
- useEscapeKeydown
- usePrevious
- useSize
- useDirection
- useLayoutEffect

These can be imported similarly to components:

```jsx
import { cn } from '@jsandy/ui/cn';
import { useId } from '@jsandy/ui/use-id';
```

## Styling

This design system uses Tailwind CSS for styling. The styles are included in the package and can be imported in your project:

```jsx
import '@jsandy/ui/styles';
```

## Development

To start the development environment:

```bash
npm run dev
```

To build the package:

```bash
npm run build
```
