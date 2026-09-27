import { useEffect, useState } from 'react'

/** Tiny path router: '/', '/checkout', '/order/success', '/order/cancelled'. vercel.json rewrites unknown paths to index.html. */
export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  return path
}

export function navigate(to: string) {
  history.pushState(null, '', to)
  dispatchEvent(new PopStateEvent('popstate'))
  scrollTo(0, 0)
}
