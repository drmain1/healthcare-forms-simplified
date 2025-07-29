import React from 'react';

interface MigrationWrapperProps {
  /**
   * Enable Tailwind CSS styling within this wrapper
   * When true, adds 'tw-layout' class for scoped Tailwind usage
   */
  useTailwind?: boolean;
  /**
   * Enable patient form view styling (warm beige theme)
   * When true, adds 'patient-form-view' class
   */
  patientView?: boolean;
  /**
   * Enable form builder view styling (Material-UI theme)
   * When true, adds 'form-builder-view' class  
   */
  builderView?: boolean;
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  /**
   * Child components to wrap
   */
  children: React.ReactNode;
}

/**
 * MigrationWrapper - Helper component for gradual UI modernization
 * 
 * Use this wrapper to gradually migrate components to Tailwind CSS
 * while maintaining compatibility with existing MUI and SurveyJS styles.
 * 
 * @example
 * // Enable Tailwind for a component
 * <MigrationWrapper useTailwind>
 *   <MyComponent />
 * </MigrationWrapper>
 * 
 * @example  
 * // Style for patient-facing forms
 * <MigrationWrapper patientView>
 *   <SurveyComponent />
 * </MigrationWrapper>
 * 
 * @example
 * // Style for form builder interface
 * <MigrationWrapper builderView>
 *   <FormBuilderComponent />
 * </MigrationWrapper>
 */
export const MigrationWrapper: React.FC<MigrationWrapperProps> = ({ 
  useTailwind = false,
  patientView = false, 
  builderView = false,
  className = '',
  children 
}) => {
  const cssClasses = [
    useTailwind && 'tw-layout',
    patientView && 'patient-form-view',
    builderView && 'form-builder-view',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cssClasses || undefined}>
      {children}
    </div>
  );
};