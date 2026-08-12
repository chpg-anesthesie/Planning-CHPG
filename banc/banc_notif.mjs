/* ═══ BANC — NOTIFICATIONS PUSH (12/08/2026, phase 1) ═══
   Le VRAI Worker est exécuté. On vérifie :
   1. les trois routes et leurs refus (code, rôle, jeton) ;
   2. que l'abonnement est INATTEIGNABLE par /read et /push ;
   3. le chiffrement : le banc joue le NAVIGATEUR — il génère ses clés,
      s'abonne, reçoit la charge chiffrée et la DÉCHIFFRE réellement
      (RFC 8291). Si le déchiffré = le message, Apple saura faire pareil ;
   4. la purge des abonnements morts (410). */
import fs from 'fs';
import vm from 'vm';
import { webcrypto } from 'crypto';
const crypto = webcrypto;
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 180) : '')); } };

/* ── charge du vrai worker ── */
const envoisHTTP = [];              // ce que le worker POSTe aux services de push
let statutPushService = 201;        // réponse simulée d'Apple/Google
const fauxFetch = async (url, opts) => { envoisHTTP.push({ url, opts }); return { status: statutPushService }; };
const src = fs.readFileSync('../cloudflare/worker.js', 'utf8').replace('export default', 'globalThis.__W =');
const ctx = vm.createContext({ globalThis: {}, console, crypto, TextEncoder, TextDecoder, Response, Request, URL, JSON, Date, Math, Object, Array, String, Number, Set, Promise, DataView, Uint8Array, atob, btoa, fetch: fauxFetch });
ctx.globalThis = ctx; vm.runInContext(src, ctx);
const W = ctx.__W, M = new Map();
const KV = { get: async k => (M.has(k) ? M.get(k) : null), put: async (k, v) => { M.set(k, v); }, delete: async k => { M.delete(k); },
  list: async ({ prefix } = {}) => ({ keys: [...M.keys()].filter(k => k.startsWith(prefix || '')).map(name => ({ name })) }) };
const sha = async t => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); };
const b64u = buf => Buffer.from(buf).toString('base64url');

const ADMIN = 'COMITE2027', MAR_A = 'MARALPHA1';
M.set('acces', JSON.stringify({ users: [
  { h: await sha(ADMIN), role: 'admin', id: 'FROHLICH', name: 'FROHLICH', initials: 'AF' },
  { h: await sha(MAR_A), role: 'mar', id: 'ALPHA', name: 'ALPHA', initials: 'AL' },
] }));

/* clés VAPID de test (le banc joue AUSSI le service) */
const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const vapidPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', vapid.publicKey));
const vapidJwk = await crypto.subtle.exportKey('jwk', vapid.privateKey);
const env = { KV, PUSH_TOKEN: 'JETON-BANC', VAPID_PUBLIC: b64u(vapidPubRaw), VAPID_PRIVATE: vapidJwk.d };

const appel = async (chemin, corps) => {
  const rep = await W.fetch(new Request('https://chpg-miroir.test' + chemin, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corps || {}) }), env);
  return JSON.parse(await rep.text());
};

console.log('\n═══ N1. Routes et refus ═══');
const rc = await appel('/notif-cle', {});
V('/notif-cle livre la clé publique', rc.success && rc.cle === env.VAPID_PUBLIC, rc);
V('/notif-abonner sans code → refus', !(await appel('/notif-abonner', {})).success);
V('/notif-abonner mauvais code → refus', !(await appel('/notif-abonner', { code: 'FAUX', subscription: {} })).success);
const rMar = await appel('/notif-abonner', { code: MAR_A, subscription: { endpoint: 'https://web.push.apple.com/x', keys: { p256dh: 'a', auth: 'b' } } });
V('rôle mar → refusé (phase 1 : admin seul)', !rMar.success && /comité/i.test(rMar.error || ''), rMar);
V('abonnement incomplet → refus', !(await appel('/notif-abonner', { code: ADMIN, subscription: { endpoint: 'https://x' } })).success);
V('/notif-envoyer sans jeton → 403', !(await appel('/notif-envoyer', { titre: 'x' })).success);
V('/notif-envoyer mauvais jeton → 403', !(await appel('/notif-envoyer', { token: 'FAUX' })).success);

console.log('\n═══ N2. Abonnement réel (le banc joue le navigateur) ═══');
const nav = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const navPub = new Uint8Array(await crypto.subtle.exportKey('raw', nav.publicKey));
const authSecret = crypto.getRandomValues(new Uint8Array(16));
const rAb = await appel('/notif-abonner', { code: ADMIN.toLowerCase() + '  ', subscription: {
  endpoint: 'https://web.push.apple.com/QP-test', keys: { p256dh: b64u(navPub), auth: b64u(authSecret) } } });
V('admin s\'abonne (code toléré en casse/espaces)', rAb.success && rAb.id === 'FROHLICH', rAb);
V('l\'abonnement est en KV', M.has('notif_sub_FROHLICH'));

const rRead = await appel('/read', { code: ADMIN, keys: ['notif_sub_FROHLICH'] });
V('/read ne peut PAS lire un abonnement', !rRead.data || !rRead.data.notif_sub_FROHLICH, rRead.refuses);
const rPush = await appel('/push', { token: 'JETON-BANC', items: { notif_sub_FROHLICH: '"pirate"' } });
V('/push ne peut PAS écrire un abonnement', (rPush.refuses || []).includes('notif_sub_FROHLICH'), rPush);
V('la valeur en KV n\'a pas bougé', M.get('notif_sub_FROHLICH').includes('web.push.apple.com'));

