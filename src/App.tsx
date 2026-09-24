import Header from './components/Header'
import Hero from './components/Hero'
import Shop from './components/Shop'
import Process from './components/Process'
import Warranty from './components/Warranty'
import Values from './components/Values'
import Faq from './components/Faq'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Checkout from './components/Checkout'
import { OrderCancelled, OrderSuccess } from './components/OrderResult'
import { Privacy, Returns, Shipping, Terms } from './components/Policies'
import { CartProvider } from './cart'
import { usePath } from './router'

function Home() {
  return (
    <>
      <Hero />
      <Shop />
      <Process />
      <Warranty />
      <Values />
      <Faq />
      <Contact />
    </>
  )
}

const PAGES: Record<string, () => React.JSX.Element> = {
  '/checkout': Checkout,
  '/order/success': OrderSuccess,
  '/order/cancelled': OrderCancelled,
  '/returns': Returns,
  '/shipping': Shipping,
  '/privacy': Privacy,
  '/terms': Terms,
}

export default function App() {
  const path = usePath()
  const Page = PAGES[path.replace(/\/+$/, '')] ?? Home

  return (
    <CartProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Page />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  )
}
