import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { colors, fonts, spacing } from "../theme";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import PillButton from "../components/PillButton";
import { AuthUser, fetchCurrentUser, login, logout, signup, updateProfile } from "../api/client";

type Props = { language: Language };

export default function AccountScreen({ language }: Props) {
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  const contentStyle = { maxWidth: contentMaxWidth, alignSelf: "center" as const, width: "100%" as const };

  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => {
        if (u) applyUser(u);
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  function applyUser(u: AuthUser) {
    setUser(u);
    setName(u.name);
    setPhone(u.phone);
    setContactName(u.emergencyContactName);
    setContactPhone(u.emergencyContactPhone);
  }

  async function handleAuthSubmit() {
    if (!email || !password) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const { user: u } = mode === "login" ? await login(email, password) : await signup(email, password);
      applyUser(u);
      setPassword("");
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setEmail("");
    setPassword("");
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const u = await updateProfile({ name, phone });
      applyUser(u);
    } catch {
      // surfaced via unchanged fields; nothing else to do for a demo build
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveEmergencyContact() {
    setSavingProfile(true);
    try {
      const u = await updateProfile({ emergencyContactName: contactName, emergencyContactPhone: contactPhone });
      applyUser(u);
    } catch {
      // surfaced via unchanged fields; nothing else to do for a demo build
    } finally {
      setSavingProfile(false);
    }
  }

  if (checkingSession) {
    return (
      <View style={styles.container}>
        <Card style={contentStyle}>
          <SectionHeader icon="👤" title={t.accountTitle} rtl={rtl} />
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.note, styles.fieldGap, rtl && styles.textRTL]}>{t.checkingSession}</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={contentStyle}>
        <SectionHeader icon="👤" title={t.accountTitle} rtl={rtl} />
        <Text style={[styles.note, rtl && styles.textRTL]}>{t.accountPlaceholderNote}</Text>

        {!user ? (
          <>
            <Text style={[styles.label, rtl && styles.textRTL]}>{t.emailLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.label, styles.fieldGap, rtl && styles.textRTL]}>{t.passwordLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textMuted}
            />
            {authError ? <Text style={[styles.error, rtl && styles.textRTL]}>{authError}</Text> : null}
            <PillButton
              label={authBusy ? "…" : mode === "login" ? t.loginButton : t.signupButton}
              onPress={handleAuthSubmit}
              disabled={!email || !password || authBusy}
              style={styles.actionButton}
              rtl={rtl}
            />
            <Pressable
              onPress={() => {
                setMode(mode === "login" ? "signup" : "login");
                setAuthError("");
              }}
              style={styles.switchModeLink}
            >
              <Text style={[styles.switchModeText, rtl && styles.textRTL]}>
                {mode === "login" ? t.switchToSignup : t.switchToLogin}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.loggedInAs, rtl && styles.textRTL]}>
              {t.loggedInAs} {user.email}
            </Text>

            <Text style={[styles.label, styles.fieldGap, rtl && styles.textRTL]}>{t.nameLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, styles.fieldGap, rtl && styles.textRTL]}>{t.phoneLabel}</Text>
            <TextInput
              style={[styles.input, rtl && styles.textRTL]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
            />

            <PillButton
              label={t.saveChanges}
              icon="✨"
              onPress={saveProfile}
              disabled={savingProfile}
              style={styles.actionButton}
              rtl={rtl}
            />
            <PillButton label={t.logoutButton} onPress={handleLogout} variant="outline" style={styles.gap} rtl={rtl} />
          </>
        )}
      </Card>

      {user ? (
        <Card style={contentStyle}>
          <SectionHeader
            icon="👥"
            title={t.emergencyContactTitle}
            subtitle={t.emergencyContactSubtitle}
            rtl={rtl}
          />
          <Text style={[styles.label, rtl && styles.textRTL]}>{t.emergencyContactNameLabel}</Text>
          <TextInput
            style={[styles.input, rtl && styles.textRTL]}
            value={contactName}
            onChangeText={setContactName}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.label, styles.fieldGap, rtl && styles.textRTL]}>{t.emergencyContactPhoneLabel}</Text>
          <TextInput
            style={[styles.input, rtl && styles.textRTL]}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textMuted}
          />
          <PillButton
            label={t.saveChanges}
            icon="✨"
            onPress={saveEmergencyContact}
            disabled={savingProfile}
            style={styles.actionButton}
            rtl={rtl}
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  note: {
    fontSize: 13,
    color: "#856404",
    backgroundColor: "#FFF3CD",
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  error: {
    fontSize: 13,
    color: colors.white,
    backgroundColor: "#C0392B",
    padding: spacing.sm,
    borderRadius: 10,
    marginTop: spacing.md,
  },
  label: { fontSize: 14, fontFamily: fonts.body, color: colors.textDark, marginBottom: spacing.xs },
  fieldGap: { marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textDark,
  },
  loggedInAs: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: spacing.sm },
  actionButton: { marginTop: spacing.lg },
  gap: { marginTop: spacing.sm },
  switchModeLink: { marginTop: spacing.md, alignItems: "center" },
  switchModeText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
