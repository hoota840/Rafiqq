// PREVIEW-ONLY COPY — paste this into a fresh Snack at https://snack.expo.dev (as App.js)
// to view the app instantly in your browser or on your phone via Expo Go, with zero local
// install. Flattened, dependency-light stand-in for the real app (no react-navigation, no
// react-native-maps, no expo-av mic recording) so it drops into Snack's default project with
// no extra setup. Restyled to match the design reference in Aseels_screenshoots/ (cream
// background, teal-green accent, serif headings, rounded cards, pill buttons), one
// continuous scrollable page holding Navigation/Guide/Health/Account with a hamburger (☰)
// menu of jump links instead of separate screens, small View-based illustrations (mosque/
// Kaaba/mountain marks — no image assets or SVG library needed), a responsive max content
// width, and full Arabic RTL mirroring. The real, full source of truth is app/App.tsx and
// app/src/.

import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Switch,
  ScrollView,
  Platform,
  Modal,
  Linking,
  Animated,
  useWindowDimensions,
} from 'react-native';
import * as Speech from 'expo-speech';

// Snack runs in the cloud and can NOT reach "localhost" on your laptop — that's
// why Snack said it "cannot reach the backend". Deployed on Render (free tier,
// see backend/README.md "Deploying"); update this if the backend is redeployed
// elsewhere. Render's free tier spins down after ~15min idle, so the first
// request after a while may take ~30-60s to wake it up.
const API_BASE = 'https://rafiqq-backend.onrender.com';
const CONTENT_MAX_WIDTH = 640;
const TOP_BAR_HEIGHT = 60;
// Gap below the safe-area/status-bar so the bar sits a little lower instead of
// flush against the very top edge.
const TOP_BAR_GAP = 14;

