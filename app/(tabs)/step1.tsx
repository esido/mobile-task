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

const words = [
  { name: "book", image: require("../../assets/images/book.jpg") },
  { name: "pen", image: require("../../assets/images/pen.jpg") },
  { name: "apple", image: require("../../assets/images/apple.png") },
  { name: "car", image: require("../../assets/images/car.png") },
];

export default function Step1Screen() {
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [items, setItems] = useState(words);
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

      if (recognized.includes(correctWord.toLowerCase())) {
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
            <Animated.Image
              source={item.image}
              style={[
                styles.image,
                selected?.name === item.name && { transform: [{ scale }] },
              ]}
            />
            {selected?.name === item.name && (
              <Text style={styles.label}>{item.name}</Text>
            )}
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
  image: {
    width: 100,
    height: 100,
    margin: 10,
  },
  label: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 18,
  },
});
