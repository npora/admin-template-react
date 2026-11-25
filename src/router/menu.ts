export interface MenuNode {
  icon?: string
  keepAlive?: boolean
  fixedTab?: boolean
  activeMenu?: string
  routeQuery?: Record<string, string | number | boolean>
  order?: number
  name?: string
  path: string
  title: string
  component?: string
  hidden?: boolean
  children?: MenuNode[]
}

export interface MenuPage {
  name?: string
  icon?: string
  keepAlive?: boolean
  fixedTab?: boolean
  activeMenu?: string
  routeQuery?: Record<string, string | number | boolean>
  order?: number
  path: string
  title: string
  section?: string
  component: string
  hidden: boolean
}

export function collectPages(
  nodes: MenuNode[],
  parent = '',
  sections: string[] = [],
  hidden = false,
  translateTitle = (node: MenuNode) => node.title
): MenuPage[] {
  return nodes.flatMap((node) => {
    const path = node.path.startsWith('/') ? node.path : `${parent}/${node.path}`
    if (path.startsWith('//') || path.includes('\\') || /[?#]/.test(path)) return []
    const title = translateTitle(node)
    const section = sections.join(' / ') || undefined
    const isHidden = hidden || Boolean(node.hidden)
    const page = node.component
      ? [{
          path, title, section, component: node.component, hidden: isHidden,
          ...(node.name ? { name: node.name } : {}),
          ...(node.icon ? { icon: node.icon } : {}),
          ...(node.keepAlive !== undefined ? { keepAlive: node.keepAlive } : {}),
          ...(node.fixedTab !== undefined ? { fixedTab: node.fixedTab } : {}),
          ...(node.activeMenu ? { activeMenu: node.activeMenu } : {}),
          ...(node.routeQuery ? { routeQuery: node.routeQuery } : {}),
          ...(node.order !== undefined ? { order: node.order } : {})
        }]
      : []
    return [
      ...page,
      ...collectPages(
        node.children ?? [],
        path === '/' ? '' : path,
        [...sections, title],
        isHidden,
        translateTitle
      )
    ]
  })
}

export function menuAddress(page: MenuPage) {
  const query = new URLSearchParams(
    Object.entries(page.routeQuery ?? {}).map(([key, value]) => [key, String(value)])
  ).toString()
  return query ? page.path + '?' + query : page.path
}