const colors = {
  background: '#FAF3E7',
  card: '#FFFFFF',
  primary: '#3C7F63',
  primaryDark: '#2F6650',
  primaryLight: '#BFE3D6',
  toggleTrackOn: '#CFE9F5',
  border: '#EAE2D0',
  textDark: '#1F2D28',
  textMuted: '#6B7280',
  danger: '#C0392B',
  white: '#FFFFFF',
  gold: '#C9A227',
};
const fontHeading = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const strings = {
  en: {
    navigationTitle: 'Navigation',
    navigationPlaceholder: 'Live map data from OpenStreetMap - indoor positioning inside Masjid al-Haram and official site boundaries have not been sourced yet.',
    navigationHint: 'Tap a pin to select a site',
    listenButton: 'Listen',
    navigationSiteHaram: 'Masjid al-Haram',
    navigationSiteMina: 'Mina',
    navigationSiteArafat: 'Arafat',
    navigationSiteMuzdalifah: 'Muzdalifah',
    navigationSiteNabawi: 'Masjid an-Nabawi',
    navigationSiteQuba: 'Quba Mosque',
    navigationSiteThawr: 'Jabal Thawr',
    guideTitle: 'Site Guide',
    guideSubtitle: 'Tap a site to hear its history and significance',
    healthProfileTitle: 'Health Profile',
    fatigueLabel: 'Fatigue level',
    ageLabel: 'Age',
    conditionsLabel: 'Conditions',
    conditionsPlaceholder: 'e.g. asthma',
    mobilityLabel: 'Needs mobility assistance',
    saveProfile: 'Save health profile',
    profileSavedNote: 'Health profile saved',
    emergencyTitle: 'Emergency Escalation',
    emergencyNote: 'The Call Emergency button places a real call to 999. Automatic fall detection and a formal dispatch integration are not wired up yet - the buttons below only demo the alert to confirm to escalate state machine.',
    triggerAlert: 'Trigger test alert',
    imOkay: "I'm okay",
    callEmergencyButton: 'Call Emergency — 999',
    accountTitle: 'Your Account',
    accountPlaceholderNote: 'Signed in against the real backend (email/password + session token) - not persisted across Snack reloads, since this preview keeps no local storage.',
    emailLabel: 'Email',
    passwordLabel: 'Password (min. 8 characters)',
    loginButton: 'Log in',
    signupButton: 'Create account',
    switchToSignup: "Don't have an account? Sign up",
    switchToLogin: 'Already have an account? Log in',
    logoutButton: 'Log out',
    loggedInAs: 'Signed in as',
    nameLabel: 'Full name',
    phoneLabel: 'Phone number',
    emergencyContactTitle: 'Emergency Contact',
    emergencyContactSubtitle: 'This companion can confirm or cancel a health alert on your behalf',
    emergencyContactNameLabel: 'Contact name',
    emergencyContactPhoneLabel: 'Contact phone',
    saveChanges: 'Save changes',
    tabs: { navigation: 'Navigation', guide: 'Guide', health: 'Health', account: 'Account' },
  },
  ar: {
    navigationTitle: 'الملاحة',
    navigationPlaceholder: 'بيانات خريطة حية من OpenStreetMap - تحديد المواقع الداخلي داخل المسجد الحرام والحدود الرسمية للمواقع لم يتم الحصول عليها بعد.',
    navigationHint: 'اضغط على أي دبوس لاختيار الموقع',
    listenButton: 'استماع',
    navigationSiteHaram: 'المسجد الحرام',
    navigationSiteMina: 'منى',
    navigationSiteArafat: 'عرفات',
    navigationSiteMuzdalifah: 'مزدلفة',
    navigationSiteNabawi: 'المسجد النبوي',
    navigationSiteQuba: 'مسجد قباء',
    navigationSiteThawr: 'جبل ثور',
    guideTitle: 'دليل الأماكن',
    guideSubtitle: 'اضغط على أي موقع لسماع تاريخه وأهميته',
    healthProfileTitle: 'الملف الصحي',
    fatigueLabel: 'مستوى الإرهاق',
    ageLabel: 'العمر',
    conditionsLabel: 'الحالات الصحية',
    conditionsPlaceholder: 'مثال: الربو',
    mobilityLabel: 'يحتاج مساعدة في التنقل',
    saveProfile: 'حفظ الملف الصحي',
    profileSavedNote: 'تم حفظ الملف الصحي',
    emergencyTitle: 'التصعيد الطارئ',
    emergencyNote: 'زر الاتصال بالطوارئ يجري اتصالاً حقيقياً بالرقم 999. الكشف التلقائي للسقوط والتكامل الرسمي مع جهات الطوارئ لم يتم ربطهما بعد - الأزرار أدناه تختبر فقط آلية التنبيه ثم التأكيد ثم التصعيد.',
    triggerAlert: 'تجربة تنبيه',
    imOkay: 'أنا بخير',
    callEmergencyButton: 'اتصال بالطوارئ — 999',
    accountTitle: 'حسابك',
    accountPlaceholderNote: 'تسجيل الدخول متصل بخادم حقيقي (بريد إلكتروني/كلمة مرور + رمز جلسة) - لا يُحفظ بعد إعادة تحميل Snack لأن هذه المعاينة لا تحتفظ بتخزين محلي.',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور (٨ أحرف على الأقل)',
    loginButton: 'تسجيل الدخول',
    signupButton: 'إنشاء حساب',
    switchToSignup: 'ليس لديك حساب؟ أنشئ حسابًا',
    switchToLogin: 'لديك حساب بالفعل؟ سجّل الدخول',
    logoutButton: 'تسجيل الخروج',
    loggedInAs: 'تم تسجيل الدخول باسم',
    nameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف',
    emergencyContactTitle: 'جهة اتصال الطوارئ',
    emergencyContactSubtitle: 'يمكن لهذا المرافق تأكيد أو إلغاء تنبيه صحي نيابة عنك',
    emergencyContactNameLabel: 'اسم جهة الاتصال',
    emergencyContactPhoneLabel: 'هاتف جهة الاتصال',
    saveChanges: 'حفظ التغييرات',
    tabs: { navigation: 'ملاحة', guide: 'دليل', health: 'صحة', account: 'الحساب' },
  },
};

// Small brand mark: dome + minaret, built from plain Views (no image asset,
// no SVG library) — used next to the app name in the top bar.
function MosqueMark({ size = 28 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: s * 0.5, height: s * 0.25, borderTopLeftRadius: s * 0.25, borderTopRightRadius: s * 0.25, backgroundColor: colors.primary }} />
      <View style={{ width: s * 0.1, height: s * 0.08, backgroundColor: colors.gold, borderRadius: s * 0.05, position: 'absolute', top: 0 }} />
      <View style={{ width: s * 0.85, height: s * 0.35, backgroundColor: colors.primary, borderRadius: 3 }} />
    </View>
  );
}

