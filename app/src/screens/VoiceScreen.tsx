import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from "@react-native-voice/voice";
import * as Speech from "expo-speech";
import { strings, Language } from "../i18n/strings";
import { isRTL } from "../i18n/rtl";
import { useResponsive } from "../hooks/useResponsive";
import { sendVoiceText, VoiceAction } from "../api/client";
import { colors, fonts, spacing } from "../theme";
import Card from "../components/Card";
import { KaabaEmblem } from "../components/Illustration";

type Props = {
  language: Language;
  // Lets a recognized voice command ("navigate to Mina") drive the map in
  // NavigationScreen, whose selection state lives up in App.tsx.
  onNavigateToSite: (siteId: string) => void;
};

const RECOGNITION_LOCALE: Record<Language, string> = { en: "en-US", ar: "ar-SA" };
const SPEECH_LANGUAGE: Record<Language, string> = { en: "en-US", ar: "ar-SA" };

export default function VoiceScreen({ language, onNavigateToSite }: Props) {
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const t = strings[language];
  const rtl = isRTL(language);
  const { contentMaxWidth } = useResponsive();
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const transcript = e.value?.[0];
      if (transcript) handleTranscript(transcript);
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setListening(false);
      setReply(e.error?.message ?? "PLACEHOLDER: speech recognition failed");
    };
    Voice.onSpeechEnd = () => setListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  async function handleTranscript(transcript: string) {
    setBusy(true);
    try {
      const data = await sendVoiceText(transcript, languageRef.current);
      setReply(data.reply ?? data.error ?? "");
      if (data.reply) {
        Speech.speak(data.reply, { language: SPEECH_LANGUAGE[languageRef.current] });
      }
      if (data.action) performAction(data.action);
    } catch {
      setReply("PLACEHOLDER: could not reach backend — is it running and are API keys configured?");
    } finally {
      setBusy(false);
    }
  }

  function performAction(action: VoiceAction) {
    if (action.type === "call_emergency") {
      Linking.openURL("tel:999");
    } else if (action.type === "navigate_to_site") {
      onNavigateToSite(action.siteId);
    }
  }

  async function startListening() {
    Speech.stop();
    setReply("");
    try {
      await Voice.start(RECOGNITION_LOCALE[language]);
      setListening(true);
    } catch {
      setReply("PLACEHOLDER: microphone/speech recognition unavailable on this build");
    }
  }

  async function stopListening() {
    try {
      await Voice.stop();
    } catch {
      // no-op — onSpeechError already surfaces failures
    }
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.card, { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }]}>
        <View style={styles.emblem}>
          <KaabaEmblem size={48} />
        </View>
        <Text style={[styles.title, rtl && styles.textRTL]}>{t.voiceTitle}</Text>
        <Text style={[styles.prompt, rtl && styles.textRTL]}>{listening ? t.voiceListening : t.voicePrompt}</Text>
        <Pressable
          style={[styles.button, listening && styles.buttonActive]}
          onPressIn={startListening}
          onPressOut={stopListening}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonIcon}>🎙️</Text>}
        </Pressable>
        {reply ? <Text style={[styles.reply, rtl && styles.textRTL]}>{reply}</Text> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  card: { alignItems: "center", paddingVertical: spacing.xl * 1.5 },
  emblem: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontFamily: fonts.heading, fontWeight: "700", color: colors.textDark, marginBottom: spacing.sm },
  prompt: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, textAlign: "center" },
  textRTL: { textAlign: "center", writingDirection: "rtl" },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: { backgroundColor: colors.primaryDark },
  buttonIcon: { fontSize: 34 },
  reply: { marginTop: spacing.xl, fontSize: 16, textAlign: "center", color: colors.textDark },
});
