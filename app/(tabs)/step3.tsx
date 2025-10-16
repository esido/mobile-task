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
      const shuffled = shuffleSafe(selectedWord.name);
      setLetters(shuffled);
      setTyped(Array(selectedWord.name.length).fill(""));
      setMessage("");
      setShowHint(false);
      setHintIndex(0);
    }
  }, [selectedWord]);

  // 🧩 Безопасное перемешивание, чтобы не получилось исходное слово
  const shuffleSafe = (word: string): string[] => {
    const arr = word.split("");
    let shuffled = [...arr];

    const isSame = (a: string[], b: string[]) =>
      a.join("") === b.join("") || a.join("") === b.slice().reverse().join(""); // также не даем слово задом наперёд

    do {
      shuffled = shuffle(arr);
    } while (isSame(shuffled, arr));

    return shuffled;
  };

  const shuffle = (arr: string[]): string[] =>
    [...arr].sort(() => Math.random() - 0.5);

  const handleSelect = (item: any) => {
    setSelectedWord(item);
    Speech.speak(item.name, { language: "en-US" });

    Animated.sequence([
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleLetterPress = (letter: string, index: number) => {
    if (!selectedWord) return;

    const correctLetters = selectedWord.name.split("");
    const nextEmpty = typed.findIndex((t) => t === "");
    if (nextEmpty === -1) return;

    const updated = [...typed];
    updated[nextEmpty] = letter;
    setTyped(updated);

    // Если включен режим подсказки
    if (showHint) {
      const expectedLetter = correctLetters[nextEmpty];
      if (letter === expectedLetter) {
        // Переходим к следующей букве в подсказке
        moveHandToNextHint(nextEmpty + 1);
      }
    }

    if (updated.join("") === selectedWord.name) {
      setMessage("✅ Correct!");
      setTimeout(nextWord, 1000);
    } else if (updated.every((ch) => ch !== "")) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setMessage("❌ Try again");

      setTimeout(() => {
        setTyped(Array(selectedWord.name.length).fill(""));
        if (newAttempts >= 3) {
          setShowHint(true);
          setMessage("💡 Watch the hint...");
          moveHandToNextHint(0);
        }
      }, 1000);
    }
  };

  // ✋ Перемещение руки на нужную букву
  const moveHandToNextHint = (index: number) => {
    const correctLetters = selectedWord.name.split("");

    if (index >= correctLetters.length) {
      setHintIndex(0);
      return;
    }

    const letter = correctLetters[index];

    // 🔍 Ищем индекс этой конкретной буквы, учитывая, сколько таких уже использовалось
    const occurrencesBefore = correctLetters
      .slice(0, index)
      .filter((l: any) => l === letter).length;

    let count = 0;
    const targetIndex = letters.findIndex((l, i) => {
      if (l === letter) {
        if (count === occurrencesBefore) return true;
        count++;
      }
      return false;
    });

    if (targetIndex === -1) return;

    const row = Math.floor(targetIndex / 5);
    const col = targetIndex % 5;
    const x = col * 60 - 100;
    const y = row * 60;

    Animated.timing(handPos, {
      toValue: { x, y },
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    setHintIndex(index);
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
          <View style={styles.typedRow}>
            {typed.map((l, i) => (
              <View key={i} style={styles.emptyBox}>
                <Text style={styles.typedLetter}>{l.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          <View style={styles.lettersContainer}>
            <View style={styles.lettersRow}>
              {letters.map((letter, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleLetterPress(letter, i)}
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
            <Button title="🔙 Back" onPress={() => setSelectedWord(null)} />
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
  lettersContainer: {
    position: "relative",
    marginTop: 20,
  },
  lettersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 300,
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
    minHeight: 50,
    justifyContent: "center",
    marginVertical: 10,
  },
  emptyBox: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  typedLetter: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  message: {
    fontSize: 18,
    marginTop: 15,
  },
  hand: {
    position: "absolute",
    left: 120,
    top: -40,
  },
});
