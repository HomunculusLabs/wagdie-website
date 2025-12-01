# Map Refactor Testing Guide

## Overview

This document describes the testing strategy, architecture, and guidelines for the map refactoring project. The test suite provides **100+ passing tests with 87.62% coverage**.

## Testing Philosophy

Following the **Test-Driven Development (TDD)** approach and **Clean Architecture** principles:

- **Unit Tests**: Test individual components in isolation with comprehensive mocking
- **Integration Tests**: Test component interactions (currently in `tests/TODO-integration/`)
- **Performance Tests**: Verify rendering and computation speed requirements
- **Verification Tests**: Ensure shared components are used consistently

## Test Structure

```
tests/
├── map/
│   ├── components/          # Unit tests for map components
│   │   ├── IconFactory.test.ts
│   │   ├── PopupRenderer.test.tsx
│   │   ├── TooltipRenderer.test.tsx
│   │   ├── MarkerComponent.test.tsx
│   │   ├── LayerController.test.tsx
│   │   ├── performance-tests.test.tsx
│   │   └── *-verification.test.tsx  # Verify shared component usage
│   ├── integration/         # Integration tests (TODO)
│   └── e2e/                 # End-to-end tests (TODO)
├── utils/
│   └── leaflet-mocks.ts     # Mock utilities for Leaflet components
└── README.md               # This file
```

## Test Coverage

### Current Coverage (87.62%)

| Component | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| IconFactory.ts | 100% | 83.33% | 100% | 100% |
| LayerController.tsx | 89.18% | 20% | 90.9% | 87.09% |
| MarkerComponent.tsx | 81.81% | 81.48% | 73.68% | 84.61% |
| PopupRenderer.tsx | 77.77% | 95% | 71.42% | 81.25% |
| TooltipRenderer.tsx | 90.9% | 100% | 100% | 100% |

**Target**: 90%+ coverage for all components

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage Report
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- IconFactory.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

## Mock Strategy

### Leaflet Mocks

All Leaflet components are mocked in `jest.setup.js` to enable isolated unit testing:

```javascript
// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }) => (
    <div data-testid="leaflet-marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  // ... other mocks
}));
```

### Usage in Tests

All tests automatically use these mocks via `jest.setup.js`. No manual mocking required:

```typescript
import { render, screen } from '@testing-library/react';
import MarkerComponent from '@/components/map/MarkerComponent';

// Mock is automatically applied
render(<MarkerComponent {...props} />);
expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
```

## Performance Testing

### Requirements

- **MarkerComponent**: Must render in < 100ms
- **IconFactory**: Must create icon in < 50ms
- **LayerController**: Must toggle layer in < 50ms

### Running Performance Tests

```bash
npm test -- performance-tests.test.tsx
```

### Performance Test Example

```typescript
it('should render MarkerComponent in under 100ms', () => {
  const startTime = performance.now();
  render(<MarkerComponent {...props} />);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(100);
});
```

## Component Testing Patterns

### 1. Testing Rendered Output

```typescript
import { render, screen } from '@testing-library/react';

it('should render tooltip with correct content', () => {
  const content = { title: 'Test', subtitle: 'Subtitle' };
  render(<TooltipRenderer type="location" content={content} />);

  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('Subtitle')).toBeInTheDocument();
});
```

### 2. Testing Props and Callbacks

```typescript
import { render, fireEvent } from '@testing-library/react';

it('should call onClick when marker is clicked', () => {
  const onClick = jest.fn();
  render(<MarkerComponent {...props} onClick={onClick} />);

  fireEvent.click(screen.getByTestId('leaflet-marker'));
  expect(onClick).toHaveBeenCalled();
});
```

### 3. Testing React.memo Optimization

```typescript
it('should not re-render when props are unchanged', () => {
  const { rerender } = render(<MarkerComponent {...props} />);
  rerender(<MarkerComponent {...props} />);

  // Component should be memoized and not re-render
  expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
});
```

## Best Practices

### DO ✅

1. **Use descriptive test names**: "should render tooltip with WAGDIE theming"
2. **Test one thing per test**: Each test should verify one behavior
3. **Use data-testid attributes**: For reliable element selection
4. **Mock external dependencies**: Leaflet, wagmi, etc.
5. **Test edge cases**: Empty data, null values, error states
6. **Use `screen` from @testing-library/react**: More reliable than container queries

### DON'T ❌

1. **Don't test implementation details**: Focus on behavior, not internals
2. **Don't use jQuery selectors**: Use `screen.getBy*` queries instead
3. **Don't mock what you're testing**: Don't mock the component itself
4. **Don't forget to clean up**: Use `jest.clearAllMocks()` in `beforeEach`
5. **Don't ignore accessibility**: Test with proper ARIA labels

## Debugging Tests

### Common Issues

1. **"Unable to find element" errors**
   - Check data-testid matches mock
   - Verify component is rendering

2. **Type errors in tests**
   - Mock types in `jest.setup.js`
   - Use `any` type for complex mocks

3. **Performance test flakiness**
   - Use `performance.now()` for timing
   - Run tests in isolation

### Debug Commands

```bash
# Run specific test with verbose output
npm test -- --testNamePattern="should render" --verbose

# Run tests with coverage and watch mode
npm test -- --coverage --watch

# Run tests without caching
npm test -- --no-cache
```

## Continuous Integration

Tests run automatically on:
- Every commit (GitHub Actions)
- Pull request creation
- Coverage reports published to coveralls

### Coverage Thresholds

- **Statements**: 90% minimum
- **Branches**: 80% minimum
- **Functions**: 90% minimum
- **Lines**: 90% minimum

## Future Improvements

### TODO Integration Tests

Move from `tests/TODO-integration/` when services are implemented:

1. **useLocations hook**
2. **useCharacterLocation hook**
3. **useLocationStaking hook**
4. **locationService**
5. **wagdieWorldContract**

### E2E Tests (Playwright)

Add E2E tests for critical user flows:

1. **Map navigation**
2. **Character staking**
3. **Layer toggling**
4. **Responsive behavior**

## Contributing

When adding new components:

1. **Write tests first** (TDD)
2. **Achieve 90%+ coverage**
3. **Add performance tests** for heavy components
4. **Document test patterns** in this file
5. **Run full test suite** before committing

## Resources

- [Testing Library Documentation](https://testing-library.com/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
