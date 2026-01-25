/**
 * Smoke Test - Verifies Jest is configured correctly
 */

describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have access to jest-dom matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    expect(element).toHaveTextContent('Hello World')
  })

  it('should be able to do basic assertions', () => {
    const sum = (a: number, b: number) => a + b
    expect(sum(2, 3)).toBe(5)
    expect(sum(-1, 1)).toBe(0)
  })
})
