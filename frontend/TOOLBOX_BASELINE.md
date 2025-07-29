# SurveyJS Toolbox Baseline Configuration

## Date: January 7, 2025

## Current Status
We've created a minimal, stable toolbox configuration after experiencing instability with too many custom fields.

## Minimal Configuration
Located in: `src/utils/minimalToolboxConfig.ts`

### Phase 1 - Core Items Only
```javascript
- Text Input (basic, no sub-types)
- Radio Buttons
- Dropdown
- Yes/No (Boolean)
- Long Text (Comment)
```

### Phase 2 - When Stable
```javascript
- Checkboxes
- Rating Scale
```

### Phase 3 - Healthcare Items (Add One at a Time)
```javascript
- Digital Signature
- File Upload
- Patient Demographics
- Medication List
- Body Pain Diagram
```

## Key Learnings

### What Caused Instability
1. **Clearing ALL default toolbox items** - This broke SurveyJS internals
2. **Too many custom complex items at once** - Especially panels with nested elements
3. **Modifying text input sub-types** - The expand/collapse mechanism is fragile
4. **CSS overrides affecting toolbox structure** - Global selectors caused issues

### Best Practices Going Forward

1. **Don't clear all default items**
   ```javascript
   // BAD
   creator.toolbox.items.splice(0, creator.toolbox.items.length);
   
   // GOOD - Add alongside defaults or selectively remove
   creator.toolbox.addItem(customItem);
   ```

2. **Test each custom item individually**
   - Add one custom item
   - Test thoroughly
   - Only then add the next

3. **Keep custom items simple initially**
   - Start with basic question types
   - Avoid complex nested panels at first
   - Build complexity gradually

4. **Use SurveyJS's expected patterns**
   - Follow their naming conventions
   - Use standard iconNames
   - Match their JSON structure

## Configuration Options

### Minimal Creator Options
```javascript
const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  showJSONEditorTab: false,
  showTestSurveyTab: true,
  showSidebar: true,
  showToolbox: true
};
```

### Toolbox Settings
```javascript
creator.toolbox.isCompact = false;
creator.toolbox.searchEnabled = true;
```

## Testing Checklist
- [ ] Toolbox loads without errors
- [ ] All items are draggable
- [ ] Items render correctly when dropped
- [ ] Preview mode works
- [ ] Form can be saved
- [ ] Existing forms load properly

## Migration Path
1. Start with minimal configuration
2. Ensure stability for 1-2 days
3. Add Phase 2 items one by one
4. Test each addition thoroughly
5. Only then add healthcare-specific items

## Important Files
- `/src/utils/minimalToolboxConfig.ts` - Minimal item definitions
- `/src/utils/surveyConfigMinimal.ts` - Clean creator setup
- `/src/utils/surveyConfig.ts` - Original (potentially unstable) configuration
- `/src/utils/toolboxConfig.ts` - Full item list (for reference)

## Rollback Plan
If instability returns:
1. Switch back to `createMinimalSurveyCreator`
2. Remove recently added items
3. Check browser console for specific errors
4. Test with default SurveyJS configuration