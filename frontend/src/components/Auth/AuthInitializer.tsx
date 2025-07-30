import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const organization = localStorage.getItem('organization');

    if (user && organization) {
      dispatch(loginSuccess({ user: JSON.parse(user), organization: JSON.parse(organization) }));
    }
  }, [dispatch]);

  return <>{children}</>;
};