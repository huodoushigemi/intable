import { render, Suspense } from 'solid-js/web'
import { HashRouter } from '@solidjs/router'
import routes from '~solid-pages'

render(
  () => {
    return (
      <HashRouter
        root={props => (
          <Suspense>
            {props.children}
          </Suspense>
        )}
      >
        {routes}
      </HashRouter>
    )
  },
  document.getElementById('root') as HTMLElement,
)