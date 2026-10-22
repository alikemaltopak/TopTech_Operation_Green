import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

let env: RulesTestEnvironment;
const read = (f: string) => fs.readFileSync(process.env[`RULES_${f.split('.')[0].toUpperCase()}`] || path.resolve(__dirname, '..', f), 'utf8');

// Web kullanıcısı: belge kimliği e-postadan üretilir (lib/db.ts ile aynı)
const webId = (email: string) => email.replaceAll('.', '_').replaceAll('@', '_');
const ALI = 'ali.kemal@example.com';
const web = (uid: string, email: string, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified });
const anon = () => env.unauthenticatedContext();

const FLUTTER = 'artifacts/remote-irrigation-app';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'toptech-rules-test',
    firestore: { rules: read('firestore.rules') },
    storage: { rules: read('storage.rules') },
  });
});
afterAll(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', webId(ALI)), { email: ALI, tankCapacity: 3000 });
    await setDoc(doc(db, `users/${webId(ALI)}/lands/l1`), { name: 'Zeytinlik', phoneNumber: '+905551112233', coordinates: '38.49, 27.52' });
    await setDoc(doc(db, `${FLUTTER}/authorized_users/admin1`), { email: 'admin@sirket.com', role: 'admin', active: true });
    await setDoc(doc(db, `${FLUTTER}/authorized_users/tech1`), { email: 'kurulum@sirket.com', role: 'installer', active: true });
    await setDoc(doc(db, `${FLUTTER}/authorized_users/old1`), { email: 'eski@sirket.com', role: 'installer', active: false });
    await setDoc(doc(db, `${FLUTTER}/users/tech1/lands/a1`), { name: 'Bağ', phoneNumber: '+905557778899' });
  });
});

describe('Web uygulaması: kullanıcı verileri', () => {
  it('kullanıcı kendi arazilerini ve ayarlarını okuyup yazabilir', async () => {
    const db = web('u1', ALI).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', webId(ALI))));
    await assertSucceeds(getDocs(collection(db, `users/${webId(ALI)}/lands`)));
    await assertSucceeds(addDoc(collection(db, `users/${webId(ALI)}/history`), { landName: 'Zeytinlik' }));
    await assertSucceeds(updateDoc(doc(db, 'users', webId(ALI)), { tankCapacity: 5000 }));
  });

  it('başka bir kullanıcı (giriş yapmış olsa bile) başkasının verilerini göremez ve silemez', async () => {
    const db = web('u2', 'saldirgan@example.com').firestore();
    await assertFails(getDoc(doc(db, 'users', webId(ALI))));
    await assertFails(getDocs(collection(db, `users/${webId(ALI)}/lands`)));
    await assertFails(deleteDoc(doc(db, `users/${webId(ALI)}/lands/l1`)));
    await assertFails(getDocs(collection(db, 'users')));
  });

  it('e-postası doğrulanmamış hesap kendi verisine bile erişemez', async () => {
    await assertFails(getDoc(doc(web('u1', ALI, false).firestore(), 'users', webId(ALI))));
  });

  it('çakışan e-posta (ali_kemal@ ↔ ali.kemal@) doğrulanmamışsa başkasının verisine erişemez', async () => {
    await assertFails(getDoc(doc(web('u3', 'ali_kemal@example.com', false).firestore(), 'users', webId(ALI))));
  });

  it('oturum açmamış biri hiçbir şeye erişemez', async () => {
    await assertFails(getDoc(doc(anon().firestore(), 'users', webId(ALI))));
    await assertFails(getDocs(collection(anon().firestore(), `${FLUTTER}/users/tech1/lands`)));
  });
});

describe('Flutter uygulaması: yetkili hesaplar', () => {
  it('yetkili kurulum hesabı kendi arazilerini okuyup yazabilir', async () => {
    const db = env.authenticatedContext('tech1').firestore();
    await assertSucceeds(getDocs(collection(db, `${FLUTTER}/users/tech1/lands`)));
    await assertSucceeds(addDoc(collection(db, `${FLUTTER}/users/tech1/history`), { landName: 'Bağ', status: 'active' }));
  });

  it('başka bir yetkili hesabın verisi okunamaz', async () => {
    await assertFails(getDocs(collection(env.authenticatedContext('admin1').firestore(), `${FLUTTER}/users/tech1/lands`)));
  });

  it('listede olmayan veya pasifleştirilmiş hesap veri göremez', async () => {
    await assertFails(getDocs(collection(env.authenticatedContext('yabanci').firestore(), `${FLUTTER}/users/yabanci/lands`)));
    await assertFails(getDocs(collection(env.authenticatedContext('old1').firestore(), `${FLUTTER}/users/old1/lands`)));
  });

  it('yetkili listesini sadece admin yönetir; kimse kendini admin yapamaz', async () => {
    const admin = env.authenticatedContext('admin1').firestore();
    await assertSucceeds(getDocs(collection(admin, `${FLUTTER}/authorized_users`)));
    await assertSucceeds(setDoc(doc(admin, `${FLUTTER}/authorized_users/new1`), { email: 'yeni@sirket.com', role: 'installer', active: true }));
    await assertSucceeds(updateDoc(doc(admin, `${FLUTTER}/authorized_users/tech1`), { active: false }));

    const tech = env.authenticatedContext('tech1').firestore();
    await assertSucceeds(getDoc(doc(tech, `${FLUTTER}/authorized_users/tech1`)));
    await assertFails(getDocs(collection(tech, `${FLUTTER}/authorized_users`)));
    await assertFails(updateDoc(doc(tech, `${FLUTTER}/authorized_users/tech1`), { role: 'admin' }));
    await assertFails(setDoc(doc(env.authenticatedContext('yabanci').firestore(), `${FLUTTER}/authorized_users/yabanci`), { email: 'x@x.com', role: 'admin', active: true }));
  });

  it('web kullanıcısı Flutter verisine, Flutter kullanıcısı web verisine erişemez', async () => {
    await assertFails(getDocs(collection(web('u1', ALI).firestore(), `${FLUTTER}/users/tech1/lands`)));
    await assertFails(getDoc(doc(env.authenticatedContext('tech1', { email: 'kurulum@sirket.com', email_verified: false }).firestore(), 'users', webId(ALI))));
  });
});

describe('Storage: profil fotoğrafları', () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  it('kullanıcı kendi klasörüne resim yükleyebilir', async () => {
    await assertSucceeds(uploadBytes(ref(web('u1', ALI).storage(), 'profiles/u1/1.png'), png, { contentType: 'image/png' }));
  });
  it('başkasının klasörüne, resim olmayan dosya veya 5 MB üstü yüklenemez', async () => {
    const st = web('u1', ALI).storage();
    await assertFails(uploadBytes(ref(st, 'profiles/u2/1.png'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(st, 'profiles/u1/x.html'), png, { contentType: 'text/html' }));
    await assertFails(uploadBytes(ref(st, 'profiles/u1/big.png'), new Uint8Array(5 * 1024 * 1024 + 1), { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(anon().storage(), 'profiles/u1/1.png'), png, { contentType: 'image/png' }));
  });
});
