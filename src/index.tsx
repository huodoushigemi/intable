import { Router } from '@solidjs/router'
import { render, Suspense } from 'solid-js/web'
import routes from '~solid-pages'

render(
  () => {
    return (
      <Router
        root={props => (
          <Suspense>
            {props.children}
          </Suspense>
        )}
      >
        {routes}
      </Router>
    )
  },
  document.getElementById('root') as HTMLElement,
)