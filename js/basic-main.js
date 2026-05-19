// ads-events-platform integration — winars
// Flow: on load, POST browser tracking metadata to /ingest and stash the returned uuid.
// On CTA click, build wa.me URL with the uuid so Kommo can correlate the lead.

const INGEST_URL = 'https://ewhzrh7r71.execute-api.us-east-2.amazonaws.com/ingest';

// PIXEL_ID is declared as a global in index.html (set via window scope).
// Fall back to null so missing config fails loud instead of shipping 'undefined'.
const PIXEL_ID_SAFE = typeof PIXEL_ID === 'string' && PIXEL_ID ? PIXEL_ID : null;

// Generate uuid once per page load. Reused by both /ingest and wa.me.
const VISIT_UUID = crypto.randomUUID();

const WA_NUMBERS = [
    '5491176159174',
    '5491171247092',
    '5491171461076'
];

// All four lines belong to the "ld" campaign tag — no per-ref routing,
// random rotation across all numbers regardless of e_ref value.
const WA_LINES_BY_REF = new Map();

function pickWhatsAppLine() {
    const eRef = new URLSearchParams(window.location.search).get('e_ref');
    return (
        WA_LINES_BY_REF.get(eRef) ??
        WA_NUMBERS[Math.floor(Math.random() * WA_NUMBERS.length)]
    );
}

const WA_MESSAGE = (uuid) =>
    `Hola WINARS! vengo por el bono de bienvenida\nMe creas un usuario?\nCódigo: ${uuid}`;

let ingestDone = false;

function parseCookies() {
    return document.cookie.split('; ').reduce((acc, kv) => {
        const [k, ...v] = kv.split('=');
        if (k) acc[k] = v.join('=');
        return acc;
    }, {});
}

function waitForCookie(name, timeout = 3000) {
    return new Promise((resolve) => {
        const start = Date.now();
        (function check() {
            if (
                document.cookie.split('; ').some((c) => c.startsWith(`${name}=`)) ||
                Date.now() - start > timeout
            ) {
                return resolve();
            }
            requestAnimationFrame(check);
        })();
    });
}

async function ingestVisit() {
    if (!PIXEL_ID_SAFE) {
        console.warn('[ingest] PIXEL_ID not set, skipping');
        return;
    }

    // Meta Pixel sets _fbp (always) and _fbc (only when fbclid is present).
    // Wait up to 3s for the async pixel to write them.
    await Promise.all([waitForCookie('_fbp'), waitForCookie('_fbc')]);

    const cookies = parseCookies();
    const fbp = cookies._fbp || null;
    const fbcFromCookie = cookies._fbc || null;

    // If the URL has a fresh fbclid, reconstruct _fbc server-authoritatively.
    // This avoids a known Meta issue where stale cached _fbc (with fbclid >90d)
    // degrades event match quality.
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : fbcFromCookie;

    const payload = {
        uuid: VISIT_UUID,
        pixel_id: PIXEL_ID_SAFE,
        fbclid,
        fbc,
        fbp,
        // Forwarded by the backend to Meta CAPI as event_source_url. Helps Meta
        // attribute the Lead/Purchase to this exact landing URL (improves EMQ
        // and is required for AEM iOS attribution per verified domain).
        event_source_url: window.location.href,
        visit_time_ms: Date.now(),
    };

    try {
        const resp = await fetch(INGEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            console.warn('[ingest] non-ok response', resp.status, text);
            return;
        }

        const data = await resp.json().catch(() => null);
        console.log('[ingest] ok', data);
    } catch (err) {
        console.error('[ingest] error', err);
    } finally {
        ingestDone = true;
    }
}

window.addEventListener('load', () => {
    document.body.classList.remove('lbody');
    // Fire tracking asynchronously — never block the user.
    void ingestVisit();
});

let ctaClicked = false;

document.getElementById('Btn').addEventListener('click', (ev) => {
    // Spam-click guard: a second tap before wa.me opens would fire `Contact`
    // twice and pollute audience signals. Cheap latch — re-armed on pageshow
    // if the user comes back via browser history.
    if (ctaClicked) {
        ev.preventDefault();
        return;
    }
    ctaClicked = true;
    ev.currentTarget.setAttribute('aria-disabled', 'true');

    document.getElementById('loading-overlay').classList.remove('hidden');

    const lineNumber = pickWhatsAppLine();
    const msg = WA_MESSAGE(VISIT_UUID);
    const url = `https://wa.me/${lineNumber}?text=${encodeURIComponent(msg)}`;

    // Standard Meta event "Contact" — fired the moment the user commits to
    // initiate a conversation. Distinct from the CAPI Lead event (which only
    // fires once the message actually lands in Kommo). Helps Meta build a
    // warmer audience model and gives a click-funnel view in Events Manager.
    if (typeof fbq === 'function') {
        fbq('track', 'Contact', {
            content_name: 'whatsapp_click',
            content_category: 'wa_button',
        });
    }

    // Click happens whether or not /ingest finished — we still have VISIT_UUID locally.
    // The Lambda is idempotent on (uuid, client_id), so a late ingest arriving
    // after the user already messaged does not create a duplicate visit row.
    if (!ingestDone) {
        console.log('[click] proceeding with wa.me before /ingest resolved');
    }

    window.location.href = url;
});

// If the user comes back to this tab via bfcache (e.g. closes WhatsApp), re-enable
// the CTA so a returning user can click again without a hard reload.
window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
        ctaClicked = false;
        const btn = document.getElementById('Btn');
        if (btn) btn.removeAttribute('aria-disabled');
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
});