// Abstract Kaaba emblem: a dark cube with a gold band, the conventional
// respectful stylization (no figurative/photographic imagery).
function KaabaEmblem({ size = 40 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, borderRadius: s * 0.12, backgroundColor: '#1C1C1C', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: s * 0.32, height: s * 0.16, backgroundColor: colors.gold }} />
      <View style={{ position: 'absolute', alignSelf: 'center', bottom: 0, width: s * 0.1, height: s * 0.28, backgroundColor: colors.gold }} />
    </View>
  );
}

// Simple triangular peak motif for mountain sites (e.g. Jabal al-Nour).
function MountainMark({ size = 40 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: s * 0.5, borderRightWidth: s * 0.5, borderBottomWidth: s * 0.62, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.primary }} />
      <View style={{ position: 'absolute', top: s * 0.06, width: s * 0.22, height: s * 0.22, borderRadius: s * 0.11, backgroundColor: colors.gold }} />
    </View>
  );
}

// Pilgrimage-specific icons for the nav menu, one per destination.
const TAB_ICONS = { navigation: '🧭', guide: '📖', health: '❤️', account: '👤' };

function isRTL(language) {
  return language === 'ar';
}

function useResponsive() {
  const { width } = useWindowDimensions();
  return { isTablet: width >= 700, contentMaxWidth: CONTENT_MAX_WIDTH };
}

