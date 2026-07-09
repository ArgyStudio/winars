const INGEST_URL = 'https://ewhzrh7r71.execute-api.us-east-2.amazonaws.com/ingest';

const PIXEL_ID_SAFE = typeof PIXEL_ID === 'string' && PIXEL_ID ? PIXEL_ID : null;

const VISIT_UUID = crypto.randomUUID();

let resolvedUuid = VISIT_UUID;

const WA_NUMBERS = [
    '5491176159174',
    '5491171247092',
    '5491171461076'
];

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

    await Promise.all([waitForCookie('_fbp'), waitForCookie('_fbc')]);

    const cookies = parseCookies();
    const fbp = cookies._fbp || null;
    const fbcFromCookie = cookies._fbc || null;

    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : fbcFromCookie;

    const payload = {
        uuid: VISIT_UUID,
        pixel_id: PIXEL_ID_SAFE,
        fbclid,
        fbc,
        fbp,
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

        if (data && data.uuid) resolvedUuid = data.uuid;

        console.log('[ingest] ok', data);
    } catch (err) {
        console.error('[ingest] error', err);
    } finally {
        ingestDone = true;
    }
}

window.addEventListener('load', () => {
    document.body.classList.remove('lbody');
    void ingestVisit();
});

let ctaClicked = false;

document.getElementById('Btn').addEventListener('click', (ev) => {
    if (ctaClicked) {
        ev.preventDefault();
        return;
    }
    ctaClicked = true;
    ev.currentTarget.setAttribute('aria-disabled', 'true');

    document.getElementById('loading-overlay').classList.remove('hidden');

    const lineNumber = pickWhatsAppLine();
    const msg = WA_MESSAGE(resolvedUuid);
    const url = `https://wa.me/${lineNumber}?text=${encodeURIComponent(msg)}`;

    if (typeof fbq === 'function') {
        fbq('track', 'Contact', {
            content_name: 'whatsapp_click',
            content_category: 'wa_button',
        });
    }

    if (!ingestDone) {
        console.log('[click] proceeding with wa.me before /ingest resolved');
    }

    window.location.href = url;
});

window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
        ctaClicked = false;
        const btn = document.getElementById('Btn');
        if (btn) btn.removeAttribute('aria-disabled');
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
});
