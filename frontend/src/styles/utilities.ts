// Reusable utility classes and patterns
export const flexPatterns = {
  // Common flex layouts
  center: 'tw-flex tw-items-center tw-justify-center',
  centerY: 'tw-flex tw-items-center',
  centerX: 'tw-flex tw-justify-center',
  between: 'tw-flex tw-items-center tw-justify-between',
  
  // Column layouts
  col: 'tw-flex tw-flex-col',
  colCenter: 'tw-flex tw-flex-col tw-items-center tw-justify-center',
  colCenterX: 'tw-flex tw-flex-col tw-items-center',
  
  // Gap patterns
  gap2: 'tw-flex tw-gap-2',
  gap4: 'tw-flex tw-gap-4',
  gap6: 'tw-flex tw-gap-6',
  
  // Responsive flex
  responsive: 'tw-flex tw-flex-col md:tw-flex-row',
};

// Card styling patterns
export const cardStyles = {
  base: 'tw-bg-white tw-rounded-lg tw-border tw-border-gray-200',
  elevated: 'tw-bg-white tw-rounded-lg tw-shadow-md tw-border tw-border-gray-200',
  interactive: 'tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 hover:tw-shadow-md tw-transition-shadow tw-cursor-pointer',
  
  // Healthcare specific
  form: 'tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6',
  section: 'tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-4',
};

// Shadow utilities (consistent with design tokens)
export const shadows = {
  none: 'tw-shadow-none',
  sm: 'tw-shadow-sm',
  default: 'tw-shadow',
  md: 'tw-shadow-md',
  lg: 'tw-shadow-lg',
  xl: 'tw-shadow-xl',
};

// Button variants
export const buttonVariants = {
  primary: 'tw-bg-primary-700 tw-text-white tw-font-medium tw-px-4 tw-py-2 tw-rounded tw-transition-colors hover:tw-bg-primary-800',
  secondary: 'tw-bg-gray-200 tw-text-gray-800 tw-font-medium tw-px-4 tw-py-2 tw-rounded tw-transition-colors hover:tw-bg-gray-300',
  outline: 'tw-border tw-border-primary-700 tw-text-primary-700 tw-font-medium tw-px-4 tw-py-2 tw-rounded tw-transition-colors hover:tw-bg-primary-50',
  danger: 'tw-bg-red-600 tw-text-white tw-font-medium tw-px-4 tw-py-2 tw-rounded tw-transition-colors hover:tw-bg-red-700',
};

// Text utilities
export const textStyles = {
  heading: 'tw-font-semibold tw-text-gray-900',
  subheading: 'tw-font-medium tw-text-gray-700',
  body: 'tw-text-gray-600',
  caption: 'tw-text-sm tw-text-gray-500',
  error: 'tw-text-sm tw-text-red-600',
  success: 'tw-text-sm tw-text-green-600',
};

// Helper function to combine classes
export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Example usage in components:
// <div className={flexPatterns.between}>
// <Paper className={cardStyles.elevated}>
// <Button className={buttonVariants.primary}>

// Migration patterns for common MUI sx props:
export const migrationPatterns = {
  // sx={{ p: 2 }} → className="tw-p-4"
  // sx={{ mb: 3 }} → className="tw-mb-6"  
  // sx={{ display: 'flex', gap: 2 }} → className={flexPatterns.gap4}
  // sx={{ backgroundColor: 'white', p: 3, borderRadius: 2 }} → className={cardStyles.form}
};