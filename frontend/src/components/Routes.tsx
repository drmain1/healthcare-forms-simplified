import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './Common/Layout';
import { MinimalDashboard } from './Dashboard/MinimalDashboard';
import { FormsList } from './Dashboard/FormsList';
import { FormBuilder } from './FormBuilder/FormBuilder';
import { FormSendSimplified } from './Dashboard/FormSendSimplified';
import { PublicFormFill } from './FormRenderer/PublicFormFill';
import { ResponsesList } from './Responses/ResponsesList';
import { ResponseDetail } from './Responses/ResponseDetail';
import { Login } from './Auth/Login';
import { PrivateRoute } from './Auth/PrivateRoute';

// Placeholder components for routes not yet implemented
const Patients: React.FC = () => (
  <div>
    <h2>Patients</h2>
    <p>Patient management interface coming soon...</p>
  </div>
);

const Analytics: React.FC = () => (
  <div>
    <h2>Analytics</h2>
    <p>Analytics dashboard coming soon...</p>
  </div>
);

const Settings: React.FC = () => (
  <div>
    <h2>Settings</h2>
    <p>Settings interface coming soon...</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forms/:formId/fill/:shareToken" element={<PublicFormFill />} />

      {/* Private routes with Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<MinimalDashboard />} />
        <Route path="forms" element={<FormsList />} />
        <Route path="forms/create" element={<FormBuilder />} />
        <Route path="forms/:id/edit" element={<FormBuilder />} />
        <Route path="forms/:id/send" element={<FormSendSimplified />} />
        <Route path="forms/:formId/responses" element={<ResponsesList />} />
        <Route path="forms/:formId/responses/:responseId" element={<ResponseDetail />} />
        <Route path="patients" element={<Patients />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};