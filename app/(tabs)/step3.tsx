import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Button,
  Easing,
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

export default function Step3Screen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [typed, setTyped] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [handPos] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const [hintIndex, setHintIndex] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const current = words[currentIndex];

  useEffect(() => {
    if (selectedWord) {
      const shuffled = shuffleLetters(selectedWord.name);
      setLetters(shuffled);
      setTyped([]);
      setMessage("");
      setShowHint(false);
      setHintIndex(0);
    }
  }, [selectedWord]);

  const shuffleLetters = (word: string) => {
    const randomLetters = "abcdefghijklmnopqrstuvwxyz".split("");
    const wordLetters = word.split("");
    const combined = [...wordLetters];
    while (combined.length < 10) {
      const rand =
        randomLetters[Math.floor(Math.random() * randomLetters.length)];
      if (!combined.includes(rand)) combined.push(rand);
    }
    return combined.sort(() => Math.random() - 0.5);
  };

  const handleSelect = (item: any) => {
    setSelectedWord(item);
    Speech.speak(item.name, { language: "en-US" });

    Animated.spring(scale, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleLetterPress = (letter: string) => {
    if (!selectedWord) return;
    const newTyped = [...typed, letter];
    setTyped(newTyped);

    if (newTyped.join("") === selectedWord.name) {
      setMessage("✅ Correct!");
      setTimeout(() => {
        nextWord();
      }, 1000);
    } else if (newTyped.length === selectedWord.name.length) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setMessage("❌ Try again");
      setTyped([]);

      if (newAttempts >= 3) {
        setShowHint(true);
        setMessage("💡 Watch the hint...");
        startHintAnimation();
      }
    }
  };

  const startHintAnimation = async () => {
    const correctLetters = selectedWord.name.split("");

    for (let i = 0; i < correctLetters.length; i++) {
      const letter = correctLetters[i];
      const index = letters.findIndex((l) => l === letter);
      if (index === -1) continue;

      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = col * 60 - 120;
      const y = row * 60;

      Animated.timing(handPos, {
        toValue: { x, y },
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      await new Promise((res) => setTimeout(res, 800));
    }

    setTyped(correctLetters);
    setMessage("✅ Great!");
    setTimeout(() => {
      nextWord();
    }, 1500);
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedWord(null);
      setAttempts(0);
      setTyped([]);
      setShowHint(false);
      setMessage("");
    } else {
      setMessage("🎉 All words completed!");
    }
  };

  return (
    <View style={styles.container}>
      {!selectedWord ? (
        <View style={styles.grid}>
          {words.map((item, idx) => (
            <TouchableOpacity key={idx} onPress={() => handleSelect(item)}>
              <Animated.Image
                source={item.image}
                style={[
                  styles.image,
                  selectedWord?.name === item.name && {
                    transform: [{ scale }],
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.wordArea}>
          <Text style={styles.wordLabel}>{selectedWord.name}</Text>

          <View style={styles.typedRow}>
            {typed.map((l, i) => (
              <Text key={i} style={styles.typedLetter}>
                {l.toUpperCase()}
              </Text>
            ))}
          </View>

          <View style={styles.lettersContainer}>
            <View style={styles.lettersRow}>
              {letters.map((letter, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleLetterPress(letter)}
                  style={styles.letterBox}
                >
                  <Text style={styles.letter}>{letter.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {showHint && (
              <Animated.View
                style={[
                  styles.hand,
                  {
                    transform: [
                      { translateX: handPos.x },
                      { translateY: handPos.y },
                    ],
                  },
                ]}
              >
                <Text style={{ fontSize: 36 }}>👇</Text>
              </Animated.View>
            )}
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={{ marginTop: 20 }}>
            <Button
              title="🔙 Back to Images"
              onPress={() => setSelectedWord(null)}
            />
          </View>
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
    borderRadius: 10,
  },
  wordArea: {
    alignItems: "center",
  },
  wordLabel: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  lettersContainer: {
    position: "relative",
    marginTop: 20,
  },
  lettersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  letterBox: {
    width: 50,
    height: 50,
    backgroundColor: "#e0e0e0",
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  letter: {
    fontSize: 22,
    fontWeight: "bold",
  },
  typedRow: {
    flexDirection: "row",
    minHeight: 40,
  },
  typedLetter: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 5,
    color: "#007AFF",
  },
  message: {
    fontSize: 18,
    marginTop: 15,
  },
  hand: {
    position: "absolute",
    left: 140,
    top: -30,
  },
});
