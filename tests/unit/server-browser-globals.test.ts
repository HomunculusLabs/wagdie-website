/**
 * @jest-environment node
 */

describe('server browser globals sanitizer', () => {
  const modulePath = '@/lib/utils/server-browser-globals'

  afterEach(() => {
    delete (globalThis as typeof globalThis & { localStorage?: unknown }).localStorage
    delete (globalThis as typeof globalThis & { sessionStorage?: unknown }).sessionStorage
    jest.resetModules()
  })

  it('removes configurable Web Storage globals in server runtimes', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: jest.fn() },
      configurable: true,
    })
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: { getItem: jest.fn() },
      configurable: true,
    })

    jest.isolateModules(() => {
      require(modulePath)
    })

    expect('localStorage' in globalThis).toBe(false)
    expect('sessionStorage' in globalThis).toBe(false)
  })
})
