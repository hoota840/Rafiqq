// PREVIEW-ONLY COPY — paste this into a fresh Snack at https://snack.expo.dev (as App.js)
// to view the app instantly in your browser or on your phone via Expo Go, with zero local
// install. Flattened, dependency-light stand-in for the real app (no react-navigation, no
// react-native-maps, no expo-av mic recording) so it drops into Snack's default project with
// no extra setup. Restyled to match the design reference in Aseels_screenshoots/ (cream
// background, teal-green accent, serif headings, rounded cards, pill buttons, floating mic
// button), one continuous scrollable page holding every module with a hamburger (☰) menu
// of jump links instead of separate screens, small View-based illustrations (mosque/Kaaba/
// mountain marks — no image assets or SVG library needed), a responsive max content width,
// and full Arabic RTL mirroring. The real, full source of truth is app/App.tsx and app/src/.

import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
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
  useWindowDimensions,
} from 'react-native';

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
    voiceTitle: 'Talk to Rafiqq',
    voicePrompt: "Snack's browser preview can't use the real microphone - tap a sample command below to try the same pipeline a real transcript would use.",
    navigationTitle: 'Navigation',
    navigationPlaceholder: 'Live map data from OpenStreetMap - indoor positioning inside Masjid al-Haram and official site boundaries have not been sourced yet.',
    navigationHint: 'Tap a pin to select a site',
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
    tabs: { voice: 'Voice', navigation: 'Navigation', guide: 'Guide', health: 'Health', account: 'Account' },
  },
  ar: {
    voiceTitle: 'تحدث مع رفيق',
    voicePrompt: 'لا يمكن لمعاينة المتصفح في Snack استخدام الميكروفون الحقيقي - اضغط على أحد الأوامر التجريبية أدناه لتجربة نفس المسار الذي سيستخدمه نص صوتي حقيقي.',
    navigationTitle: 'الملاحة',
    navigationPlaceholder: 'بيانات خريطة حية من OpenStreetMap - تحديد المواقع الداخلي داخل المسجد الحرام والحدود الرسمية للمواقع لم يتم الحصول عليها بعد.',
    navigationHint: 'اضغط على أي دبوس لاختيار الموقع',
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
    tabs: { voice: 'صوت', navigation: 'ملاحة', guide: 'دليل', health: 'صحة', account: 'الحساب' },
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

const SITES = [
  { id: 'kaaba', label: { en: 'The Kaaba', ar: 'الكعبة' }, Mark: KaabaEmblem },
  { id: 'haram', label: { en: 'Masjid al-Haram', ar: 'المسجد الحرام' }, Mark: MosqueMark },
  { id: 'mina', label: { en: 'Mina', ar: 'منى' }, Mark: MosqueMark },
  { id: 'arafat', label: { en: 'Arafat', ar: 'عرفات' }, Mark: MosqueMark },
  { id: 'muzdalifah', label: { en: 'Muzdalifah', ar: 'مزدلفة' }, Mark: MosqueMark },
  { id: 'jabal_al_nour', label: { en: 'Jabal al-Nour', ar: 'جبل النور' }, Mark: MountainMark },
  { id: 'thawr', label: { en: 'Jabal Thawr', ar: 'جبل ثور' }, Mark: MountainMark },
  { id: 'nabawi', label: { en: 'Masjid an-Nabawi', ar: 'المسجد النبوي' }, Mark: MosqueMark },
  { id: 'quba', label: { en: 'Quba Mosque', ar: 'مسجد قباء' }, Mark: MosqueMark },
];

// Pilgrimage-specific icons for the nav menu, one per destination.
const TAB_ICONS = { voice: '🎙️', navigation: '🧭', guide: '📖', health: '❤️', account: '👤' };

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

// Sits on the reading-order "end" side: right for English, mirrored to the left for Arabic.
function FloatingMicButton({ onPress, rtl }) {
  return (
    <Pressable style={[floatStyles.button, rtl ? { left: 20 } : { right: 20 }]} onPress={onPress}>
      <Text style={{ fontSize: 24 }}>🎙️</Text>
    </Pressable>
  );
}

// Snack's browser preview can't use the real microphone (@react-native-voice/
// voice is a native module, see CLAUDE.md) - these three buttons send canned
// text through the exact same backend/app pipeline a real transcript would,
// so the in-app command handling (navigate / call emergency) is still
// testable here even without real speech input.
const DEMO_PROMPTS = [
  { key: 'ask', en: 'Tell me about the Kaaba', ar: 'أخبرني عن الكعبة' },
  { key: 'navigate', en: 'Take me to Mina', ar: 'خذني إلى منى' },
  { key: 'emergency', en: 'I need emergency help', ar: 'أحتاج مساعدة طارئة' },
];

function VoiceScreen({ t, language, onNavigateToSite }) {
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');
  const { contentMaxWidth } = useResponsive();

  async function sendDemoText(text) {
    setBusy(true);
    setReply('');
    try {
      const res = await fetch(API_BASE + '/api/voice/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      setReply(data.reply || data.error || '');
      if (data.action && data.action.type === 'call_emergency') {
        Linking.openURL('tel:999');
      } else if (data.action && data.action.type === 'navigate_to_site') {
        onNavigateToSite(data.action.siteId);
      }
    } catch (e) {
      setReply('PLACEHOLDER: could not reach backend.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ paddingTop: 20 }}>
      <Card style={{ alignItems: 'center', paddingVertical: 42, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <View style={{ marginBottom: 20 }}>
          <KaabaEmblem size={48} />
        </View>
        <Text style={{ fontSize: 24, fontFamily: fontHeading, fontWeight: '700', color: colors.textDark, marginBottom: 8 }}>
          {t.voiceTitle}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 28, textAlign: 'center' }}>
          {t.voicePrompt}
        </Text>
        {busy ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 12 }} /> : null}
        {DEMO_PROMPTS.map((p) => (
          <PillButton
            key={p.key}
            label={p[language]}
            onPress={() => sendDemoText(p[language])}
            disabled={busy}
            variant={p.key === 'emergency' ? undefined : 'outline'}
            style={p.key === 'emergency' ? { backgroundColor: colors.danger, marginTop: 8 } : { marginTop: 8 }}
          />
        ))}
        {reply ? <Text style={{ marginTop: 28, fontSize: 16, textAlign: 'center', color: colors.textDark }}>{reply}</Text> : null}
      </Card>
    </View>
  );
}

// selectedId/onSelectSite are lifted up to App() so a voice command
// ("take me to Mina") can drive the map too, not just a tap.
function NavigationScreen({ t, rtl, selectedId, onSelectSite }) {
  const { contentMaxWidth } = useResponsive();
  const isWeb = Platform.OS === 'web';
  // Real coordinates (approximate — general-knowledge landmarks, not
  // surveyed). The Makkah-corridor 3 also have a schematic xPct/yPct for the
  // native (non-web) fallback pin layout; the 4 farther sites (Madinah is
  // ~340km away) only make sense on the real web map, not that schematic, so
  // they're web-only.
  const coreSites = [
    { id: 'haram', label: t.navigationSiteHaram, lat: 21.4225, lng: 39.8262, xPct: 18, yPct: 65 },
    { id: 'mina', label: t.navigationSiteMina, lat: 21.4133, lng: 39.8933, xPct: 48, yPct: 45 },
    { id: 'arafat', label: t.navigationSiteArafat, lat: 21.3549, lng: 39.984, xPct: 80, yPct: 28 },
  ];
  const extraWebSites = [
    { id: 'muzdalifah', label: t.navigationSiteMuzdalifah, lat: 21.3833, lng: 39.95 },
    { id: 'nabawi', label: t.navigationSiteNabawi, lat: 24.4672, lng: 39.6111 },
    { id: 'quba', label: t.navigationSiteQuba, lat: 24.4396, lng: 39.6169 },
    { id: 'thawr', label: t.navigationSiteThawr, lat: 21.3742, lng: 39.8395 },
  ];
  const sites = isWeb ? coreSites.concat(extraWebSites) : coreSites;
  const selected = sites.find((s) => s.id === selectedId) || sites[0];
  // Snack's browser preview runs on the web, where a plain <iframe> works —
  // unlike react-native-webview (native-only, what the real app uses via
  // LeafletMapView.tsx on an actual phone). Live OpenStreetMap tiles, free,
  // no API key. Re-centers on whichever site is selected (needed now that
  // Madinah sites are hundreds of km from the Makkah corridor).
  const zoomDelta = 0.08;
  const mapUrl =
    'https://www.openstreetmap.org/export/embed.html?bbox=' +
    (selected.lng - zoomDelta) + ',' + (selected.lat - zoomDelta) + ',' +
    (selected.lng + zoomDelta) + ',' + (selected.lat + zoomDelta) +
    '&layer=mapnik&marker=' + selected.lat + ',' + selected.lng;

  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <SectionHeader icon="🧭" title={t.navigationTitle} rtl={rtl} />
        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'flex-start', backgroundColor: '#FFF3CD', padding: 16, borderRadius: 22, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, marginHorizontal: 8 }}>⚠️</Text>
          <Text style={{ flex: 1, color: '#856404', fontSize: 15, lineHeight: 21, textAlign: rtl ? 'right' : 'left' }}>{t.navigationPlaceholder}</Text>
        </View>
      </View>
      <View style={{ height: 320, marginHorizontal: 16, marginBottom: 16, borderRadius: 22, overflow: 'hidden', maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        {isWeb ? (
          React.createElement('iframe', {
            key: mapUrl,
            src: mapUrl,
            title: 'Map',
            loading: 'lazy',
            style: { border: 0, width: '100%', height: '100%' },
          })
        ) : (
          <View style={{ flex: 1, backgroundColor: '#EFE7D6' }}>
            {sites.map((site) => {
              const active = site.id === selectedId;
              return (
                <Pressable
                  key={site.id}
                  onPress={() => onSelectSite(site.id)}
                  style={{ position: 'absolute', left: `${site.xPct}%`, top: `${site.yPct}%`, alignItems: 'center', width: 90, marginLeft: -45, marginTop: -18 }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? colors.primary : colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                  </View>
                  <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: active ? colors.primaryDark : colors.textDark, textAlign: 'center' }} numberOfLines={1}>
                    {site.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: colors.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textDark }}>{selected ? selected.label : t.navigationHint}</Text>
        </View>
      </View>
      {isWeb ? (
        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', gap: 8 }}>
          {sites.map((site) => (
            <PillButton
              key={site.id}
              label={site.label}
              onPress={() => onSelectSite(site.id)}
              variant={site.id === selectedId ? 'primary' : 'outline'}
              rtl={rtl}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function GuideScreen({ t, language, rtl }) {
  const [info, setInfo] = useState('');
  const { contentMaxWidth } = useResponsive();

  async function onSelect(id) {
    try {
      const res = await fetch(API_BASE + '/api/guide/site/' + id);
      const data = await res.json();
      setInfo(data[language] || data.error || '');
    } catch (e) {
      setInfo('PLACEHOLDER: could not reach backend guide service.');
    }
  }

  return (
    <View style={{ paddingTop: 20 }}>
      <Card style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
        <SectionHeader icon="🔍" title={t.guideTitle} subtitle={t.guideSubtitle} rtl={rtl} />
        <FlatList
          data={SITES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => onSelect(item.id)}>
              <View style={{ marginHorizontal: 16 }}>
                <item.Mark size={32} />
              </View>
              <Text style={{ fontSize: 16, color: colors.textDark, textAlign: rtl ? 'right' : 'left' }}>{item.label[language]}</Text>
            </Pressable>
          )}
        />
        {info ? <Text style={{ marginTop: 16, fontSize: 14, lineHeight: 20, color: colors.textDark, textAlign: rtl ? 'right' : 'left' }}>{info}</Text> : null}
      </Card>
    </View>
  );
}

function HealthScreen({ t, rtl }) {
  const [fatigue, setFatigue] = useState(3);
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [mobilityAssist, setMobilityAssist] = useState(false);
  const [status, setStatus] = useState('none');
  const { contentMaxWidth } = useResponsive();
  const cardStyle = { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' };
  const textAlign = rtl ? 'right' : 'left';

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
        <StepSlider value={fatigue} max={10} onChange={setFatigue} />

        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', marginTop: 16, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign }}>{t.ageLabel}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, color: colors.textDark, textAlign }}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.textDark, marginBottom: 4, textAlign }}>{t.conditionsLabel}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, color: colors.textDark, textAlign }}
              value={conditions}
              onChangeText={setConditions}
              placeholder={t.conditionsPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.toggleTrackOn, borderRadius: 16, padding: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 15, color: colors.textDark, flex: 1, marginHorizontal: 8, textAlign }}>{t.mobilityLabel}</Text>
          <Switch value={mobilityAssist} onValueChange={setMobilityAssist} trackColor={{ true: colors.toggleTrackOn, false: colors.border }} thumbColor={colors.white} />
        </View>

        <PillButton label={t.saveProfile} icon="✨" onPress={() => {}} style={{ marginTop: 20 }} rtl={rtl} />
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

const SECTION_ORDER = ['voice', 'navigation', 'guide', 'health', 'account'];

export default function App() {
  const [language, setLanguage] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  // Lifted out of NavigationScreen so a voice demo command ("Take me to
  // Mina") can select a site on the map too, not just a tap.
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

  function navigateToSite(siteId) {
    setSelectedSiteId(siteId);
    scrollToSection('navigation');
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
        <View onLayout={recordOffset('voice')}>
          <VoiceScreen t={t} language={language} onNavigateToSite={navigateToSite} />
        </View>
        <View onLayout={recordOffset('navigation')}>
          <NavigationScreen t={t} rtl={rtl} selectedId={selectedSiteId} onSelectSite={setSelectedSiteId} />
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

      <FloatingMicButton onPress={() => scrollToSection('voice')} rtl={rtl} />

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

const floatStyles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
