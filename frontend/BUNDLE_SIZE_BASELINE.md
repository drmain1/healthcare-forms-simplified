# Bundle Size Baseline - July 22, 2025

## 📊 Current Bundle Size (After CSS Cleanup)

### JavaScript Files (Gzipped):
- **Main bundle**: 1.18 MB
- SurveyJS chunk (239): 45.98 kB  
- SurveyJS creator chunk (455): 42.92 kB
- Other chunks: ~12 kB total

**Total JS**: ~1.28 MB gzipped

### CSS Files (Gzipped):
- **Main CSS**: 155.76 kB

**Total CSS**: 155.76 kB gzipped

---

## 🎯 Target Goals for Designer

### Bundle Size Targets:
- ✅ **Current**: 1.18 MB JS + 156 kB CSS
- 🎯 **Target**: Keep JS under 1.25 MB after UI changes
- 🎯 **Target**: Keep CSS under 200 kB after Tailwind adoption

### Performance Budget:
- Main JS bundle should not exceed **1.3 MB** gzipped
- CSS should not exceed **200 kB** gzipped  
- Page load time should remain under **3 seconds**

---

## 🚨 Bundle Size Warnings

React build showed warning: "The bundle size is significantly larger than recommended"

### Main Size Contributors:
1. **SurveyJS Enterprise** (~90 kB) - Required for form builder
2. **Material-UI** (~200-300 kB) - Being gradually replaced
3. **Redux Toolkit** (~50 kB) - State management
4. **PDF handling libraries** (~100 kB) - Healthcare requirements

### Optimization Opportunities:
1. **Tree shake Material-UI imports** - Use individual component imports
2. **Code splitting** - Separate admin vs patient bundles  
3. **Lazy load** non-critical components
4. **Remove unused dependencies** after UI migration

---

## 📈 Monitoring Commands

```bash
# Check current bundle size
npm run bundle-size

# Analyze bundle composition  
npm run analyze

# Build for production
npm run build
```

---

## 🎨 Designer Guidelines

### When adding Tailwind CSS:
- Monitor CSS file size - should stay under 200 kB
- Use PurgeCSS in production to remove unused classes
- Test bundle size after each major component update

### When replacing Material-UI:
- Import individual components: `import Button from '@mui/material/Button'`
- Remove unused MUI imports as you replace them
- Test bundle size reduction as MUI usage decreases

### Performance Testing:
- Build after each component update
- Check gzipped sizes with `npm run bundle-size`  
- Use Chrome DevTools to monitor load times
- Test on 3G network speeds

---

**✅ This baseline was captured after major CSS cleanup on July 22, 2025**