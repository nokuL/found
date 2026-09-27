import { useEffect, type ReactNode } from 'react'
import { CONTACT, POLICY, POLICY_LINKS, SHOP } from '../data'

// Plain-language store policies. Have them reviewed by a lawyer before launch; numbers live in POLICY (src/data.ts).

const Mail = () => <a href={`mailto:${CONTACT.email}`} className="font-semibold text-forest underline underline-offset-4">{CONTACT.email}</a>
const Phone = () => <a href={CONTACT.phoneHref} className="font-semibold text-forest underline underline-offset-4">{CONTACT.phone}</a>
const Link = ({ to, children }: { to: string; children: ReactNode }) => (
  <a href={to} className="font-semibold text-forest underline underline-offset-4">{children}</a>
)
const H2 = ({ children }: { children: ReactNode }) => <h2 className="mt-10 font-display text-2xl font-bold text-ink">{children}</h2>
const Ul = ({ children }: { children: ReactNode }) => <ul className="mt-3 list-disc space-y-2 pl-6">{children}</ul>

function PolicyPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} | Found Again`
    return () => void (document.title = prev)
  }, [title])

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">Last updated {POLICY.updated}</p>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">{intro}</p>
      <div className="mt-2 leading-relaxed text-ink-soft [&_p]:mt-3">{children}</div>
      <H2>Questions</H2>
      <p>
        Email <Mail /> or call <Phone />. {POLICY.legalName}, {CONTACT.address[0]}, {CONTACT.address[1]}.
      </p>
      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-sage pt-6 text-sm font-medium" aria-label="Policies">
        {POLICY_LINKS.map((l) => <a key={l.href} href={l.href} className="text-ink-soft hover:text-forest">{l.label}</a>)}
      </nav>
    </article>
  )
}

export function Returns() {
  return (
    <PolicyPage title="Returns & refunds" intro={`Changed your mind? You can return most items within ${POLICY.returnDays} days. If something is wrong with it, our 30-day warranty has you covered.`}>
      <H2>Returning an item</H2>
      <Ul>
        <li>You have <strong className="text-ink">{POLICY.returnDays} days</strong> from delivery or pickup to start a return.</li>
        <li>The item must be in the same condition you received it, with any parts, accessories, cables, and manuals it came with.</li>
        <li>Devices must be signed out of every account, with activation locks (such as Find My or Google account protection) removed.</li>
      </Ul>

      <H2>How to start a return</H2>
      <p>Email us with your order number (it starts with FA-) and the item you want to return. We reply within one business day with instructions.</p>
      <Ul>
        <li><strong className="text-ink">Drop-off:</strong> bring it back to us in Apex, NC at no cost.</li>
        <li><strong className="text-ink">Parcel items:</strong> ship it back to us. For a change of mind, you pay return shipping.</li>
        <li><strong className="text-ink">Large freight items:</strong> we quote return freight before you book, or you can bring it to us.</li>
      </Ul>

      <H2>Refunds</H2>
      <p>
        We refund to your original payment method within {POLICY.refundBusinessDays} business days of receiving and inspecting the item. Your bank may
        take a further 5 to 10 business days to show it. Original shipping charges are refunded only if the return is due to our error, damage in
        transit, or an item that was not as described.
      </p>

      <H2>Damaged or not as described</H2>
      <p>
        Please check your order when it arrives. If it is damaged or does not match its listing, tell us within {POLICY.damageReportHours} hours, with
        photos, and keep the packaging. We will repair, replace, or fully refund it, including shipping, and arrange the return at no cost to you.
      </p>

      <H2>Cancelling an order</H2>
      <p>You can cancel for a full refund any time before your order ships or is picked up. Email or call us as soon as possible.</p>

      <H2>The 30-day warranty</H2>
      <p>
        Separate from returns: if furniture or non-powered equipment has a structural failure, loose joints, or a functional breakdown within 30 days of
        delivery or pickup, we will repair it, replace it, or refund you. Normal wear and tear and misuse are not covered.{' '}
        <Link to="/#warranty">Read about the warranty</Link>.
      </p>
    </PolicyPage>
  )
}

export function Shipping() {
  return (
    <PolicyPage title="Shipping & pickup" intro="We ship insured across the continental US, or you can pick up your order from us in Apex, NC for free.">
      <H2>Where we ship</H2>
      <p>All 48 continental US states and Washington, DC. We don't currently ship to Alaska, Hawaii, US territories, PO boxes, or outside the US.</p>

      <H2>Cost</H2>
      <p>
        Shipping is a flat <strong className="text-ink">${SHOP.shippingFlat} per order</strong>, insured, and shown at checkout before you pay. Pickup is
        free. Sales tax is charged where required and shown at checkout.
      </p>

      <H2>When it arrives</H2>
      <Ul>
        <li>We hand your order to the carrier within <strong className="text-ink">{POLICY.processingBusinessDays} business days</strong> of payment, and email you tracking details.</li>
        <li><strong className="text-ink">Parcels</strong> (electronics, art, smaller items) usually arrive in {POLICY.parcelDelivery}.</li>
        <li>
          <strong className="text-ink">Large furniture and equipment</strong> goes by white-glove freight and usually arrives in {POLICY.freightDelivery}. The
          carrier contacts you to book a delivery appointment.
        </li>
      </Ul>
      <p>These are estimates. Carrier delays and weather can add time, and we will keep you posted.</p>

      <H2>Your address</H2>
      <p>
        Please double-check your address at checkout. If a package is returned to us because the address was wrong or a freight delivery was missed, we
        may charge the cost of sending it again.
      </p>

      <H2>When it arrives damaged</H2>
      <p>
        Inspect your order on arrival, and note any visible damage on the carrier's delivery receipt if you can. Tell us within{' '}
        {POLICY.damageReportHours} hours, with photos, and keep the packaging. See <Link to="/returns">Returns & refunds</Link>.
      </p>

      <H2>Pickup in Apex, NC</H2>
      <Ul>
        <li>Choose pickup at checkout. We email you within one business day to arrange a time.</li>
        <li>We hold your order for {POLICY.pickupHoldDays} days. After that, we will contact you, and may cancel and refund the order.</li>
        <li>Bring your order number and a photo ID. For large pieces, bring a vehicle big enough to carry them. We are happy to help you load.</li>
        <li>Someone else can collect for you: just email us their name first.</li>
      </Ul>
    </PolicyPage>
  )
}

export function Privacy() {
  return (
    <PolicyPage title="Privacy policy" intro={`This explains what personal information ${POLICY.legalName} collects through this website, why, and who we share it with. We never sell your information.`}>
      <H2>What we collect</H2>
      <Ul>
        <li><strong className="text-ink">When you order:</strong> your name, email, phone number, shipping address (if shipping), the items you bought, and the order total.</li>
        <li>
          <strong className="text-ink">Payment details:</strong> you pay on the secure checkout page of Clover, our payment processor. Your card number goes to
          Clover, not to us. We see the payment's status, not your full card details.
        </li>
        <li><strong className="text-ink">When you contact us:</strong> your name, email, and message.</li>
        <li>
          <strong className="text-ink">Technical data:</strong> like most websites, our hosting provider records basic information such as your IP address,
          browser type, and pages visited, to keep the site running and secure.
        </li>
      </Ul>

      <H2>How we use it</H2>
      <Ul>
        <li>To process, ship, and support your order, including returns and warranty claims.</li>
        <li>To reply to your messages.</li>
        <li>To prevent fraud, and to keep the records that tax and accounting laws require.</li>
      </Ul>
      <p>We don't send marketing emails, and we don't use your information for advertising.</p>

      <H2>Who we share it with</H2>
      <p>Only the service providers we need to run the shop, and only for that purpose:</p>
      <Ul>
        <li><strong className="text-ink">Clover</strong> (Fiserv), to process payments.</li>
        <li><strong className="text-ink">Vercel</strong>, which hosts this website, and <strong className="text-ink">Upstash</strong>, which stores order records for it.</li>
        <li><strong className="text-ink">Resend</strong>, which delivers our order and contact form emails.</li>
        <li><strong className="text-ink">Shipping carriers</strong>, who get your name, address, and phone number to deliver your order.</li>
        <li><strong className="text-ink">Google Fonts</strong>, which serves the site's typefaces and so receives your IP address.</li>
      </Ul>
      <p>We may also share information if the law requires it, or to protect our rights, for example in a fraud investigation.</p>

      <H2>Cookies and browser storage</H2>
      <p>
        We don't use advertising or analytics cookies. Your cart is saved in your own browser (local storage) so it survives a page reload; clearing your
        browser data removes it. Clover's checkout page may use cookies it needs to process your payment securely.
      </p>

      <H2>How long we keep it</H2>
      <p>
        We keep order records for as long as tax and accounting rules require, generally up to seven years. We keep contact messages for up to two years,
        unless they relate to an order.
      </p>

      <H2>Your choices</H2>
      <p>
        You can ask us to show you, correct, or delete the personal information we hold about you. Email us and we will respond within 30 days. We may need
        to keep some order records to meet legal obligations. Depending on where you live, you may have additional privacy rights, and we will honor them.
      </p>

      <H2>Security</H2>
      <p>The site is served over an encrypted connection (HTTPS), payments are handled by a PCI-compliant processor, and access to order data is limited to our team.</p>

      <H2>Children</H2>
      <p>This site is not intended for children under 13, and we don't knowingly collect their information.</p>

      <H2>Changes</H2>
      <p>If we change this policy, we will update the date at the top of this page.</p>
    </PolicyPage>
  )
}

export function Terms() {
  return (
    <PolicyPage title="Terms of sale" intro={`These terms apply when you buy from ${POLICY.legalName} through this website. By placing an order, you agree to them.`}>
      <H2>About our items</H2>
      <Ul>
        <li>Everything we sell is pre-owned and refurbished, unless the listing says otherwise. Expect some signs of previous use, as described by the item's condition grade.</li>
        <li>Most items are one of a kind. Listing an item does not guarantee it is still available until your payment is approved.</li>
        <li>We describe each item as accurately as we can. Dimensions are approximate, and colors may look different on your screen.</li>
        <li>For art and artifacts, material and origin details are given in good faith, based on our own sourcing and assessment.</li>
        <li>Devices are data-wiped before sale. Once you receive a device, you are responsible for the data you put on it.</li>
      </Ul>

      <H2>Prices and payment</H2>
      <p>
        Prices are in US dollars. Shipping and sales tax are shown at checkout before you pay. Payment is processed by Clover. Your order is confirmed when
        your payment is approved, and you'll see your order number on screen.
      </p>
      <p>
        If an item's price is listed incorrectly, or an item turns out to be unavailable, we will let you know and may cancel the order with a full
        refund. We may also refuse or cancel orders we believe are fraudulent.
      </p>

      <H2>Delivery and ownership</H2>
      <p>
        See <Link to="/shipping">Shipping & pickup</Link>. The item becomes yours, and responsibility for it passes to you, when it is delivered to you or
        picked up.
      </p>

      <H2>Returns and warranty</H2>
      <p>
        Returns and refunds are covered in <Link to="/returns">Returns & refunds</Link>. Eligible items include our 30-day warranty against structural
        failure, loose joints, and functional breakdown. Apart from that warranty and any rights you have by law, items are sold as they are described in
        their listing.
      </p>

      <H2>Limit of liability</H2>
      <p>
        To the extent the law allows, our total liability for any claim about an order is limited to the amount you paid for it, and we are not liable
        for indirect or consequential losses. Nothing in these terms limits rights you have that cannot be limited by law.
      </p>

      <H2>Using this website</H2>
      <p>
        Please don't misuse the site, interfere with its operation, or place orders you don't intend to pay for. The site's text, design, and logo belong to{' '}
        {POLICY.legalName}.
      </p>

      <H2>Governing law</H2>
      <p>
        These terms are governed by the laws of the State of {POLICY.governingState}. Any dispute will be handled in the courts of {POLICY.venue}, unless
        the law where you live says otherwise. Please contact us first: most problems can be sorted out with a quick call.
      </p>

      <H2>Changes</H2>
      <p>We may update these terms. The version on this page when you place your order is the one that applies to it.</p>

      <p className="mt-10">
        See also our <Link to="/privacy">Privacy policy</Link>.
      </p>
    </PolicyPage>
  )
}
