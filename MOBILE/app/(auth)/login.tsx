import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { palette } from "../../constants/colors";
import * as Linking from "expo-linking";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const redirectUrl = Linking.createURL("/(main)");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.orb} />
          <Text style={styles.logoText}>HALO</Text>
          <Text style={styles.subtitle}>Agent-Mediated Human Connection</Text>
        </View>

        {sent ? (
          <View style={styles.sentContainer}>
            <Text style={styles.sentText}>Check your email</Text>
            <Text style={styles.sentSubtext}>
              We sent a magic link to {email}
            </Text>
            <Pressable
              onPress={() => setSent(false)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try a different email</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={palette.textGhost}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <ActivityIndicator color={palette.void} />
              ) : (
                <Text style={styles.buttonText}>CONTINUE</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.void,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  orb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.iris,
    marginBottom: 16,
    opacity: 0.9,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 12,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    color: palette.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  input: {
    backgroundColor: palette.obsidian,
    borderWidth: 1,
    borderColor: palette.slate,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.textPrimary,
    fontSize: 16,
  },
  error: {
    color: palette.alert,
    fontSize: 13,
  },
  button: {
    backgroundColor: palette.iris,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: palette.void,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
  },
  sentContainer: {
    alignItems: "center",
    gap: 12,
  },
  sentText: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "500",
  },
  sentSubtext: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: palette.orchid,
    fontSize: 13,
  },
});
