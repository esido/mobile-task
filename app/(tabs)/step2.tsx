import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useRef, useState } from "react";
import {
  Animated,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const numbers = [{ name: "1" }, { name: "5" }, { name: "8" }, { name: "9" }];

const numberWords: Record<string, string[]> = {
  "1": ["1", "one"],
  "5": ["5", "five"],
  "8": ["8", "eight"],
  "9": ["9", "nine"],
};

export default function Step2Screen() {
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [items, setItems] = useState(numbers);
  const scale = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  const handleSelect = (item: any) => {
    setSelected(item);
    setMessage("");
    setListening(false);

    Animated.spring(scale, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    Speech.speak(item.name, { language: "en-US" });
  };

  const startListening = async () => {
    if (!selected) return;

    if (listening) {
      // 🛑 Останавливаем запись
      setListening(false);
      setMessage("🛑 Stopping recording...");

      try {
        await recordingRef.current?.stopAndUnloadAsync();
        const uri = recordingRef.current?.getURI();
        console.log("🎤 File saved at:", uri);

        if (uri) await sendToSTT(uri, selected.name);
      } catch (error) {
        console.error("Stop error:", error);
        setMessage("⚠️ Error stopping recording");
      }

      return;
    }

    setMessage("🎙️ Start recording...");
    setListening(true);

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: 2,
          audioQuality: 0,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: undefined,
          bitsPerSecond: undefined,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
    } catch (error) {
      console.error("Start error:", error);
      setMessage("⚠️ Error starting recording");
      setListening(false);
    }
  };

  const sendToSTT = async (uri: string, correctWord: string) => {
    try {
      setMessage("📤 Uploading audio to STT...");
      console.log("📤 Uploading audio to STT:", uri);

      const formData = new FormData();
      const fileData: any = {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
      };
      formData.append("file", fileData);

      const response = await fetch("https://stt.soof.uz/stt", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "accept-language": "en",
        },
        body: formData,
      });

      const result = await response.json();
      console.log("STT result:", result);

      let recognized = "";
      if (typeof result === "string") recognized = result.trim().toLowerCase();
      else if (result.text) recognized = result.text.trim().toLowerCase();
      else if (result.result) recognized = result.result.trim().toLowerCase();
      else if (result.transcript)
        recognized = result.transcript.trim().toLowerCase();
      else {
        setMessage("⚠️ Recognition failed");
        return;
      }

      console.log("Recognized:", recognized);

      const validOptions = numberWords[correctWord] || [];
      const isCorrect = validOptions.some((opt) =>
        recognized.includes(opt.toLowerCase())
      );

      if (isCorrect) {
        setMessage("✅ Success!");
        setItems((prev) => prev.filter((i) => i.name !== correctWord));
      } else {
        setMessage(`❌ You said: ${recognized}`);
      }
    } catch (error) {
      console.error("STT error:", error);
      setMessage("⚠️ Recognition error");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity key={item.name} onPress={() => handleSelect(item)}>
            <Animated.View
              style={[
                styles.numberBox,
                selected?.name === item.name && { transform: [{ scale }] },
              ]}
            >
              <Text style={styles.number}>{item.name}</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <View style={{ marginTop: 30 }}>
          <Button
            title={listening ? "🛑 Stop Listening" : "🎙️ Start Listening"}
            onPress={startListening}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
  },
  numberBox: {
    width: 100,
    height: 100,
    backgroundColor: "#f2f2f2",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  number: {
    fontSize: 36,
    fontWeight: "bold",
  },
  message: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 18,
  },
});
