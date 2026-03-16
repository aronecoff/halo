import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IrisOrb } from "./IrisOrb";
import { palette } from "../../constants/colors";

interface ChatMessage {
  sender: "iris" | "user" | "system";
  text: string;
  isInferenceCallout?: boolean;
}

interface ChatBubbleProps {
  msg: ChatMessage;
}

export function ChatBubble({ msg }: ChatBubbleProps) {
  const { sender, text, isInferenceCallout } = msg;

  if (sender === "system") {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{text}</Text>
      </View>
    );
  }

  const isIris = sender === "iris";

  return (
    <View style={[styles.row, isIris ? styles.rowLeft : styles.rowRight]}>
      {isIris && (
        <View style={styles.avatarWrap}>
          <IrisOrb size={28} pulse={false} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isIris ? styles.irisBubble : styles.userBubble,
          isInferenceCallout && styles.inferenceBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isIris ? styles.irisText : styles.userText,
            isInferenceCallout && styles.inferenceText,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowLeft: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  rowRight: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  avatarWrap: {
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  irisBubble: {
    backgroundColor: palette.onyx,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: palette.iris,
    borderBottomRightRadius: 4,
  },
  inferenceBubble: {
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  irisText: {
    color: palette.textPrimary,
  },
  userText: {
    color: palette.white,
  },
  inferenceText: {
    color: palette.orchid,
    fontStyle: "italic",
  },
  systemRow: {
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 24,
  },
  systemText: {
    fontSize: 12,
    color: palette.textGhost,
    textAlign: "center",
  },
});