function Card({ children, style }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

function SectionHeader({ icon, title, subtitle, rtl }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginHorizontal: 8, color: colors.primary }}>{icon}</Text>
        <Text style={{ fontSize: 20, fontFamily: fontHeading, fontWeight: '700', color: colors.textDark }}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            marginTop: 4,
            marginLeft: rtl ? 0 : 28,
            marginRight: rtl ? 28 : 0,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function PillButton({ label, onPress, variant, icon, style, disabled, rtl }) {
  const bg = variant === 'secondary' ? colors.primaryLight : variant === 'outline' ? colors.white : colors.primary;
  const fg = variant === 'secondary' ? colors.primaryDark : variant === 'outline' ? colors.primary : colors.white;
  const border = variant === 'outline' ? { borderWidth: 1, borderColor: colors.primary } : {};
  return (
    <Pressable
      style={[
        {
          flexDirection: rtl ? 'row-reverse' : 'row',
          borderRadius: 999,
          paddingVertical: 14,
          paddingHorizontal: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          opacity: disabled ? 0.6 : 1,
        },
        border,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{icon} </Text> : null}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

function StepSlider({ value, max, onChange }) {
  const segments = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
      {segments.map((segment) => (
        <Pressable
          key={segment}
          style={{ flex: 1, marginRight: 2, backgroundColor: segment <= value ? colors.primary : colors.border }}
          onPress={() => onChange(segment)}
        />
      ))}
    </View>
  );
}

// Real map tiles rendered as plain <Image> elements positioned with Web
// Mercator math, instead of an iframe running Leaflet.js from a CDN.
// Confirmed live in Snack that the iframe approach's inline <script> silently
// never ran — Snack's own preview page applies its CSP to srcDoc iframes, and
// that CSP evidently doesn't allow the CDN script the map needed. An <Image>
// only needs img-src, not script-src, so there's nothing for that CSP to
// block — and since this is plain React Native (not a browser-only iframe
// trick), it works on native Expo Go too, not just web.
//
// Tiles come from CARTO's free basemaps, not raw tile.openstreetmap.org —
// confirmed live that tile.openstreetmap.org actively enforces OSM's tile
// usage policy (wants a proper identifying User-Agent, which an <Image> tag
// can't set) and served a "not following tile usage policy" warning image
// instead of real tiles. CARTO's basemaps are built for exactly this kind of
// embedding, still built from OpenStreetMap data, still free with no key.
// See CLAUDE.md for the full story.
const TILE_SIZE = 256;
const TILE_SUBDOMAINS = ['a', 'b', 'c', 'd'];
const CATEGORY_ICONS = { hospital: '🏥', police: '👮', tawafa: '🏢', guidance: 'ℹ️', other: '📍' };

function tileUrl(zoom, tx, ty) {
  var subdomain = TILE_SUBDOMAINS[(tx + ty) % TILE_SUBDOMAINS.length];
  return 'https://' + subdomain + '.basemaps.cartocdn.com/light_all/' + zoom + '/' + tx + '/' + ty + '.png';
}

function lonToTileX(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat, zoom) {
  var latRad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

function TileMapView({ sites, selectedId, onSelectSite, centerLat, centerLng, zoom }) {
  // Tile count depends on the container's actual pixel size, which we only
  // know after first layout - nothing renders until then.
  const [size, setSize] = useState(null);
  const centerTileX = lonToTileX(centerLng, zoom);
  const centerTileY = latToTileY(centerLat, zoom);
  const worldTiles = Math.pow(2, zoom);

  var tiles = [];
  if (size) {
    var colsHalf = Math.ceil(size.width / 2 / TILE_SIZE) + 1;
    var rowsHalf = Math.ceil(size.height / 2 / TILE_SIZE) + 1;
    var centerTxInt = Math.floor(centerTileX);
    var centerTyInt = Math.floor(centerTileY);
    for (var dx = -colsHalf; dx <= colsHalf; dx++) {
      for (var dy = -rowsHalf; dy <= rowsHalf; dy++) {
        var ty = centerTyInt + dy;
        if (ty < 0 || ty >= worldTiles) continue;
        var tx = centerTxInt + dx;
        var wrappedTx = ((tx % worldTiles) + worldTiles) % worldTiles;
        tiles.push({
          key: tx + '_' + ty,
          x: (tx - centerTileX) * TILE_SIZE + size.width / 2,
          y: (ty - centerTileY) * TILE_SIZE + size.height / 2,
          tx: wrappedTx,
          ty: ty,
        });
      }
    }
  }

  function toScreen(lat, lng) {
    return {
      x: (lonToTileX(lng, zoom) - centerTileX) * TILE_SIZE + size.width / 2,
      y: (latToTileY(lat, zoom) - centerTileY) * TILE_SIZE + size.height / 2,
    };
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: '#EFE7D6' }}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {!size ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tileUrl(zoom, tile.tx, tile.ty) }}
              style={{ position: 'absolute', left: tile.x, top: tile.y, width: TILE_SIZE, height: TILE_SIZE }}
            />
          ))}
          {sites.map((site) => {
            var pos = toScreen(site.lat, site.lng);
            var active = site.id === selectedId;
            var icon = site.category ? CATEGORY_ICONS[site.category] || '📍' : '📍';
            return (
              <Pressable
                key={site.id}
                onPress={() => onSelectSite(site.id)}
                style={{ position: 'absolute', left: pos.x, top: pos.y, alignItems: 'center', width: 90, marginLeft: -45, marginTop: -18 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? colors.primary : colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
                  <Text style={{ fontSize: 16 }}>{icon}</Text>
                </View>
                <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: active ? colors.primaryDark : colors.textDark, textAlign: 'center' }} numberOfLines={1}>
                  {site.label}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

function NavigationScreen({ t, rtl, language, selectedId, onSelectSite }) {
  const { contentMaxWidth } = useResponsive();
  const [nearbySites, setNearbySites] = useState([]);
  // Bilingual summary shown when a site is selected - same guide content
  // GuideScreen shows, fetched fresh per selection. Fails soft to null for
  // pins with no guide entry (e.g. Overpass-sourced hospitals/police).
  const [story, setStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  // Drives the story card's entrance animation (fade + slide + scale) - pure
  // React Native Animated API, no new dependency, no external service.
  const cardAnim = useRef(new Animated.Value(0)).current;

  // Real hospitals/police/Tawafa offices/guidance centres from OpenStreetMap
  // - same backend endpoint the real app uses (backend/src/services/
  // overpassClient.ts). Fails soft: an empty array just means no extra pins.
  useEffect(() => {
    fetch(API_BASE + '/api/navigation/sites')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setNearbySites(
          (data.sites || []).map(function (s) {
            return { id: s.id, label: s.name, lat: s.lat, lng: s.lng, category: s.category };
          })
        );
      })
      .catch(function () { setNearbySites([]); });
  }, []);

  useEffect(() => {
    Speech.stop();
    if (!selectedId) {
      setStory(null);
      return;
    }
    setStoryLoading(true);
    setStory(null);
    fetch(API_BASE + '/api/guide/site/' + selectedId)
      .then(function (res) { return res.json(); })
      .then(function (data) { setStory(data.error ? null : { en: data.en, ar: data.ar }); })
      .catch(function () { setStory(null); })
      .finally(function () { setStoryLoading(false); });
  }, [selectedId]);

  useEffect(() => {
    if (story) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
  }, [story]);

  function speakStory() {
    if (!story) return;
    Speech.speak(story[language], { language: language === 'ar' ? 'ar-SA' : 'en-US' });
  }

  // Real coordinates (approximate — general-knowledge landmarks, not surveyed).
  const hubSites = [
    { id: 'haram', label: t.navigationSiteHaram, lat: 21.4225, lng: 39.8262 },
    { id: 'mina', label: t.navigationSiteMina, lat: 21.4133, lng: 39.8933 },
    { id: 'arafat', label: t.navigationSiteArafat, lat: 21.3549, lng: 39.984 },
    { id: 'muzdalifah', label: t.navigationSiteMuzdalifah, lat: 21.3833, lng: 39.95 },
    { id: 'nabawi', label: t.navigationSiteNabawi, lat: 24.4672, lng: 39.6111 },
    { id: 'quba', label: t.navigationSiteQuba, lat: 24.4396, lng: 39.6169 },
    { id: 'thawr', label: t.navigationSiteThawr, lat: 21.3742, lng: 39.8395 },
  ];
  const sites = hubSites.concat(nearbySites);
  const selected = sites.find((s) => s.id === selectedId) || sites[0];

  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <SectionHeader icon="🧭" title={t.navigationTitle} rtl={rtl} />
      </View>
      <View style={{ height: 320, marginHorizontal: 16, marginBottom: 16, borderRadius: 22, overflow: 'hidden', maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <TileMapView sites={sites} selectedId={selectedId} onSelectSite={onSelectSite} centerLat={selected.lat} centerLng={selected.lng} zoom={13} />
        {/* Plain <Image> tiles have no built-in attribution control the way
            Leaflet does - required by both OpenStreetMap's and CARTO's terms. */}
        <View style={{ position: 'absolute', right: 6, bottom: 4, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 4, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9, color: '#333' }}>© OpenStreetMap contributors © CARTO</Text>
        </View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: colors.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textDark }}>{selected ? selected.label : t.navigationHint}</Text>
        </View>
      </View>
      {/* Hub sites only (not nearbySites) — those still show as pins on the
          map itself, but a button per hospital/police station would clutter
          this row; it's meant for quick jumps between the named waypoints. */}
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', gap: 8 }}>
        {hubSites.map((site) => (
          <PillButton
            key={site.id}
            label={site.label}
            onPress={() => onSelectSite(site.id)}
            variant={site.id === selectedId ? 'primary' : 'outline'}
            rtl={rtl}
          />
        ))}
      </View>
      {selected && (storyLoading || story) ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 22, padding: 16, marginHorizontal: 16, marginBottom: 16, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
          {storyLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : story ? (
            <Animated.View
              style={{
                opacity: cardAnim,
                transform: [
                  { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                  { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                ],
              }}
            >
              <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={rtl ? { marginLeft: 8 } : { marginRight: 8 }}>
                  {selected.id === 'thawr' ? <MountainMark size={30} /> : <MosqueMark size={30} />}
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textDark, flex: 1 }}>{selected.label}</Text>
                <Pressable onPress={speakStory} hitSlop={8} style={{ backgroundColor: colors.primaryLight, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primaryDark }}>🔊 {t.listenButton}</Text>
                </Pressable>
              </View>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textDark, textAlign: 'right', writingDirection: 'rtl' }}>{story.ar}</Text>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textDark }}>{story.en}</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const GUIDE_SITES = [
  { id: 'haram', label: { en: 'Masjid al-Haram', ar: 'المسجد الحرام' } },
  { id: 'mina', label: { en: 'Mina', ar: 'منى' } },
  { id: 'arafat', label: { en: 'Arafat', ar: 'عرفات' } },
];

function GuideScreen({ t, language, rtl }) {
  const [openId, setOpenId] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const { contentMaxWidth } = useResponsive();

  async function onSelect(id) {
    setOpenId(id);
    setStory(null);
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/guide/site/' + id);
      const data = await res.json();
      setStory(data.error ? null : { en: data.en, ar: data.ar });
    } catch (e) {
      setStory(null);
    } finally {
      setLoading(false);
    }
  }

  const openSite = GUIDE_SITES.find((s) => s.id === openId) || null;

  return (
    <View style={{ paddingTop: 20 }}>
      <Card style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <SectionHeader icon="🔍" title={t.guideTitle} subtitle={t.guideSubtitle} rtl={rtl} />
        <FlatList
          data={GUIDE_SITES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => onSelect(item.id)}>
              <View style={{ marginHorizontal: 16 }}>
                <MosqueMark size={32} />
              </View>
              <Text style={{ fontSize: 16, color: colors.textDark, textAlign: rtl ? 'right' : 'left' }}>{item.label[language]}</Text>
            </Pressable>
          )}
        />
      </Card>

      <Modal visible={!!openId} transparent animationType="fade" onRequestClose={() => setOpenId(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(31, 45, 40, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setOpenId(null)}>
          <Pressable
            style={{ width: '100%', maxWidth: contentMaxWidth, backgroundColor: colors.card, borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={rtl ? { marginLeft: 8 } : { marginRight: 8 }}>
                <MosqueMark size={30} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', fontFamily: fontHeading, color: colors.textDark, flex: 1 }}>{openSite ? openSite.label[language] : ''}</Text>
              <Pressable onPress={() => setOpenId(null)} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>✕</Text>
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : story ? (
              <>
                <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textDark, textAlign: 'right', writingDirection: 'rtl' }}>{story.ar}</Text>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textDark }}>{story.en}</Text>
              </>
            ) : (
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textDark }}>PLACEHOLDER: could not reach backend guide service.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function HealthScreen({ t, rtl }) {
  const [fatigue, setFatigue] = useState(3);
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [mobilityAssist, setMobilityAssist] = useState(false);
  const [status, setStatus] = useState('none');
  const [profileSaved, setProfileSaved] = useState(false);
  const { contentMaxWidth } = useResponsive();
  const cardStyle = { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' };
  const textAlign = rtl ? 'right' : 'left';

  function saveProfile() {
    setProfileSaved(true);
  }
  // Editing any field after saving means the on-screen confirmation would be
  // lying about being up to date, so any change clears it.
  function updateFatigue(v) { setFatigue(v); setProfileSaved(false); }
  function updateAge(v) { setAge(v); setProfileSaved(false); }
  function updateConditions(v) { setConditions(v); setProfileSaved(false); }
  function updateMobilityAssist(v) { setMobilityAssist(v); setProfileSaved(false); }

  async function triggerAlert() {
    try {
      await fetch(API_BASE + '/api/health/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilgrimId: 'demo-pilgrim-1', reason: 'test trigger' }),
      });
    } catch (e) {}
    setStatus('alert');
  }

  async function confirmOk() {
    try {
      await fetch(API_BASE + '/api/health/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilgrimId: 'demo-pilgrim-1', outcome: 'ok' }),
      });
    } catch (e) {}
    setStatus('confirmed_ok');
  }

  // Opens the phone/browser's own dialer pre-filled with 999 (Saudi Arabia's
  // police/general emergency number) - doesn't place the call automatically.
  function callEmergency() {
    Linking.openURL('tel:999');
  }

  return (
    <View style={{ paddingTop: 20 }}>
      <Card style={cardStyle}>
        <SectionHeader icon="♡" title={t.healthProfileTitle} rtl={rtl} />
        <Text style={{ fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign }}>{t.fatigueLabel}: {fatigue}/10</Text>
        <StepSlider value={fatigue} max={10} onChange={updateFatigue} />

        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', marginTop: 16, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign }}>{t.ageLabel}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, color: colors.textDark, textAlign }}
              value={age}
              onChangeText={updateAge}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign }}>{t.conditionsLabel}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, color: colors.textDark, textAlign }}
              value={conditions}
              onChangeText={updateConditions}
              placeholder={t.conditionsPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.toggleTrackOn, borderRadius: 16, padding: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 15, color: colors.textDark, flex: 1, marginHorizontal: 8, textAlign }}>{t.mobilityLabel}</Text>
          <Switch value={mobilityAssist} onValueChange={updateMobilityAssist} trackColor={{ true: colors.toggleTrackOn, false: colors.border }} thumbColor={colors.white} />
        </View>

        <PillButton label={t.saveProfile} icon="✨" onPress={saveProfile} style={{ marginTop: 20 }} rtl={rtl} />
        {profileSaved ? (
          <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '600', color: colors.primaryDark, textAlign: 'center' }}>✓ {t.profileSavedNote}</Text>
        ) : null}
      </Card>

      <Card style={cardStyle}>
        <SectionHeader icon="🚨" title={t.emergencyTitle} rtl={rtl} />
        <Text style={{ fontSize: 13, color: '#856404', backgroundColor: '#FFF3CD', padding: 8, borderRadius: 10, marginBottom: 16, textAlign }}>{t.emergencyNote}</Text>
        <Text style={{ fontSize: 15, marginBottom: 16, color: colors.textDark, textAlign }}>Status: {status}</Text>
        <PillButton label={t.callEmergencyButton} icon="📞" onPress={callEmergency} style={{ marginBottom: 8, backgroundColor: colors.danger }} rtl={rtl} />
        <PillButton label={t.triggerAlert} onPress={triggerAlert} style={{ marginBottom: 8 }} rtl={rtl} />
        <PillButton label={t.imOkay} onPress={confirmOk} variant="secondary" rtl={rtl} />
      </Card>
    </View>
  );
}

