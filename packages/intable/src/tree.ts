export const findParent = (data: any[], cb, childrenField = 'children'): any => {
  let parent = null
  const stack = [...data]
  while (stack.length) {
    const node = stack.pop()
    if (cb(node)) return parent
    if (Array.isArray(node[childrenField])) {
      stack.push(...node[childrenField])
      parent = node
    }
  }
  return null
}