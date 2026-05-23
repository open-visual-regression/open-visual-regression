/* global React */
// OVR — mock "system under test" UIs. These are the fake e-commerce app
// that OVR is testing. They DO NOT use OVR brand colors; they use a generic
// neutral-with-blue-accent palette like a typical Shopify-ish app. The
// magenta is reserved for OVR's diff overlay on top of these.
//
// Each mock takes `variant: 'baseline' | 'current'`. The "current" version
// has small, deliberate visual differences. `regions` is a fixed list of
// diff rectangles for the overlay.

// All mocks render into a fixed 1280x800 frame, then DiffViewer scales them.
const MOCK_W = 1280;
const MOCK_H = 800;

// Shared styles for the mock e-commerce site
const mockShellStyle = {
  width: MOCK_W,
  height: MOCK_H,
  background: '#ffffff',
  color: '#0a0a0a',
  fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  position: 'relative',
  overflow: 'hidden',
};

// ---------------------------------------------------------------------------
// MOCK 1: checkout page with cart items.
// Diffs: checkout button color, total price, "save for later" link removed,
//        product price.
// ---------------------------------------------------------------------------
function MockCheckoutPage({ variant }) {
  const current = variant === 'current';
  return (
    <div style={mockShellStyle}>
      {/* nav */}
      <div style={{ height: 64, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', padding: '0 48px', gap: 32 }}>
        <div style={{ width: 90, height: 22, background: '#0a0a0a', borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 28, fontSize: 14, color: '#525252' }}>
          <span>shop</span><span>collections</span><span>about</span><span>contact</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', fontSize: 14, color: '#525252' }}>
          <span>account</span>
          <div style={{ width: 24, height: 24, border: '1.5px solid #0a0a0a', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 8, background: '#0a0a0a', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
          </div>
        </div>
      </div>

      {/* page content */}
      <div style={{ padding: '56px 200px', display: 'flex', gap: 80 }}>
        {/* left: line items */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32, color: '#0a0a0a' }}>Your cart</div>

          {/* line item 1 */}
          <div style={{ display: 'flex', gap: 20, padding: '20px 0', borderTop: '1px solid #e5e5e5' }}>
            <div style={{ width: 96, height: 96, background: '#f5f5f4', borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a0a0a', marginBottom: 4 }}>Linen Overshirt</div>
              <div style={{ fontSize: 13, color: '#737373', marginBottom: 12 }}>Oat · M</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: 2, fontSize: 13 }}>
                  <span style={{ padding: '6px 12px' }}>−</span>
                  <span style={{ padding: '6px 12px', borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}>1</span>
                  <span style={{ padding: '6px 12px' }}>+</span>
                </div>
                {!current && (
                  <span style={{ fontSize: 13, color: '#737373', textDecoration: 'underline', textUnderlineOffset: 2 }}>Save for later</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 500 }}>${current ? '54.00' : '49.00'}</span>
              </div>
            </div>
          </div>

          {/* line item 2 */}
          <div style={{ display: 'flex', gap: 20, padding: '20px 0', borderTop: '1px solid #e5e5e5' }}>
            <div style={{ width: 96, height: 96, background: '#f5f5f4', borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a0a0a', marginBottom: 4 }}>Cotton Tote Bag</div>
              <div style={{ fontSize: 13, color: '#737373', marginBottom: 12 }}>Natural · Standard</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: 2, fontSize: 13 }}>
                  <span style={{ padding: '6px 12px' }}>−</span>
                  <span style={{ padding: '6px 12px', borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}>1</span>
                  <span style={{ padding: '6px 12px' }}>+</span>
                </div>
                {!current && (
                  <span style={{ fontSize: 13, color: '#737373', textDecoration: 'underline', textUnderlineOffset: 2 }}>Save for later</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 500 }}>$32.00</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #e5e5e5' }} />
        </div>

        {/* right: summary */}
        <div style={{ width: 360 }}>
          <div style={{ background: '#fafafa', padding: 28, borderRadius: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, color: '#0a0a0a' }}>Summary</div>
            <div style={{ display: 'flex', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: '#525252' }}>Subtotal</span>
              <span style={{ marginLeft: 'auto' }}>${current ? '86.00' : '81.00'}</span>
            </div>
            <div style={{ display: 'flex', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: '#525252' }}>Shipping</span>
              <span style={{ marginLeft: 'auto' }}>$8.40</span>
            </div>
            <div style={{ display: 'flex', fontSize: 14, marginBottom: 16 }}>
              <span style={{ color: '#525252' }}>Tax</span>
              <span style={{ marginLeft: 'auto' }}>$0.00</span>
            </div>
            <div style={{ height: 1, background: '#e5e5e5', marginBottom: 16 }} />
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
              <span>Total</span>
              <span style={{ marginLeft: 'auto' }}>${current ? '94.40' : '89.40'}</span>
            </div>
            <button style={{
              width: '100%',
              height: current ? 56 : 48,
              background: current ? '#2563eb' : '#0a0a0a',
              color: '#fff',
              border: 'none',
              borderRadius: current ? 4 : 2,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
            }}>Checkout</button>
            <div style={{ marginTop: 16, fontSize: 12, color: '#737373', textAlign: 'center' }}>Free returns within 30 days</div>
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', padding: '0 48px', fontSize: 12, color: '#737373', gap: 32 }}>
        <span>© 2025 Linen & Co.</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>Accessibility</span>
        <span style={{ marginLeft: 'auto' }}>USD</span>
      </div>
    </div>
  );
}

// Diff regions for MockCheckoutPage. In mock coordinate space (1280x800).
const checkoutRegions = [
  { x: 442, y: 318, w: 70,  h: 24,  kind: 'change' },   // first item price
  { x: 360, y: 290, w: 130, h: 22,  kind: 'remove' },   // "save for later" link (item 1)
  { x: 360, y: 426, w: 130, h: 22,  kind: 'remove' },   // "save for later" link (item 2)
  { x: 952, y: 274, w: 88,  h: 22,  kind: 'change' },   // subtotal
  { x: 952, y: 372, w: 100, h: 28,  kind: 'change' },   // total
  { x: 738, y: 414, w: 332, h: 64,  kind: 'change' },   // checkout button
];

// ---------------------------------------------------------------------------
// MOCK 2: empty cart state.
// Diffs: illustration removed, copy moved, button changed.
// ---------------------------------------------------------------------------
function MockEmptyCart({ variant }) {
  const current = variant === 'current';
  return (
    <div style={mockShellStyle}>
      <div style={{ height: 64, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', padding: '0 48px', gap: 32 }}>
        <div style={{ width: 90, height: 22, background: '#0a0a0a', borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 28, fontSize: 14, color: '#525252' }}>
          <span>shop</span><span>collections</span><span>about</span><span>contact</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', fontSize: 14, color: '#525252' }}>
          <span>account</span>
          <div style={{ width: 24, height: 24, border: '1.5px solid #0a0a0a', borderRadius: 2 }} />
        </div>
      </div>

      <div style={{
        padding: '120px 200px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', gap: 16,
      }}>
        {!current && (
          <div style={{ width: 120, height: 120, borderRadius: 60, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ width: 56, height: 56, border: '2px solid #d4d4d4', borderRadius: 4 }} />
          </div>
        )}
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: '#0a0a0a' }}>Your cart is empty</div>
        <div style={{ fontSize: 15, color: '#737373', maxWidth: 480, lineHeight: 1.6 }}>
          {current
            ? 'Nothing here yet — browse the shop to get started.'
            : 'Looks like you haven\u2019t added anything yet. Browse our latest collection to get started.'}
        </div>
        <button style={{
          marginTop: 16, height: 48, padding: '0 32px',
          background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 2,
          fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        }}>Continue shopping</button>
      </div>
    </div>
  );
}

const emptyCartRegions = [
  { x: 580, y: 184, w: 120, h: 120, kind: 'remove' },   // illustration
  { x: 366, y: 384, w: 548, h: 56,  kind: 'change' },   // copy
];

// ---------------------------------------------------------------------------
// MOCK 3: confirmation page.
// Diffs: success-color border tweak, order# format changed.
// ---------------------------------------------------------------------------
function MockConfirmation({ variant }) {
  const current = variant === 'current';
  return (
    <div style={mockShellStyle}>
      <div style={{ height: 64, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', padding: '0 48px', gap: 32 }}>
        <div style={{ width: 90, height: 22, background: '#0a0a0a', borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 28, fontSize: 14, color: '#525252' }}>
          <span>shop</span><span>collections</span><span>about</span><span>contact</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', fontSize: 14, color: '#525252' }}>
          <span>account</span>
        </div>
      </div>

      <div style={{ padding: '80px 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: current ? '#dcfce7' : '#fafafa',
          border: current ? '2px solid #16a34a' : '2px solid #0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
          color: current ? '#16a34a' : '#0a0a0a',
          marginBottom: 24,
        }}>✓</div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: '#0a0a0a', marginBottom: 8 }}>Thank you for your order</div>
        <div style={{ fontSize: 15, color: '#737373', marginBottom: 32 }}>
          Order {current ? 'LC-2025-08841' : '#08841'} confirmed. You'll get a shipping update by email.
        </div>

        <div style={{ width: 520, padding: 28, background: '#fafafa', borderRadius: 4, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Shipping to</div>
          <div style={{ fontSize: 14, color: '#525252', lineHeight: 1.6 }}>
            Ari Mott<br/>
            1842 Brand Street<br/>
            Oakland, CA 94612<br/>
            United States
          </div>
        </div>
      </div>
    </div>
  );
}

const confirmationRegions = [
  { x: 608, y: 80,  w: 64,  h: 64,  kind: 'change' },   // success badge
  { x: 380, y: 220, w: 520, h: 22,  kind: 'change' },   // order # copy
];

// ---------------------------------------------------------------------------
// Registry — DiffViewer picks the mock by name.
// ---------------------------------------------------------------------------
const MOCKS = {
  emptyCart:               { Component: MockEmptyCart,     regions: emptyCartRegions },
  emptyCartChanged:        { Component: MockEmptyCart,     regions: emptyCartRegions },
  checkoutPage:            { Component: MockCheckoutPage,  regions: checkoutRegions  },
  checkoutPageChanged:     { Component: MockCheckoutPage,  regions: checkoutRegions  },
  confirmation:            { Component: MockConfirmation,  regions: confirmationRegions },
  confirmationChanged:     { Component: MockConfirmation,  regions: confirmationRegions },
};

Object.assign(window, {
  MOCKS, MOCK_W, MOCK_H,
  MockCheckoutPage, MockEmptyCart, MockConfirmation,
});
