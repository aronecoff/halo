import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { ScreenWrap } from "../ui/ScreenWrap";
import { HaloMark, ChatBubble, TypingIndicator } from "../ui";
import { palette } from "../../constants/colors";
import { apiCall } from "../../lib/api";

interface OnboardingScreenProps {
  userName: string;
  onNext: () => void;
  onProfileReady: (
    profile: any,
    conversation: Array<{ role: string; content: string }>
  ) => void;
}

interface DisplayMessage {
  sender: "iris" | "user" | "system";
  text: string;
  isInferenceCallout?: boolean;
}

export function OnboardingScreen({
  userName,
  onNext,
  onProfileReady,
}: OnboardingScreenProps) {
  const firstName = userName.trim().split(" ")[0];
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [qNum, setQNum] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const hasStarted = useRef(false);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }, []);

  // Send first message to IRIS on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function initChat() {
      setTyping(true);
      scrollDown();
      try {
        const res = await apiCall("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `My name is ${firstName}. I just signed up for HALO.`,
              },
            ],
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const irisMsg =
          data.message ||
          "Hey. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me.";
        setMessages([{ sender: "iris", text: irisMsg }]);
        setApiMessages([
          {
            role: "user",
            content: `My name is ${firstName}. I just signed up for HALO.`,
          },
          { role: "assistant", content: JSON.stringify(data) },
        ]);
        setQNum(1);
        if (data.inference) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "system",
              text: `Detected: ${data.inference.trait} (${data.inference.domain})`,
              isInferenceCallout: true,
            },
          ]);
        }
      } catch (e) {
        setMessages([
          {
            sender: "iris",
            text: `Hey, ${firstName}. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me. What is something you could spend hours doing without noticing time pass?`,
          },
        ]);
        setApiMessages([
          {
            role: "user",
            content: `My name is ${firstName}. I just signed up for HALO.`,
          },
          {
            role: "assistant",
            content: JSON.stringify({
              message: `Hey, ${firstName}. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me. What is something you could spend hours doing without noticing time pass?`,
              inference: null,
              profileReady: false,
              profile: null,
            }),
          },
        ]);
        setQNum(1);
      }
      setTyping(false);
      scrollDown();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    initChat();
  }, [firstName, scrollDown]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || typing || done) return;

    setInputText("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    scrollDown();

    const newApiMessages = [
      ...apiMessages,
      { role: "user" as const, content: text },
    ];
    setApiMessages(newApiMessages);

    setTyping(true);
    scrollDown();

    try {
      const res = await apiCall("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updatedApiMessages = [
        ...newApiMessages,
        { role: "assistant" as const, content: JSON.stringify(data) },
      ];
      setApiMessages(updatedApiMessages);

      setMessages((prev) => [...prev, { sender: "iris", text: data.message }]);
      setQNum((q) => q + 1);

      if (data.inference) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "system",
              text: `Detected: ${data.inference.trait} (${data.inference.domain}) \u2014 ${Math.round(data.inference.confidence * 100)}%`,
              isInferenceCallout: true,
            },
          ]);
          scrollDown();
        }, 300);
      }

      if (data.profileReady && data.profile) {
        setDone(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { sender: "system", text: "PROFILE CONSTRUCTION COMPLETE" },
          ]);
          scrollDown();
          onProfileReady(data.profile, updatedApiMessages);
          setTimeout(() => onNext(), 2000);
        }, 800);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "iris",
          text: "I lost my train of thought for a moment. Say that again?",
        },
      ]);
    }

    setTyping(false);
    scrollDown();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputText, typing, done, apiMessages, scrollDown, onNext, onProfileReady]);

  const progress = Math.min(qNum, 5);
  const progressWidth = `${Math.min((progress / 5) * 100, 100)}%`;
  const canSend = inputText.trim().length > 0 && !typing;

  return (
    <ScreenWrap>
      {/* Header */}
      <View style={styles.header}>
        <HaloMark size={20} />
        <View style={styles.headerRight}>
          <Text style={styles.questionLabel}>Question {progress} of ~5</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: progressWidth as any },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}
        {typing && <TypingIndicator />}
      </ScrollView>

      {/* Input */}
      {!done && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              placeholder="Type your response..."
              placeholderTextColor={palette.textGhost}
              editable={!typing}
              returnKeyType="send"
              style={[styles.textInput, { opacity: typing ? 0.5 : 1 }]}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!canSend}
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSend
                    ? palette.orchid
                    : "rgba(139,92,246,0.1)",
                },
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.textSecondary,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: palette.orchid,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    backgroundColor: "rgba(139,92,246,0.04)",
    color: palette.textPrimary,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
