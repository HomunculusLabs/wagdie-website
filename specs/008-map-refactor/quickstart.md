# Map Refactoring Quickstart

**Created**: 2025-11-05
**Related**: [Feature Specification](./spec.md) | [Implementation Plan](./plan.md)

## Overview

The map codebase has been refactored from a single 735-line component into modular, reusable components. This guide helps you understand the new architecture and common workflows.

## Architecture Overview

### Component Hierarchy

```
SimpleMap (orchestrator)
├── LayerController (state management)
│   └── MarkerComponent (rendering)
│       ├── IconFactory (icon creation)
│       ├── PopupRenderer (popup UI)
│       └── TooltipRenderer (tooltip UI)
└── LayerControls (UI toggles)
```

### Key Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Reusability**: Shared components eliminate code duplication
3. **Testability**: Components can be tested in isolation
4. **Performance**: Memoization prevents unnecessary re-renders

## Development Workflows

### Adding a New Marker Type

1. **Create the marker component**:
   ```typescript
   // components/map/markers/NewEventMarker.tsx
   export const NewEventMarker: React.FC<NewEventMarkerProps> = (props) => {
     return (
       <MarkerComponent
         {...props}
         type="newEvent"
         iconUrl="/images/map-icons/icon_new_event.png"
       />
     );
   };
   ```

2. **Add type definitions**:
   ```typescript
   // contracts/marker-component.ts
   export interface NewEventMarkerProps extends BaseMarkerProps {
     type: 'newEvent';
     data: NewEventData;
   }
   ```

3. **Update layer visibility**:
   ```typescript
   // hooks/map/useMapLayers.ts
   const [layers, setLayers] = useState<LayerVisibility>({
     locations: true,
     characters: true,
     burns: true,
     deaths: true,
     fights: true,
     newEvents: true, // Add new layer
   });
   ```

4. **Create tests**:
   ```typescript
   // tests/map/components/NewEventMarker.test.tsx
   describe('NewEventMarker', () => {
     it('renders correctly', () => {
       // Test implementation
     });
   });
   ```

### Modifying Marker Styling

1. **For icons**: Update `IconFactory`:
   ```typescript
   // components/map/IconFactory.ts
   const iconConfigs: Record<IconType, IconConfig> = {
     location: {
       baseSize: [32, 32],
       iconUrl: '/images/map-icons/icon_location.png',
       // ... existing config
     },
     // Update existing or add new config
   };
   ```

2. **For popups**: Update `PopupRenderer`:
   ```typescript
   // components/map/PopupRenderer.tsx
   const buildLocationContent = (location: Location): PopupContent => {
     return {
       title: location.name,
       description: location.description,
       // ... styling updates apply to all markers
     };
   };
   ```

3. **For tooltips**: Update `TooltipRenderer`:
   ```typescript
   // components/map/TooltipRenderer.tsx
   const styles: TooltipStyles = {
     backgroundColor: '#1a1a1a',
     color: '#e8e8e8',
     // ... updates affect all tooltips
   };
   ```

### Modifying Layer Controls

1. **Update layer configuration**:
   ```typescript
   // contracts/layer-controller.ts
   const layerConfigs: LayerConfig[] = [
     {
       key: 'locations',
       label: 'Locations',
       iconPath: '/images/map-icons/icon_location.png',
       defaultVisible: true,
       keyboardShortcut: 'l',
     },
     // ... add or modify layer config
   ];
   ```

2. **Update UI component**:
   ```typescript
   // components/map/LayerControls.tsx
   return (
     <div className="layer-controls">
       {layerConfigs.map((config) => (
         <label key={config.key}>
           <img src={config.iconPath} alt={config.label} />
           <span>{config.label}</span>
           <input
             type="checkbox"
             checked={layers[config.key]}
             onChange={() => toggleLayer(config.key)}
           />
         </label>
       ))}
     </div>
   );
   ```

## Testing

### Unit Tests

Test components in isolation:

```bash
# Run component tests
npm test MarkerComponent.test.tsx

# Run icon factory tests
npm test IconFactory.test.ts

# Run popup/tooltip tests
npm test PopupRenderer.test.tsx
```

### Integration Tests

Test end-to-end flows:

```bash
# Run map integration tests
npm test map-page.test.tsx
```

### Performance Testing

```bash
# Run performance benchmarks
npm run test:performance

# Check bundle size
npm run analyze:bundle
```

## Common Patterns

### Pattern 1: Extracting Shared Logic

If you find duplicate code across marker types:

1. Identify the common pattern
2. Create a shared utility or component
3. Update marker components to use shared implementation
4. Add tests for the shared component

### Pattern 2: Adding New Props

When adding props to marker components:

1. Update the TypeScript interface in `contracts/`
2. Add prop to base component if shared
3. Update specific marker types if needed
4. Update tests to cover new prop
5. Update documentation

### Pattern 3: Optimizing Re-renders

When performance issues arise:

1. Check if props are stable (use React.memo)
2. Memoize expensive computations (useMemo)
3. Cache icon creation (IconFactory)
4. Split context providers if state is large

## Troubleshooting

### Issue: Marker not rendering

**Checklist**:
- [ ] Layer is visible in LayerVisibility state
- [ ] Position coordinates are valid numbers
- [ ] Icon URL is correct and accessible
- [ ] No console errors in React-Leaflet

### Issue: Slow performance

**Checklist**:
- [ ] Icons are being memoized (check IconFactory cache)
- [ ] Components are using React.memo correctly
- [ ] Large lists are not re-rendering entirely
- [ ] Event handlers are stable (useCallback)

### Issue: TypeScript errors

**Checklist**:
- [ ] All props match interface definitions in `contracts/`
- [ ] Type assertions are correct for union types
- [ ] Import paths are correct for shared types

## Migration Guide (From Old Code)

### Before (Old Pattern)
```typescript
// Old SimpleMap.tsx
const locationMarkers = useMemo(() => {
  return locations.map((location) => {
    // Inline icon creation
    const icon = L.icon({
      iconUrl: '/images/map-icons/icon_location.png',
      // ... size calculations
    });

    // Inline popup
    return (
      <Marker position={center} icon={icon}>
        <Popup>
          <div style={{ /* inline styles */ }}>
            <h3>{location.name}</h3>
            {/* ... */}
          </div>
        </Popup>
      </Marker>
    );
  });
}, [locations]);
```

### After (New Pattern)
```typescript
// New SimpleMap.tsx
const { visibleMarkers } = useLayerController({
  locations,
  // ... other markers
});

return (
  <MarkerComponent
    type="location"
    data={location}
    position={center}
    onClick={handleClick}
  />
);
```

## Best Practices

1. **Keep components small**: Aim for <200 lines per component
2. **Use TypeScript strictly**: No `any` types without justification
3. **Test edge cases**: Empty data, loading states, errors
4. **Document decisions**: Add comments for non-obvious logic
5. **Maintain accessibility**: Preserve ARIA attributes and keyboard navigation
6. **Follow WAGDIE theming**: Use consistent fonts and colors from design system

## Resources

- [React-Leaflet Documentation](https://react-leaflet.js.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Project Constitution](../.specify/memory/constitution.md)
- [Feature Specification](./spec.md)
