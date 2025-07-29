// Separate types file to avoid circular dependencies
import { store } from './index';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;