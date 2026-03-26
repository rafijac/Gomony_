// Polyfill ResizeObserver for test environment
class ResizeObserver {
  constructor(callback: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = ResizeObserver;import '@testing-library/jest-dom'