// Real auth against backend/src/routes/auth.ts (email/password + JWT). Token
// is kept in React state only (not AsyncStorage) to stay a zero-dependency
// Snack drop-in — so a Snack page reload logs you out. The real app
// (app/src/screens/AccountScreen.tsx) persists the token via AsyncStorage.
function AccountScreen({ t, rtl }) {
  const { contentMaxWidth } = useResponsive();
  const cardStyle = { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' };
  const textAlign = rtl ? 'right' : 'left';

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  async function submitAuth() {
    if (!email || !password) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const res = await fetch(API_BASE + '/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setToken(data.token);
      setUser(data.user);
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      setContactName(data.user.emergencyContactName || '');
      setContactPhone(data.user.emergencyContactPhone || '');
      setPassword('');
    } catch (e) {
      setAuthError(e.message || 'Could not reach backend.');
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setEmail('');
    setPassword('');
  }

  async function saveProfile(patch) {
    try {
      const res = await fetch(API_BASE + '/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) setUser(data.user);
    } catch (e) {}
  }

  const inputStyle = { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, color: colors.textDark, textAlign };
  const labelStyle = { fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign };

  return (
    <View style={{ paddingTop: 20 }}>
      <Card style={cardStyle}>
        <SectionHeader icon="👤" title={t.accountTitle} rtl={rtl} />
        <Text style={{ fontSize: 13, color: colors.textMuted, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 8, borderRadius: 10, marginBottom: 16, textAlign }}>{t.accountPlaceholderNote}</Text>

        {!user ? (
          <>
            <Text style={labelStyle}>{t.emailLabel}</Text>
            <TextInput style={inputStyle} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={[labelStyle, { marginTop: 16 }]}>{t.passwordLabel}</Text>
            <TextInput style={inputStyle} value={password} onChangeText={setPassword} secureTextEntry />
            {authError ? <Text style={{ fontSize: 13, color: colors.white, backgroundColor: '#C0392B', padding: 8, borderRadius: 10, marginTop: 16 }}>{authError}</Text> : null}
            <PillButton label={authBusy ? '…' : (mode === 'login' ? t.loginButton : t.signupButton)} onPress={submitAuth} disabled={!email || !password || authBusy} style={{ marginTop: 20 }} rtl={rtl} />
            <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>{mode === 'login' ? t.switchToSignup : t.switchToLogin}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 8, textAlign }}>{t.loggedInAs} {user.email}</Text>
            <Text style={[labelStyle, { marginTop: 16 }]}>{t.nameLabel}</Text>
            <TextInput style={inputStyle} value={name} onChangeText={setName} />
            <Text style={[labelStyle, { marginTop: 16 }]}>{t.phoneLabel}</Text>
            <TextInput style={inputStyle} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <PillButton label={t.saveChanges} icon="✨" onPress={() => saveProfile({ name, phone })} style={{ marginTop: 20 }} rtl={rtl} />
            <PillButton label={t.logoutButton} onPress={logout} variant="outline" style={{ marginTop: 8 }} rtl={rtl} />
          </>
        )}
      </Card>

      {user ? (
        <Card style={cardStyle}>
          <SectionHeader icon="👥" title={t.emergencyContactTitle} subtitle={t.emergencyContactSubtitle} rtl={rtl} />
          <Text style={labelStyle}>{t.emergencyContactNameLabel}</Text>
          <TextInput style={inputStyle} value={contactName} onChangeText={setContactName} />
          <Text style={[labelStyle, { marginTop: 16 }]}>{t.emergencyContactPhoneLabel}</Text>
          <TextInput style={inputStyle} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <PillButton label={t.saveChanges} icon="✨" onPress={() => saveProfile({ emergencyContactName: contactName, emergencyContactPhone: contactPhone })} style={{ marginTop: 20 }} rtl={rtl} />
        </Card>
      ) : null}
    </View>
  );
}

const SECTION_ORDER = ['navigation', 'guide', 'health', 'account'];

export default function App() {
  const [language, setLanguage] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('haram');
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});

  function recordOffset(name) {
    return (event) => {
      sectionOffsets.current[name] = event.nativeEvent.layout.y;
    };
  }

  function scrollToSection(name) {
    setMenuOpen(false);
    const y = sectionOffsets.current[name] || 0;
    if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(y - 16, 0), animated: true });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: TOP_BAR_GAP, backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
        <View
          style={{
            height: TOP_BAR_HEIGHT,
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <MosqueMark size={26} />
            <Text style={{ fontSize: 20, fontFamily: fontHeading, fontWeight: '700', color: colors.textDark, marginHorizontal: 8 }}>Rafiqq</Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
          >
            <Text style={{ fontSize: 22, color: colors.primary, fontWeight: '700' }}>☰</Text>
          </Pressable>
        </View>
      </View>

      {/* One continuous scrollable page holding every module end to end; the
          hamburger menu below scrolls to a section instead of swapping screens. */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View onLayout={recordOffset('navigation')}>
          <NavigationScreen t={t} rtl={rtl} language={language} selectedId={selectedSiteId} onSelectSite={setSelectedSiteId} />
        </View>
        <View onLayout={recordOffset('guide')}>
          <GuideScreen t={t} language={language} rtl={rtl} />
        </View>
        <View onLayout={recordOffset('health')}>
          <HealthScreen t={t} rtl={rtl} />
        </View>
        <View onLayout={recordOffset('account')}>
          <AccountScreen t={t} rtl={rtl} />
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(31, 45, 40, 0.35)' }} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={{ alignSelf: 'center', width: '94%', maxWidth: contentMaxWidth, marginTop: TOP_BAR_GAP + TOP_BAR_HEIGHT, backgroundColor: colors.card, borderRadius: 22, paddingVertical: 8, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            onPress={(e) => e.stopPropagation()}
          >
            {SECTION_ORDER.map((name) => (
              <Pressable
                key={name}
                onPress={() => scrollToSection(name)}
                style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 22 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 }}>
                  <Text style={{ fontSize: 20 }}>{TAB_ICONS[name]}</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textDark, textAlign: rtl ? 'right' : 'left' }}>
                  {t.tabs[name]}
                </Text>
              </Pressable>
            ))}

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'center', paddingVertical: 4 }}>
              <Pressable
                hitSlop={8}
                style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 999, marginHorizontal: 4, backgroundColor: language === 'en' ? colors.primaryLight : 'transparent' }}
                onPress={() => setLanguage('en')}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: language === 'en' ? colors.primaryDark : colors.textMuted }}>EN</Text>
              </Pressable>
              <Pressable
                hitSlop={8}
                style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 999, marginHorizontal: 4, backgroundColor: language === 'ar' ? colors.primaryLight : 'transparent' }}
                onPress={() => setLanguage('ar')}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: language === 'ar' ? colors.primaryDark : colors.textMuted }}>AR</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
