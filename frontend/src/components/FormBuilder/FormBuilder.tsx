import React from 'react';
import { FormBuilderContainer } from './FormBuilderContainer';

/**
 * FormBuilder component - Entry point for the form builder feature.
 * This component has been refactored to use a container/presentation pattern
 * for better separation of concerns and easier maintenance.
 */
export const FormBuilder: React.FC = () => {
  return <FormBuilderContainer />;
};