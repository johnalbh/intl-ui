/**
 * Vitest setup file for @intl-ui/react.
 *
 * Currently only imports @testing-library/jest-dom to enable DOM-aware
 * matchers like toBeInTheDocument, toHaveAttribute, and toHaveFocus.
 * These matchers are used throughout the component and hook tests.
 */

import '@testing-library/jest-dom/vitest';
