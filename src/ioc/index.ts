import {
  asClass,
  asFunction,
  asValue,
  Constructor,
  createContainer as createAwilixContainer,
  InjectionMode,
  Lifetime,
} from 'awilix'

const isConstructor = (fn: any): fn is Constructor<unknown> => {
  if (typeof fn !== 'function') return false

  // Check if it has prototype property with constructor
  if (fn.prototype && fn.prototype.constructor === fn) {
    return true
  }

  // Check if it's a class (more reliable for ES6 classes)
  try {
    // Classes cannot be called without 'new'
    const fnStr = fn.toString()
    return (
      fnStr.startsWith('class ') ||
      /^function\s+[A-Z]/.test(fnStr) || // Function starting with capital letter
      fn.prototype !== undefined
    )
  } catch {
    return false
  }
}

type Deps = Record<string, Constructor<unknown> | any>

export const createContainer = (deps: Deps) => {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.CLASSIC,
  })

  Object.entries(deps).forEach(([key, value]) => {
    if (isConstructor(value)) {
      container.register({
        [key]: asClass(value, { lifetime: Lifetime.SCOPED }),
      })
    } else if (typeof value === 'function') {
      container.register({
        [key]: asFunction(value, { lifetime: Lifetime.SCOPED }),
      })
    } else {
      container.register({
        [key]: asValue(value),
      })
    }
  })

  return container
}