console.log('\n═══ N3. Envoi : en-têtes, JWT, et DÉCHIFFREMENT de la charge ═══');
const rEnv = await appel('/notif-envoyer', { token: 'JETON-BANC', titre: 'Les gardes 2027 sont générées', corps: 'Planning annuel complet.', url: './admin.html' });
V('envoi déclaré réussi', rEnv.success && rEnv.envoyees === 1 && rEnv.abonnes === 1, rEnv);
V('un seul POST vers le service de push', envoisHTTP.length === 1);
const e = envoisHTTP[0];
V('endpoint respecté', e.url === 'https://web.push.apple.com/QP-test');
V('Content-Encoding aes128gcm', e.opts.headers['Content-Encoding'] === 'aes128gcm');
V('TTL présent', e.opts.headers['TTL'] === '86400');
const auth = e.opts.headers['Authorization'] || '';
V('Authorization vapid t=…, k=clé publique', auth.startsWith('vapid t=') && auth.includes('k=' + env.VAPID_PUBLIC));

/* JWT : signature vérifiée avec la clé publique VAPID */
{
  const jwt = auth.slice(8).split(',')[0].trim();
  const [h, p, s] = jwt.split('.');
  const charge = JSON.parse(Buffer.from(p, 'base64url').toString());
  V('JWT : audience = origine du service', charge.aud === 'https://web.push.apple.com', charge);
  V('JWT : sujet mailto du service', /^mailto:/.test(charge.sub));
  V('JWT : expiration < 24 h (règle des services)', charge.exp - Math.floor(Date.now() / 1000) <= 24 * 3600);
  const okSig = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, vapid.publicKey,
    Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + p));
  V('JWT : signature ES256 VALIDE (vérifiée à la clé publique)', okSig);
}

/* Déchiffrement RFC 8291 : exactement ce que fera l'iPhone */
{
  const corps = new Uint8Array(e.opts.body);
  const sel = corps.slice(0, 16);
  const rs = new DataView(corps.buffer, corps.byteOffset + 16, 4).getUint32(0);
  const idlen = corps[20];
  const asPub = corps.slice(21, 21 + idlen);
  const chiffre = corps.slice(21 + idlen);
  V('en-tête : rs=4096, clé serveur 65 octets', rs === 4096 && idlen === 65, { rs, idlen });

  const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, nav.privateKey, 256));
  const hkdf = async (s2, ikm, info, L) => {
    const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: s2, info }, k, L * 8));
  };
  const te = s2 => new TextEncoder().encode(s2);
  const cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), r = new Uint8Array(n); let o = 0; for (const x of a) { r.set(x, o); o += x.length; } return r; };
  const ikm = await hkdf(authSecret, ecdh, cat(te('WebPush: info\0'), navPub, asPub), 32);
  const cek = await hkdf(sel, ikm, te('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(sel, ikm, te('Content-Encoding: nonce\0'), 12);
  let clair = null;
  try {
    const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
    clair = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, k, chiffre));
  } catch (err) { /* échec = charge non conforme */ }
  V('la charge SE DÉCHIFFRE (aes128gcm conforme)', !!clair);
  if (clair) {
    V('délimiteur final 0x02 (dernier bloc)', clair[clair.length - 1] === 2);
    const msg = JSON.parse(new TextDecoder().decode(clair.slice(0, -1)));
    V('titre intact après chiffrement/déchiffrement', msg.titre === 'Les gardes 2027 sont générées', msg);
    V('corps + url intacts', msg.corps === 'Planning annuel complet.' && msg.url === './admin.html', msg);
  }
}

console.log('\n═══ N4. Abonnement mort : purgé au passage ═══');
statutPushService = 410; envoisHTTP.length = 0;
const rMort = await appel('/notif-envoyer', { token: 'JETON-BANC', titre: 'x', corps: 'y' });
V('le 410 est rapporté, rien d\'envoyé', rMort.success && rMort.envoyees === 0, rMort);
V('l\'abonnement mort est SUPPRIMÉ du KV', !M.has('notif_sub_FROHLICH'));
const rVide = await appel('/notif-envoyer', { token: 'JETON-BANC', titre: 'x' });
V('sans abonné : succès, zéro envoi', rVide.success && rVide.abonnes === 0, rVide);

console.log('\n═══ N5. sw.js : les gestionnaires existent, la version a monté ═══');
{
  const sw = fs.readFileSync('../sw.js', 'utf8');
  V('version montée (chpg-sw-v3)', sw.includes("VERSION = 'chpg-sw-v3'"));
  V("gestionnaire 'push' présent", /addEventListener\('push'/.test(sw));
  V("gestionnaire 'notificationclick' présent", /addEventListener\('notificationclick'/.test(sw));
  V('le toucher ouvre une page (openWindow)', sw.includes('clients.openWindow'));
  V("l'API GAS reste non interceptée", sw.includes("indexOf('script.google') > -1"));
}

console.log(`\nbanc_notif : ${ok} ✓ / ${ko} ✗`);
if (ko) process.exit(1);
