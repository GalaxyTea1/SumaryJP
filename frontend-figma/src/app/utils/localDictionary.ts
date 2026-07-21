export interface WordDetail {
  char: string;
  type: "hiragana" | "katakana" | "kanji" | "vocab";
  romaji?: string;
  meaning?: string;
  onyomi?: string;
  kunyomi?: string;
  level?: string;
  strokes?: number;
  vocabType?: string;
  examples?: { jp: string; en: string }[];
  related?: string[];
  mnemonic?: string;
}

export const localDictionary: {
  jp: string; rom: string; en: string; type: string; level: string; example?: string; exampleEn?: string;
}[] = [
  { jp: "ありがとう", rom: "arigatou", en: "Thank you", type: "phrase", level: "N5", example: "ありがとうございます", exampleEn: "Thank you very much" },
  { jp: "おはよう", rom: "ohayou", en: "Good morning", type: "phrase", level: "N5", example: "おはようございます", exampleEn: "Good morning (formal)" },
  { jp: "こんにちは", rom: "konnichiwa", en: "Hello / Good afternoon", type: "phrase", level: "N5" },
  { jp: "さようなら", rom: "sayounara", en: "Goodbye", type: "phrase", level: "N5" },
  { jp: "すみません", rom: "sumimasen", en: "Excuse me / Sorry", type: "phrase", level: "N5", example: "すみません、駅はどこですか", exampleEn: "Excuse me, where is the station?" },
  { jp: "わかりません", rom: "wakarimasen", en: "I don't understand", type: "phrase", level: "N5" },
  { jp: "はい", rom: "hai", en: "Yes", type: "interjection", level: "N5" },
  { jp: "いいえ", rom: "iie", en: "No", type: "interjection", level: "N5" },
  { jp: "食べる", rom: "taberu", en: "To eat", type: "verb", level: "N5", example: "すしを食べる", exampleEn: "To eat sushi" },
  { jp: "飲む", rom: "nomu", en: "To drink", type: "verb", level: "N5", example: "水を飲む", exampleEn: "To drink water" },
  { jp: "行く", rom: "iku", en: "To go", type: "verb", level: "N5", example: "学校に行く", exampleEn: "To go to school" },
  { jp: "来る", rom: "kuru", en: "To come", type: "verb", level: "N5" },
  { jp: "見る", rom: "miru", en: "To see / watch", type: "verb", level: "N5", example: "映画を見る", exampleEn: "To watch a movie" },
  { jp: "聞く", rom: "kiku", en: "To hear / listen / ask", type: "verb", level: "N5" },
  { jp: "話す", rom: "hanasu", en: "To speak / talk", type: "verb", level: "N5" },
  { jp: "読む", rom: "yomu", en: "To read", type: "verb", level: "N5", example: "本を読む", exampleEn: "To read a book" },
  { jp: "書く", rom: "kaku", en: "To write", type: "verb", level: "N5" },
  { jp: "買う", rom: "kau", en: "To buy", type: "verb", level: "N5" },
  { jp: "大きい", rom: "ookii", en: "Big / large", type: "adjective", level: "N5" },
  { jp: "小さい", rom: "chiisai", en: "Small / little", type: "adjective", level: "N5" },
  { jp: "新しい", rom: "atarashii", en: "New", type: "adjective", level: "N5" },
  { jp: "古い", rom: "furui", en: "Old", type: "adjective", level: "N5" },
  { jp: "おいしい", rom: "oishii", en: "Delicious", type: "adjective", level: "N5", example: "このラーメンはおいしい", exampleEn: "This ramen is delicious" },
  { jp: "かわいい", rom: "kawaii", en: "Cute / adorable", type: "adjective", level: "N5" },
  { jp: "学校", rom: "gakkou", en: "School", type: "noun", level: "N5" },
  { jp: "先生", rom: "sensei", en: "Teacher", type: "noun", level: "N5" },
  { jp: "学生", rom: "gakusei", en: "Student", type: "noun", level: "N5" },
  { jp: "友達", rom: "tomodachi", en: "Friend", type: "noun", level: "N5" },
  { jp: "家族", rom: "kazoku", en: "Family", type: "noun", level: "N4" },
  { jp: "電話", rom: "denwa", en: "Telephone", type: "noun", level: "N5" },
  { jp: "時間", rom: "jikan", en: "Time", type: "noun", level: "N5" },
  { jp: "仕事", rom: "shigoto", en: "Work / job", type: "noun", level: "N5" },
  { jp: "お金", rom: "okane", en: "Money", type: "noun", level: "N5" },
  { jp: "天気", rom: "tenki", en: "Weather", type: "noun", level: "N5" },
  { jp: "今日", rom: "kyou", en: "Today", type: "noun", level: "N5" },
  { jp: "明日", rom: "ashita", en: "Tomorrow", type: "noun", level: "N5" },
  { jp: "昨日", rom: "kinou", en: "Yesterday", type: "noun", level: "N5" },
  { jp: "日本", rom: "nihon", en: "Japan", type: "noun", level: "N5" },
  { jp: "東京", rom: "toukyou", en: "Tokyo", type: "noun", level: "N5" },
  { jp: "愛", rom: "ai", en: "Love / affection", type: "noun", level: "N3" },
];
