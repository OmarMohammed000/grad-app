/**
 * React Navigation Type Declarations
 * This file extends React Navigation's global types
 */

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      index: undefined;
      login: undefined;
      register: undefined;
      '(tabs)': undefined;
      'tasks': undefined;
      'challenges': undefined;
      'profile': undefined;
    }
  }
}

export {};

