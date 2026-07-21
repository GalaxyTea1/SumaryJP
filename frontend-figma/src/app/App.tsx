import { useState, useEffect, useRef, useCallback } from "react";
import kanaData from "./utils/kanaData.json";
import Tesseract from "tesseract.js";
import {
  ChevronRight, BookOpen, PenTool, Layers, Star, RotateCcw,
  Check, X, Menu, Search, ArrowLeftRight, Gamepad2, Volume2,
  Trophy, Clock, Zap, Target, Home, Info, Image as ImageIcon, Upload, Loader2
} from "lucide-react";

// ─── Word Detail Types ────────────────────────────────────────────────────────

import { localDictionary, WordDetail } from "./utils/localDictionary";

// ─── Rich word data ───────────────────────────────────────────────────────────

const kanjiDetails: Record<string, WordDetail> = {
  "日": { char: "日", type: "kanji", meaning: "Sun / Day", onyomi: "にち (nichi)・じつ (jitsu)", kunyomi: "ひ (hi)・か (ka)", level: "N5", strokes: 4, examples: [{ jp: "日本 (にほん)", en: "Japan" }, { jp: "今日 (きょう)", en: "Today" }, { jp: "日曜日 (にちようび)", en: "Sunday" }], related: ["月", "年", "週"], mnemonic: "A window frame with a cross — the sun shining through." },
  "本": { char: "本", type: "kanji", meaning: "Origin / Book", onyomi: "ほん (hon)", kunyomi: "もと (moto)", level: "N5", strokes: 5, examples: [{ jp: "日本 (にほん)", en: "Japan" }, { jp: "本 (ほん)", en: "Book" }, { jp: "基本 (きほん)", en: "Basics" }], related: ["木", "語", "文"], mnemonic: "A tree (木) with a line marking its root — the origin." },
  "語": { char: "語", type: "kanji", meaning: "Language / Word", onyomi: "ご (go)・げん (gen)", kunyomi: "かた·る (kataru)", level: "N5", strokes: 14, examples: [{ jp: "日本語 (にほんご)", en: "Japanese language" }, { jp: "英語 (えいご)", en: "English" }, { jp: "物語 (ものがたり)", en: "Story / Tale" }], related: ["話", "言", "文"], mnemonic: "Words (言) that go into the mouth — language spoken aloud." },
  "人": { char: "人", type: "kanji", meaning: "Person", onyomi: "じん (jin)・にん (nin)", kunyomi: "ひと (hito)", level: "N5", strokes: 2, examples: [{ jp: "人 (ひと)", en: "Person / People" }, { jp: "日本人 (にほんじん)", en: "Japanese person" }, { jp: "人気 (にんき)", en: "Popularity" }], related: ["男", "女", "子"], mnemonic: "Two strokes leaning on each other — two people supporting one another." },
  "山": { char: "山", type: "kanji", meaning: "Mountain", onyomi: "さん (san)", kunyomi: "やま (yama)", level: "N5", strokes: 3, examples: [{ jp: "山 (やま)", en: "Mountain" }, { jp: "富士山 (ふじさん)", en: "Mt. Fuji" }, { jp: "火山 (かざん)", en: "Volcano" }], related: ["川", "海", "森"], mnemonic: "Three peaks — the shape of a mountain range." },
  "川": { char: "川", type: "kanji", meaning: "River", onyomi: "せん (sen)", kunyomi: "かわ (kawa)", level: "N5", strokes: 3, examples: [{ jp: "川 (かわ)", en: "River" }, { jp: "川口 (かわぐち)", en: "Kawaguchi (city)" }], related: ["水", "海", "山"], mnemonic: "Three vertical lines — three streams flowing parallel." },
  "水": { char: "水", type: "kanji", meaning: "Water", onyomi: "すい (sui)", kunyomi: "みず (mizu)", level: "N5", strokes: 4, examples: [{ jp: "水 (みず)", en: "Water" }, { jp: "水曜日 (すいようび)", en: "Wednesday" }, { jp: "水泳 (すいえい)", en: "Swimming" }], related: ["川", "海", "雨"], mnemonic: "A central line with droplets splashing to each side." },
  "火": { char: "火", type: "kanji", meaning: "Fire", onyomi: "か (ka)", kunyomi: "ひ (hi)", level: "N5", strokes: 4, examples: [{ jp: "火 (ひ)", en: "Fire / Flame" }, { jp: "火曜日 (かようび)", en: "Tuesday" }, { jp: "花火 (はなび)", en: "Fireworks" }], related: ["水", "土", "木"], mnemonic: "A person with arms and legs spread wide, surrounded by flames." },
  "木": { char: "木", type: "kanji", meaning: "Tree / Wood", onyomi: "もく (moku)・ぼく (boku)", kunyomi: "き (ki)", level: "N5", strokes: 4, examples: [{ jp: "木 (き)", en: "Tree" }, { jp: "木曜日 (もくようび)", en: "Thursday" }, { jp: "木材 (もくざい)", en: "Lumber" }], related: ["森", "林", "本"], mnemonic: "A trunk with branches above and roots below." },
  "金": { char: "金", type: "kanji", meaning: "Gold / Money", onyomi: "きん (kin)・こん (kon)", kunyomi: "かね (kane)・かな (kana)", level: "N5", strokes: 8, examples: [{ jp: "お金 (おかね)", en: "Money" }, { jp: "金曜日 (きんようび)", en: "Friday" }, { jp: "金色 (きんいろ)", en: "Golden color" }], related: ["銀", "円", "銭"] },
  "土": { char: "土", type: "kanji", meaning: "Earth / Soil", onyomi: "ど (do)・と (to)", kunyomi: "つち (tsuchi)", level: "N5", strokes: 3, examples: [{ jp: "土 (つち)", en: "Soil / Earth" }, { jp: "土曜日 (どようび)", en: "Saturday" }, { jp: "土地 (とち)", en: "Land / Plot" }], related: ["地", "国", "山"] },
  "月": { char: "月", type: "kanji", meaning: "Moon / Month", onyomi: "げつ (getsu)・がつ (gatsu)", kunyomi: "つき (tsuki)", level: "N5", strokes: 4, examples: [{ jp: "月 (つき)", en: "Moon" }, { jp: "月曜日 (げつようび)", en: "Monday" }, { jp: "一月 (いちがつ)", en: "January" }], related: ["日", "年", "週"], mnemonic: "A crescent moon seen from the side." },
  "電": { char: "電", type: "kanji", meaning: "Electricity", onyomi: "でん (den)", kunyomi: "—", level: "N4", strokes: 13, examples: [{ jp: "電話 (でんわ)", en: "Telephone" }, { jp: "電車 (でんしゃ)", en: "Train" }, { jp: "電気 (でんき)", en: "Electricity / Light" }], related: ["話", "車", "気"] },
  "車": { char: "車", type: "kanji", meaning: "Car / Vehicle", onyomi: "しゃ (sha)", kunyomi: "くるま (kuruma)", level: "N5", strokes: 7, examples: [{ jp: "車 (くるま)", en: "Car" }, { jp: "電車 (でんしゃ)", en: "Train" }, { jp: "自動車 (じどうしゃ)", en: "Automobile" }], related: ["電", "道", "駅"] },
  "駅": { char: "駅", type: "kanji", meaning: "Station", onyomi: "えき (eki)", kunyomi: "—", level: "N5", strokes: 14, examples: [{ jp: "駅 (えき)", en: "Station" }, { jp: "東京駅 (とうきょうえき)", en: "Tokyo Station" }], related: ["電", "車", "道"] },
  "食": { char: "食", type: "kanji", meaning: "Eat / Food", onyomi: "しょく (shoku)", kunyomi: "たべ·る (taberu)", level: "N5", strokes: 9, examples: [{ jp: "食べる (たべる)", en: "To eat" }, { jp: "食事 (しょくじ)", en: "Meal" }, { jp: "食料品 (しょくりょうひん)", en: "Groceries" }], related: ["飲", "料", "味"] },
  "飲": { char: "飲", type: "kanji", meaning: "Drink", onyomi: "いん (in)", kunyomi: "の·む (nomu)", level: "N5", strokes: 12, examples: [{ jp: "飲む (のむ)", en: "To drink" }, { jp: "飲み物 (のみもの)", en: "Beverage" }], related: ["食", "水", "酒"] },
  "見": { char: "見", type: "kanji", meaning: "See / Look", onyomi: "けん (ken)", kunyomi: "み·る (miru)", level: "N5", strokes: 7, examples: [{ jp: "見る (みる)", en: "To see / watch" }, { jp: "見物 (けんぶつ)", en: "Sightseeing" }], related: ["聞", "目", "観"] },
  "聞": { char: "聞", type: "kanji", meaning: "Hear / Ask", onyomi: "ぶん (bun)・もん (mon)", kunyomi: "き·く (kiku)", level: "N5", strokes: 14, examples: [{ jp: "聞く (きく)", en: "To hear / listen / ask" }, { jp: "新聞 (しんぶん)", en: "Newspaper" }], related: ["見", "言", "音"] },
  "言": { char: "言", type: "kanji", meaning: "Say / Word", onyomi: "げん (gen)・ごん (gon)", kunyomi: "い·う (iu)", level: "N5", strokes: 7, examples: [{ jp: "言う (いう)", en: "To say" }, { jp: "言葉 (ことば)", en: "Word / Language" }], related: ["語", "話", "聞"] },
  "愛": { char: "愛", type: "kanji", meaning: "Love / Affection", onyomi: "あい (ai)", kunyomi: "いと·しい (itoshii)", level: "N3", strokes: 13, examples: [{ jp: "愛する (あいする)", en: "To love" }, { jp: "愛情 (あいじょう)", en: "Affection" }, { jp: "愛国 (あいこく)", en: "Patriotism" }], related: ["好", "恋", "情"], mnemonic: "A heart (心) in the center — love carried in the heart." },
};

const hiraganaDetails: Record<string, WordDetail> = {
  "あ": { char: "あ", type: "hiragana", romaji: "a", strokes: 3, meaning: "Vowel 'a' — as in 'father'", examples: [{ jp: "あおい (aoi)", en: "Blue" }, { jp: "あさ (asa)", en: "Morning" }, { jp: "あめ (ame)", en: "Rain / Candy" }] },
  "い": { char: "い", type: "hiragana", romaji: "i", strokes: 2, meaning: "Vowel 'i' — as in 'feet'", examples: [{ jp: "いぬ (inu)", en: "Dog" }, { jp: "いえ (ie)", en: "House" }, { jp: "いま (ima)", en: "Now / Living room" }] },
  "う": { char: "う", type: "hiragana", romaji: "u", strokes: 2, meaning: "Vowel 'u' — as in 'moon' (short)", examples: [{ jp: "うみ (umi)", en: "Sea / Ocean" }, { jp: "うた (uta)", en: "Song" }, { jp: "うえ (ue)", en: "Above / Up" }] },
  "え": { char: "え", type: "hiragana", romaji: "e", strokes: 2, meaning: "Vowel 'e' — as in 'bed'", examples: [{ jp: "えき (eki)", en: "Station" }, { jp: "えいご (eigo)", en: "English language" }] },
  "お": { char: "お", type: "hiragana", romaji: "o", strokes: 3, meaning: "Vowel 'o' — as in 'more'", examples: [{ jp: "おかあさん (okaasan)", en: "Mother" }, { jp: "おはよう (ohayou)", en: "Good morning" }] },
  "か": { char: "か", type: "hiragana", romaji: "ka", strokes: 3, meaning: "Consonant 'k' + vowel 'a'", examples: [{ jp: "かわ (kawa)", en: "River" }, { jp: "かみ (kami)", en: "Paper / Hair / God" }] },
  "き": { char: "き", type: "hiragana", romaji: "ki", strokes: 4, meaning: "Consonant 'k' + vowel 'i'", examples: [{ jp: "きく (kiku)", en: "To listen" }, { jp: "きょう (kyou)", en: "Today" }] },
  "く": { char: "く", type: "hiragana", romaji: "ku", strokes: 1, meaning: "Consonant 'k' + vowel 'u'", examples: [{ jp: "くに (kuni)", en: "Country" }, { jp: "くるま (kuruma)", en: "Car" }] },
  "け": { char: "け", type: "hiragana", romaji: "ke", strokes: 3, meaning: "Consonant 'k' + vowel 'e'", examples: [{ jp: "けむり (kemuri)", en: "Smoke" }] },
  "こ": { char: "こ", type: "hiragana", romaji: "ko", strokes: 2, meaning: "Consonant 'k' + vowel 'o'", examples: [{ jp: "こども (kodomo)", en: "Child" }, { jp: "ここ (koko)", en: "Here" }] },
  "さ": { char: "さ", type: "hiragana", romaji: "sa", strokes: 3, meaning: "Consonant 's' + vowel 'a'", examples: [{ jp: "さかな (sakana)", en: "Fish" }, { jp: "さくら (sakura)", en: "Cherry blossom" }] },
  "し": { char: "し", type: "hiragana", romaji: "shi", strokes: 1, meaning: "Consonant 'sh' + vowel 'i'", examples: [{ jp: "しずか (shizuka)", en: "Quiet" }, { jp: "しごと (shigoto)", en: "Work" }] },
  "す": { char: "す", type: "hiragana", romaji: "su", strokes: 2, meaning: "Consonant 's' + vowel 'u'", examples: [{ jp: "すし (sushi)", en: "Sushi" }, { jp: "すき (suki)", en: "Like" }] },
  "せ": { char: "せ", type: "hiragana", romaji: "se", strokes: 3, meaning: "Consonant 's' + vowel 'e'", examples: [{ jp: "せんせい (sensei)", en: "Teacher" }] },
  "そ": { char: "そ", type: "hiragana", romaji: "so", strokes: 2, meaning: "Consonant 's' + vowel 'o'", examples: [{ jp: "そら (sora)", en: "Sky" }, { jp: "そこ (soko)", en: "There" }] },
  "た": { char: "た", type: "hiragana", romaji: "ta", strokes: 4, meaning: "Consonant 't' + vowel 'a'", examples: [{ jp: "たべる (taberu)", en: "To eat" }, { jp: "たかい (takai)", en: "Expensive / Tall" }] },
  "ち": { char: "ち", type: "hiragana", romaji: "chi", strokes: 2, meaning: "Consonant 'ch' + vowel 'i'", examples: [{ jp: "ちいさい (chiisai)", en: "Small" }, { jp: "ちかい (chikai)", en: "Near / Close" }] },
  "つ": { char: "つ", type: "hiragana", romaji: "tsu", strokes: 1, meaning: "Consonant 'ts' + vowel 'u'", examples: [{ jp: "つき (tsuki)", en: "Moon" }, { jp: "つかれ (tsukare)", en: "Tiredness" }] },
  "て": { char: "て", type: "hiragana", romaji: "te", strokes: 1, meaning: "Consonant 't' + vowel 'e'", examples: [{ jp: "てがみ (tegami)", en: "Letter (written)" }, { jp: "て (te)", en: "Hand" }] },
  "と": { char: "と", type: "hiragana", romaji: "to", strokes: 2, meaning: "Consonant 't' + vowel 'o'", examples: [{ jp: "とり (tori)", en: "Bird" }, { jp: "ともだち (tomodachi)", en: "Friend" }] },
  "な": { char: "な", type: "hiragana", romaji: "na", strokes: 4, meaning: "Consonant 'n' + vowel 'a'", examples: [{ jp: "なまえ (namae)", en: "Name" }, { jp: "なに (nani)", en: "What" }] },
  "に": { char: "に", type: "hiragana", romaji: "ni", strokes: 3, meaning: "Consonant 'n' + vowel 'i'", examples: [{ jp: "にほん (nihon)", en: "Japan" }, { jp: "にく (niku)", en: "Meat" }] },
  "ぬ": { char: "ぬ", type: "hiragana", romaji: "nu", strokes: 2, meaning: "Consonant 'n' + vowel 'u'", examples: [{ jp: "ぬる (nuru)", en: "To paint / apply" }] },
  "ね": { char: "ね", type: "hiragana", romaji: "ne", strokes: 2, meaning: "Consonant 'n' + vowel 'e'", examples: [{ jp: "ねこ (neko)", en: "Cat" }, { jp: "ねる (neru)", en: "To sleep" }] },
  "の": { char: "の", type: "hiragana", romaji: "no", strokes: 1, meaning: "Consonant 'n' + vowel 'o' (also possessive particle)", examples: [{ jp: "わたしの (watashi no)", en: "My / Mine" }, { jp: "の (no)", en: "Possessive particle" }] },
  "は": { char: "は", type: "hiragana", romaji: "ha", strokes: 3, meaning: "Consonant 'h' + vowel 'a' (also topic particle: 'wa')", examples: [{ jp: "はな (hana)", en: "Flower / Nose" }, { jp: "はる (haru)", en: "Spring" }] },
  "ひ": { char: "ひ", type: "hiragana", romaji: "hi", strokes: 1, meaning: "Consonant 'h' + vowel 'i'", examples: [{ jp: "ひと (hito)", en: "Person" }, { jp: "ひる (hiru)", en: "Noon / Daytime" }] },
  "ふ": { char: "ふ", type: "hiragana", romaji: "fu", strokes: 4, meaning: "Consonant 'f' + vowel 'u'", examples: [{ jp: "ふゆ (fuyu)", en: "Winter" }, { jp: "ふね (fune)", en: "Ship / Boat" }] },
  "へ": { char: "へ", type: "hiragana", romaji: "he", strokes: 1, meaning: "Consonant 'h' + vowel 'e' (also direction particle)", examples: [{ jp: "へや (heya)", en: "Room" }] },
  "ほ": { char: "ほ", type: "hiragana", romaji: "ho", strokes: 4, meaning: "Consonant 'h' + vowel 'o'", examples: [{ jp: "ほん (hon)", en: "Book" }, { jp: "ほし (hoshi)", en: "Star" }] },
  "ま": { char: "ま", type: "hiragana", romaji: "ma", strokes: 3, meaning: "Consonant 'm' + vowel 'a'", examples: [{ jp: "まち (machi)", en: "Town" }, { jp: "まえ (mae)", en: "Before / Front" }] },
  "み": { char: "み", type: "hiragana", romaji: "mi", strokes: 2, meaning: "Consonant 'm' + vowel 'i'", examples: [{ jp: "みず (mizu)", en: "Water" }, { jp: "みせ (mise)", en: "Shop / Store" }] },
  "む": { char: "む", type: "hiragana", romaji: "mu", strokes: 3, meaning: "Consonant 'm' + vowel 'u'", examples: [{ jp: "むし (mushi)", en: "Insect / Bug" }] },
  "め": { char: "め", type: "hiragana", romaji: "me", strokes: 2, meaning: "Consonant 'm' + vowel 'e'", examples: [{ jp: "め (me)", en: "Eye" }, { jp: "めがね (megane)", en: "Glasses" }] },
  "も": { char: "も", type: "hiragana", romaji: "mo", strokes: 3, meaning: "Consonant 'm' + vowel 'o' (also 'also / too' particle)", examples: [{ jp: "もり (mori)", en: "Forest" }, { jp: "もの (mono)", en: "Thing / Object" }] },
  "や": { char: "や", type: "hiragana", romaji: "ya", strokes: 3, meaning: "Consonant 'y' + vowel 'a'", examples: [{ jp: "やま (yama)", en: "Mountain" }, { jp: "やすい (yasui)", en: "Cheap / Easy" }] },
  "ゆ": { char: "ゆ", type: "hiragana", romaji: "yu", strokes: 2, meaning: "Consonant 'y' + vowel 'u'", examples: [{ jp: "ゆき (yuki)", en: "Snow" }, { jp: "ゆめ (yume)", en: "Dream" }] },
  "よ": { char: "よ", type: "hiragana", romaji: "yo", strokes: 2, meaning: "Consonant 'y' + vowel 'o'", examples: [{ jp: "よる (yoru)", en: "Night / Evening" }, { jp: "よむ (yomu)", en: "To read" }] },
  "ら": { char: "ら", type: "hiragana", romaji: "ra", strokes: 2, meaning: "Consonant 'r' + vowel 'a'", examples: [{ jp: "らいねん (rainen)", en: "Next year" }] },
  "り": { char: "り", type: "hiragana", romaji: "ri", strokes: 2, meaning: "Consonant 'r' + vowel 'i'", examples: [{ jp: "りんご (ringo)", en: "Apple" }, { jp: "りゆう (riyuu)", en: "Reason" }] },
  "る": { char: "る", type: "hiragana", romaji: "ru", strokes: 1, meaning: "Consonant 'r' + vowel 'u'", examples: [{ jp: "るすばん (rusuban)", en: "House-sitting" }] },
  "れ": { char: "れ", type: "hiragana", romaji: "re", strokes: 2, meaning: "Consonant 'r' + vowel 'e'", examples: [{ jp: "れいぞうこ (reizouko)", en: "Refrigerator" }] },
  "ろ": { char: "ろ", type: "hiragana", romaji: "ro", strokes: 1, meaning: "Consonant 'r' + vowel 'o'", examples: [{ jp: "ろうか (rouka)", en: "Corridor / Hallway" }] },
  "わ": { char: "わ", type: "hiragana", romaji: "wa", strokes: 2, meaning: "Consonant 'w' + vowel 'a' (also topic particle)", examples: [{ jp: "わたし (watashi)", en: "I / Me" }, { jp: "わかる (wakaru)", en: "To understand" }] },
  "を": { char: "を", type: "hiragana", romaji: "wo", strokes: 3, meaning: "Object marker particle — always 'wo'", examples: [{ jp: "りんごを食べる", en: "To eat an apple (object marker)" }] },
  "ん": { char: "ん", type: "hiragana", romaji: "n", strokes: 1, meaning: "Nasal consonant 'n' — only appears at end of syllables", examples: [{ jp: "にほん (nihon)", en: "Japan" }, { jp: "ほんとう (hontou)", en: "Really / Truly" }] },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const hiragana = [
  { char: "あ", rom: "a" }, { char: "い", rom: "i" }, { char: "う", rom: "u" }, { char: "え", rom: "e" }, { char: "お", rom: "o" },
  { char: "か", rom: "ka" }, { char: "き", rom: "ki" }, { char: "く", rom: "ku" }, { char: "け", rom: "ke" }, { char: "こ", rom: "ko" },
  { char: "さ", rom: "sa" }, { char: "し", rom: "shi" }, { char: "す", rom: "su" }, { char: "せ", rom: "se" }, { char: "そ", rom: "so" },
  { char: "た", rom: "ta" }, { char: "ち", rom: "chi" }, { char: "つ", rom: "tsu" }, { char: "て", rom: "te" }, { char: "と", rom: "to" },
  { char: "な", rom: "na" }, { char: "に", rom: "ni" }, { char: "ぬ", rom: "nu" }, { char: "ね", rom: "ne" }, { char: "の", rom: "no" },
  { char: "は", rom: "ha" }, { char: "ひ", rom: "hi" }, { char: "ふ", rom: "fu" }, { char: "へ", rom: "he" }, { char: "ほ", rom: "ho" },
  { char: "ま", rom: "ma" }, { char: "み", rom: "mi" }, { char: "む", rom: "mu" }, { char: "め", rom: "me" }, { char: "も", rom: "mo" },
  { char: "や", rom: "ya" }, { char: "　", rom: "" }, { char: "ゆ", rom: "yu" }, { char: "　", rom: "" }, { char: "よ", rom: "yo" },
  { char: "ら", rom: "ra" }, { char: "り", rom: "ri" }, { char: "る", rom: "ru" }, { char: "れ", rom: "re" }, { char: "ろ", rom: "ro" },
  { char: "わ", rom: "wa" }, { char: "　", rom: "" }, { char: "を", rom: "wo" }, { char: "　", rom: "" }, { char: "ん", rom: "n" },
];

const katakana = [
  { char: "ア", rom: "a" }, { char: "イ", rom: "i" }, { char: "ウ", rom: "u" }, { char: "エ", rom: "e" }, { char: "オ", rom: "o" },
  { char: "カ", rom: "ka" }, { char: "キ", rom: "ki" }, { char: "ク", rom: "ku" }, { char: "ケ", rom: "ke" }, { char: "コ", rom: "ko" },
  { char: "サ", rom: "sa" }, { char: "シ", rom: "shi" }, { char: "ス", rom: "su" }, { char: "セ", rom: "se" }, { char: "ソ", rom: "so" },
  { char: "タ", rom: "ta" }, { char: "チ", rom: "chi" }, { char: "ツ", rom: "tsu" }, { char: "テ", rom: "te" }, { char: "ト", rom: "to" },
  { char: "ナ", rom: "na" }, { char: "ニ", rom: "ni" }, { char: "ヌ", rom: "nu" }, { char: "ネ", rom: "ne" }, { char: "ノ", rom: "no" },
  { char: "ハ", rom: "ha" }, { char: "ヒ", rom: "hi" }, { char: "フ", rom: "fu" }, { char: "ヘ", rom: "he" }, { char: "ホ", rom: "ho" },
  { char: "マ", rom: "ma" }, { char: "ミ", rom: "mi" }, { char: "ム", rom: "mu" }, { char: "メ", rom: "me" }, { char: "モ", rom: "mo" },
  { char: "ヤ", rom: "ya" }, { char: "　", rom: "" }, { char: "ユ", rom: "yu" }, { char: "　", rom: "" }, { char: "ヨ", rom: "yo" },
  { char: "ラ", rom: "ra" }, { char: "リ", rom: "ri" }, { char: "ル", rom: "ru" }, { char: "レ", rom: "re" }, { char: "ロ", rom: "ro" },
  { char: "ワ", rom: "wa" }, { char: "　", rom: "" }, { char: "ヲ", rom: "wo" }, { char: "　", rom: "" }, { char: "ン", rom: "n" },
];

const kanjiList = [
  { char: "日", meaning: "sun / day", reading: "にち・ひ", level: "N5" },
  { char: "本", meaning: "origin / book", reading: "ほん・もと", level: "N5" },
  { char: "語", meaning: "language / word", reading: "ご・かたる", level: "N5" },
  { char: "人", meaning: "person", reading: "じん・ひと", level: "N5" },
  { char: "山", meaning: "mountain", reading: "さん・やま", level: "N5" },
  { char: "川", meaning: "river", reading: "かわ・せん", level: "N5" },
  { char: "水", meaning: "water", reading: "すい・みず", level: "N5" },
  { char: "火", meaning: "fire", reading: "か・ひ", level: "N5" },
  { char: "木", meaning: "tree / Thursday", reading: "もく・き", level: "N5" },
  { char: "金", meaning: "gold / money", reading: "きん・かね", level: "N5" },
  { char: "土", meaning: "earth / soil", reading: "ど・つち", level: "N5" },
  { char: "月", meaning: "moon / month", reading: "つき・げつ", level: "N5" },
  { char: "電", meaning: "electricity", reading: "でん", level: "N4" },
  { char: "車", meaning: "car / vehicle", reading: "くるま・しゃ", level: "N5" },
  { char: "駅", meaning: "station", reading: "えき", level: "N5" },
  { char: "食", meaning: "eat / food", reading: "しょく・たべ", level: "N5" },
  { char: "飲", meaning: "drink", reading: "いん・のむ", level: "N5" },
  { char: "見", meaning: "see / look", reading: "けん・みる", level: "N5" },
  { char: "聞", meaning: "hear / listen", reading: "ぶん・きく", level: "N5" },
  { char: "言", meaning: "say / word", reading: "げん・いう", level: "N5" },
];

const dictionary = localDictionary;

const phrasebook: { [key: string]: string } = {
  "hello": "こんにちは (konnichiwa)",
  "good morning": "おはようございます (ohayou gozaimasu)",
  "good evening": "こんばんは (konbanwa)",
  "goodbye": "さようなら (sayounara)",
  "thank you": "ありがとうございます (arigatou gozaimasu)",
  "please": "お願いします (onegai shimasu)",
  "excuse me": "すみません (sumimasen)",
  "sorry": "ごめんなさい (gomen nasai)",
  "yes": "はい (hai)",
  "no": "いいえ (iie)",
  "where is": "どこですか (doko desu ka)",
  "how much": "いくらですか (ikura desu ka)",
  "i love you": "愛しています (aishite imasu)",
  "water": "水 (mizu)",
  "food": "食べ物 (tabemono)",
  "help": "助けてください (tasukete kudasai)",
  "japan": "日本 (nihon)",
  "tokyo": "東京 (toukyou)",
  "beautiful": "きれい (kirei)",
  "delicious": "おいしい (oishii)",
};

const lessons = [
  { level: "N5", title: "Essential Foundations", topics: ["Hiragana & Katakana", "Basic greetings", "Numbers 1–100", "Days & months"], color: "#4A7C59", students: 12840 },
  { level: "N4", title: "Elementary Grammar", topics: ["て-form verbs", "Past tense", "Giving & receiving", "Location expressions"], color: "#2E6B8A", students: 8320 },
  { level: "N3", title: "Intermediate Reading", topics: ["350 kanji", "Newspaper headlines", "Conditional forms", "Honorific speech"], color: "#7B5EA7", students: 4910 },
  { level: "N2", title: "Advanced Fluency", topics: ["1000 kanji", "Formal writing", "Nuanced grammar", "Business Japanese"], color: "#B5650A", students: 2760 },
];

type Page = "home" | "translate" | "dictionary" | "writing" | "flashcards" | "games";
type GameType = "quiz" | "match" | "speed";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function speak(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    window.speechSynthesis.speak(u);
  }
}

// ─── Writing Grid SVG ─────────────────────────────────────────────────────────

function WritingGrid({ size = 200 }: { size?: number }) {
  const s = size;
  const half = s / 2;
  return (
    <svg width={s} height={s} className="absolute inset-0 pointer-events-none">
      {/* outer border */}
      <rect x={0} y={0} width={s} height={s} fill="none" stroke="rgba(192,57,43,0.15)" strokeWidth={1.5} />
      {/* center cross */}
      <line x1={half} y1={0} x2={half} y2={s} stroke="rgba(192,57,43,0.15)" strokeWidth={1} strokeDasharray="4,4" />
      <line x1={0} y1={half} x2={s} y2={half} stroke="rgba(192,57,43,0.15)" strokeWidth={1} strokeDasharray="4,4" />
      {/* diagonals — lighter */}
      <line x1={0} y1={0} x2={s} y2={s} stroke="rgba(192,57,43,0.07)" strokeWidth={1} />
      <line x1={s} y1={0} x2={0} y2={s} stroke="rgba(192,57,43,0.07)" strokeWidth={1} />
    </svg>
  );
}

// ─── Stroke Animation ─────────────────────────────────────────────────────────

function StrokeAnimation({ char, strokes }: { char: string; strokes: number }) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  // Load SVG paths from our KanjiVG data if available
  const svgPaths: string[] = (kanaData as Record<string, string[]>)[char] || [];
  const totalStrokes = svgPaths.length > 0 ? svgPaths.length : strokes;

  const start = () => {
    setStep(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    if (step >= totalStrokes) { setRunning(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 600);
    return () => clearTimeout(t);
  }, [running, step, totalStrokes]);

  const progress = totalStrokes > 0 ? step / totalStrokes : 1;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <WritingGrid size={200} />
        
        {/* ghost character / background paths */}
        <div className="absolute inset-0 flex items-center justify-center">
          {svgPaths.length > 0 ? (
            <svg viewBox="0 0 109 109" width="160" height="160" className="opacity-15">
              {svgPaths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#1C1712" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
          ) : (
            <span className="text-8xl select-none" style={{
              fontFamily: "'Noto Serif JP', serif",
              color: "rgba(28,23,18,0.08)",
            }}>{char}</span>
          )}
        </div>
        
        {/* animated strokes */}
        <div className="absolute inset-0 flex items-center justify-center">
          {svgPaths.length > 0 ? (
            <svg viewBox="0 0 109 109" width="160" height="160">
              {svgPaths.map((d, i) => {
                const isDrawn = i < step;
                const isAnimating = i === step && running;
                return (
                  <path 
                    key={i} 
                    d={d} 
                    fill="none" 
                    stroke="#1C1712" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset={isDrawn ? 0 : (isAnimating ? 0 : 1)}
                    style={{
                      transition: isAnimating ? "stroke-dashoffset 0.5s ease-out" : (isDrawn ? "none" : "none"),
                      opacity: (isDrawn || isAnimating) ? 1 : 0
                    }}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{
              clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
              transition: "clip-path 0.35s ease-out",
            }}>
              <span className="text-8xl select-none" style={{
                fontFamily: "'Noto Serif JP', serif",
                color: "#1C1712",
              }}>{char}</span>
            </div>
          )}
        </div>
        
        {/* stroke counter badge */}
        <div className="absolute bottom-2 right-2 bg-accent/10 border border-accent/20 text-accent text-xs px-2 py-0.5 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
          {step}/{totalStrokes}
        </div>
      </div>

      {/* stroke dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalStrokes }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < step ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>

      <button
        onClick={start}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent border border-border px-3 py-1.5 transition-colors"
      >
        <RotateCcw size={11} /> {running ? "Animating…" : "Replay stroke order"}
      </button>
    </div>
  );
}

// ─── Word Popup Modal ─────────────────────────────────────────────────────────

function WordModal({ word, onClose }: { word: WordDetail; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const typeLabel: Record<WordDetail["type"], string> = {
    hiragana: "Hiragana", katakana: "Katakana", kanji: "Kanji", vocab: "Vocabulary",
  };

  const typeBadgeColor: Record<WordDetail["type"], string> = {
    hiragana: "#2E6B8A", katakana: "#7B5EA7", kanji: "#B5650A", vocab: "#4A7C59",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

      <div
        className="relative bg-card border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ scrollbarWidth: "none" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 font-medium text-white"
              style={{ background: typeBadgeColor[word.type] }}>
              {typeLabel[word.type]}
            </span>
            {word.level && (
              <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 font-medium">{word.level}</span>
            )}
            {(word.strokes || (kanaData as Record<string, string[]>)[word.char]?.length > 0) && (
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                {word.strokes || (kanaData as Record<string, string[]>)[word.char].length} strokes
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-8">
          {/* Left — character display + animation */}
          <div className="flex flex-col items-center gap-6">
            {(word.strokes || (kanaData as Record<string, string[]>)[word.char]?.length > 0) ? (
              <StrokeAnimation char={word.char} strokes={word.strokes || 0} />
            ) : (
              <div className="relative" style={{ width: 200, height: 200 }}>
                <WritingGrid size={200} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl select-none text-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{word.char}</span>
                </div>
              </div>
            )}

            {/* Audio */}
            <button
              onClick={() => speak(word.char)}
              className="flex items-center gap-2 border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors w-full justify-center"
            >
              <Volume2 size={14} /> Hear pronunciation
            </button>

            {/* Practice area */}
            <div className="w-full">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Practice writing</p>
              <div className="relative bg-secondary border border-border" style={{ height: 120 }}>
                <WritingGrid size={120} />
                <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none">
                  <span className="text-6xl text-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{word.char}</span>
                </div>
                <div className="absolute bottom-1.5 right-2 text-xs text-muted-foreground/40">trace above</div>
              </div>
            </div>
          </div>

          {/* Right — details */}
          <div className="flex flex-col gap-5">
            {/* Main reading */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Reading</p>
              <p className="text-3xl text-foreground font-light mb-0.5" style={{ fontFamily: "'Noto Serif JP', serif" }}>{word.char}</p>
              {word.romaji && (
                <p className="text-lg text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{word.romaji}</p>
              )}
            </div>

            {/* Meaning */}
            {word.meaning && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Meaning</p>
                <p className="text-foreground font-medium text-lg">{word.meaning}</p>
              </div>
            )}

            {/* On/Kun yomi for kanji */}
            {word.onyomi && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">On'yomi (音読み)</p>
                  <p className="text-foreground font-medium text-sm" style={{ fontFamily: "'Noto Serif JP', serif" }}>{word.onyomi}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Chinese reading</p>
                </div>
                <div className="bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">Kun'yomi (訓読み)</p>
                  <p className="text-foreground font-medium text-sm" style={{ fontFamily: "'Noto Serif JP', serif" }}>{word.kunyomi}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Japanese reading</p>
                </div>
              </div>
            )}

            {/* Mnemonic */}
            {word.mnemonic && (
              <div className="border-l-2 border-accent/40 pl-3">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Memory tip</p>
                <p className="text-sm text-foreground italic">{word.mnemonic}</p>
              </div>
            )}

            {/* Examples */}
            {word.examples && word.examples.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Examples</p>
                <div className="space-y-2">
                  {word.examples.map((ex, i) => (
                    <div key={i} className="flex flex-col border-b border-border pb-2 last:border-0 last:pb-0">
                      <button
                        onClick={() => speak(ex.jp.split(" ")[0])}
                        className="flex items-center gap-2 group text-left"
                      >
                        <span className="text-foreground text-base group-hover:text-accent transition-colors" style={{ fontFamily: "'Noto Serif JP', serif" }}>{ex.jp}</span>
                        <Volume2 size={11} className="text-muted-foreground/40 group-hover:text-accent transition-colors flex-shrink-0" />
                      </button>
                      <span className="text-sm text-muted-foreground">{ex.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            {word.related && word.related.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Related characters</p>
                <div className="flex gap-2 flex-wrap">
                  {word.related.map(r => (
                    <div key={r} className="w-10 h-10 bg-secondary border border-border flex items-center justify-center text-xl text-foreground hover:border-accent/50 transition-colors cursor-default" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── useWordModal hook ────────────────────────────────────────────────────────

function useWordModal() {
  const [word, setWord] = useState<WordDetail | null>(null);

  const openKanji = (char: string) => {
    const d = kanjiDetails[char];
    if (d) setWord(d);
    else setWord({ char, type: "kanji", meaning: "Kanji character", strokes: undefined });
  };

  const openHiragana = (char: string, rom: string) => {
    const d = hiraganaDetails[char];
    if (d) setWord(d);
    else setWord({ char, type: "hiragana", romaji: rom });
  };

  const openKatakana = (char: string, rom: string) => {
    setWord({ char, type: "katakana", romaji: rom, meaning: `Katakana for "${rom}"` });
  };

  const openVocab = (w: typeof dictionary[0]) => {
    setWord({
      char: w.jp,
      type: "vocab",
      romaji: w.rom,
      meaning: w.en,
      vocabType: w.type,
      level: w.level,
      examples: w.example ? [{ jp: w.example, en: w.exampleEn ?? "" }] : undefined,
    });
  };

  const close = () => setWord(null);

  return { word, openKanji, openHiragana, openKatakana, openVocab, close };
}

// ─── Sub-pages ────────────────────────────────────────────────────────────────

function TranslatePage() {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"en-jp" | "jp-en">("en-jp");
  const [result, setResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translate = async () => {
    const q = text.trim();
    if (!q) return;
    setIsTranslating(true);
    setResult(null);
    try {
      const sl = direction === "en-jp" ? "en" : "ja";
      const tl = direction === "en-jp" ? "ja" : "en";
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data[0]) {
        const translatedText = data[0].map((item: any) => item[0]).join("");
        setResult(translatedText);
      } else {
        setResult("Translation failed.");
      }
    } catch (error) {
      console.error(error);
      setResult("Error connecting to translation service.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrLoading(true);
    setText("");
    setResult(null);
    try {
      const lang = direction === "en-jp" ? "eng" : "jpn"; // tesseract uses eng / jpn
      const result = await Tesseract.recognize(file, lang);
      setText(result.data.text.trim());
    } catch (error) {
      console.error(error);
      setText("Could not read text from image.");
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-2">Translate</p>
        <h2 className="text-4xl text-foreground mb-2" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>Japanese ↔ English</h2>
        <p className="text-muted-foreground text-sm">Type a word, paste a sentence, or upload an image to translate.</p>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <span className={`text-sm font-medium ${direction === "en-jp" ? "text-foreground" : "text-muted-foreground"}`}>English</span>
        <button onClick={() => { setDirection(d => d === "en-jp" ? "jp-en" : "en-jp"); setText(""); setResult(null); }}
          className="flex items-center justify-center w-8 h-8 border border-border hover:border-accent/50 hover:text-accent transition-colors">
          <ArrowLeftRight size={14} />
        </button>
        <span className={`text-sm font-medium ${direction === "jp-en" ? "text-foreground" : "text-muted-foreground"}`} style={{ fontFamily: "'Noto Serif JP', serif" }}>日本語</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border bg-card relative">
          <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground font-medium flex justify-between items-center">
            <span>{direction === "en-jp" ? "English" : "Japanese"}</span>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors">
              <ImageIcon size={13} /> <span className="hidden sm:inline">Upload Image</span>
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          </div>
          <div className="relative">
            <textarea className="w-full p-4 bg-transparent resize-none text-foreground outline-none text-lg min-h-36"
              placeholder={direction === "en-jp" ? "Type in English or upload image…" : "日本語を入力、または画像をアップロード…"}
              value={text} onChange={e => { setText(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), translate())} 
              disabled={isOcrLoading}
            />
            {isOcrLoading && (
              <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 size={24} className="text-accent animate-spin mb-2" />
                <span className="text-sm text-foreground">Reading image...</span>
              </div>
            )}
          </div>
          <div className="border-t border-border px-4 py-2 flex justify-end">
            <button onClick={translate} disabled={!text.trim() || isTranslating || isOcrLoading} 
              className="bg-primary text-primary-foreground text-sm px-4 py-1.5 hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2">
              {isTranslating ? <><Loader2 size={14} className="animate-spin" /> Translating</> : "Translate"}
            </button>
          </div>
        </div>
        
        <div className="border border-border bg-secondary relative">
          <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>{direction === "en-jp" ? "Japanese" : "English"}</span>
            {result && direction === "en-jp" && (
              <button onClick={() => speak(result)} className="text-muted-foreground hover:text-accent transition-colors"><Volume2 size={13} /></button>
            )}
          </div>
          <div className="p-4 min-h-36 flex items-start">
            {isTranslating ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground pt-8">
                <Loader2 size={24} className="animate-spin mb-2 text-accent" />
                <span className="text-sm">Connecting to Google Translate...</span>
              </div>
            ) : result ? (
              <p className="text-2xl text-foreground leading-relaxed" style={{ fontFamily: direction === "en-jp" ? "'Noto Serif JP', serif" : "inherit" }}>{result}</p>
            ) : (
              <p className="text-muted-foreground/40 text-sm mt-2">Translation appears here…</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Quick phrases</p>
        <div className="flex flex-wrap gap-2">
          {["hello", "thank you", "excuse me", "i love you", "delicious", "beautiful", "help"].map(p => (
            <button key={p} onClick={() => { setText(p); setDirection("en-jp"); setResult(null); }}
              className="text-sm border border-border px-3 py-1.5 bg-card hover:border-accent/50 hover:text-accent transition-colors capitalize">{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DictionaryPage() {
  const { word, openVocab, close } = useWordModal();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof localDictionary[0] | null>(null);
  
  const [results, setResults] = useState<typeof localDictionary>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults(localDictionary);
      return;
    }

    const localMatch = localDictionary.filter(w => 
      w.jp.includes(q) || w.rom.includes(q) || w.en.toLowerCase().includes(q)
    );

    if (localMatch.length > 0) {
      setResults(localMatch);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setResults([]);
      try {
        const res = await fetch(`/api/jisho/search/words?keyword=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if (data && data.data) {
          const apiResults = data.data.slice(0, 15).map((item: any) => {
            const jp = item.japanese[0]?.word || item.japanese[0]?.reading || q;
            const rom = item.japanese[0]?.reading || ""; 
            const en = item.senses[0]?.english_definitions.join(", ") || "";
            return {
              jp,
              rom,
              en,
              type: "vocab",
              level: item.jlpt?.[0] ? item.jlpt[0].replace("jlpt-", "").toUpperCase() : "API",
              example: "",
              exampleEn: ""
            };
          });
          setResults(apiResults);
        }
      } catch (err) {
        console.error("API Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 600); 

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!query) setResults(localDictionary);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      {word && <WordModal word={word} onClose={close} />}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-2">Dictionary</p>
        <h2 className="text-4xl text-foreground mb-2" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>Vocabulary Search</h2>
        <p className="text-muted-foreground text-sm">Fast local search, with automatic fallback to Jisho API for new words.</p>
      </div>
      
      <div className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="w-full bg-card border border-border pl-10 pr-4 py-3 text-foreground outline-none focus:border-accent/60 transition-colors text-base"
          placeholder="Search… e.g. たべる, eat, tomodachi"
          value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} />
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 space-y-1 relative min-h-[150px]">
          {isSearching && (
             <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center pt-8 z-10">
                <Loader2 size={24} className="text-accent animate-spin mb-2" />
                <span className="text-sm text-muted-foreground">Searching Live API...</span>
             </div>
          )}
          {!isSearching && results.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No results found.</p>}
          {!isSearching && results.map((w, idx) => (
            <button key={`${w.jp}-${idx}`} onClick={() => { setSelected(w); openVocab(w as any); }}
              className={`w-full text-left px-4 py-3 border transition-colors flex items-center gap-4 ${selected?.jp === w.jp ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-accent/40"}`}>
              <span className="text-2xl flex-shrink-0" style={{ fontFamily: "'Noto Serif JP', serif" }}>{w.jp}</span>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${selected?.jp === w.jp ? "text-primary-foreground" : "text-foreground"}`}>{w.en}</p>
                <p className={`text-xs truncate ${selected?.jp === w.jp ? "text-primary-foreground/50" : "text-muted-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>{w.rom}</p>
              </div>
              <span className={`ml-auto text-xs flex-shrink-0 px-1.5 py-0.5 ${selected?.jp === w.jp ? "bg-white/15 text-white" : "bg-secondary text-muted-foreground"}`}>{w.level}</span>
              <Info size={13} className={selected?.jp === w.jp ? "text-white/40" : "text-muted-foreground/30"} />
            </button>
          ))}
        </div>
        <div className="md:col-span-2">
          <div className="border border-border bg-card p-6 sticky top-20">
            {selected ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-6xl text-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{selected.jp}</span>
                  <button onClick={() => speak(selected.jp)} className="text-muted-foreground hover:text-accent transition-colors mt-2"><Volume2 size={18} /></button>
                </div>
                <p className="text-muted-foreground text-sm mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{selected.rom}</p>
                <p className="text-foreground font-medium text-lg mb-3">{selected.en}</p>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 capitalize">{selected.type}</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5">{selected.level}</span>
                </div>
                {selected.example && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Example</p>
                    <p className="text-foreground mb-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>{selected.example}</p>
                    <p className="text-sm text-muted-foreground italic">{selected.exampleEn}</p>
                  </div>
                )}
                <button onClick={() => openVocab(selected as any)} className="mt-4 w-full border border-border text-sm text-muted-foreground py-2 hover:border-accent/40 hover:text-accent transition-colors flex items-center justify-center gap-1.5">
                  <Info size={12} /> Full details & writing
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl text-muted-foreground/20 mb-4" style={{ fontFamily: "'Noto Serif JP', serif" }}>辞</span>
                <p className="text-muted-foreground text-sm">Select a word to see details</p>
                <p className="text-muted-foreground/50 text-xs mt-1">Click for full popup with writing guide</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WritingPage() {
  const { word, openHiragana, openKatakana, openKanji, close } = useWordModal();
  const [activeTab, setActiveTab] = useState<"hiragana" | "katakana" | "kanji">("hiragana");

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {word && <WordModal word={word} onClose={close} />}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-2">Writing Systems</p>
        <h2 className="text-4xl text-foreground mb-2" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>Three Scripts, One Language</h2>
        <p className="text-muted-foreground text-sm">Click any character for a full detail popup with stroke animation, readings, and examples.</p>
      </div>
      <div className="flex gap-0 mb-8 border border-border w-fit">
        {(["hiragana", "katakana", "kanji"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "hiragana" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">Hiragana (ひらがな) — 46 phonetic characters. Click any to see stroke order and details.</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {hiragana.map((h, i) => (
              <button key={i} onClick={() => h.rom && openHiragana(h.char, h.rom)}
                className={`bg-card border border-border flex flex-col items-center justify-center py-3 transition-all duration-150 ${h.rom === "" ? "opacity-0 pointer-events-none" : "hover:border-accent hover:bg-accent/5 cursor-pointer group"}`}>
                <span className="text-xl text-foreground leading-none mb-1 group-hover:scale-110 transition-transform" style={{ fontFamily: "'Noto Serif JP', serif" }}>{h.char}</span>
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{h.rom}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "katakana" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">Katakana (カタカナ) — 46 characters for loanwords. Click any to explore.</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {katakana.map((k, i) => (
              <button key={i} onClick={() => k.rom && openKatakana(k.char, k.rom)}
                className={`bg-card border border-border flex flex-col items-center justify-center py-3 transition-all duration-150 ${k.rom === "" ? "opacity-0 pointer-events-none" : "hover:border-accent hover:bg-accent/5 cursor-pointer group"}`}>
                <span className="text-xl text-foreground leading-none mb-1 group-hover:scale-110 transition-transform" style={{ fontFamily: "'Noto Serif JP', serif" }}>{k.char}</span>
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{k.rom}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "kanji" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">Kanji (漢字) — logographic characters. Click any for on/kun readings, strokes, and examples.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {kanjiList.map((k, i) => (
              <button key={i} onClick={() => openKanji(k.char)}
                className="bg-card border border-border p-4 hover:border-accent/50 transition-colors duration-150 cursor-pointer group text-left">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-4xl text-foreground group-hover:scale-110 inline-block transition-transform origin-left" style={{ fontFamily: "'Noto Serif JP', serif" }}>{k.char}</span>
                  <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 font-medium">{k.level}</span>
                </div>
                <p className="text-xs font-medium text-foreground mb-0.5">{k.meaning}</p>
                <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{k.reading}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlashcardsPage() {
  const { word, openVocab, close } = useWordModal();
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);

  const vocab = dictionary.filter(d => d.type !== "phrase").slice(0, 20);
  const currentCard = vocab[cardIndex];

  const nextCard = (known: boolean) => {
    if (known) setKnownCards(prev => prev.includes(cardIndex) ? prev : [...prev, cardIndex]);
    setFlipped(false);
    setTimeout(() => setCardIndex(i => (i + 1) % vocab.length), 100);
  };

  const reset = () => { setCardIndex(0); setFlipped(false); setKnownCards([]); };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      {word && <WordModal word={word} onClose={close} />}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-2">Flashcards</p>
        <h2 className="text-4xl text-foreground mb-2" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>Vocabulary Practice</h2>
        <p className="text-muted-foreground text-sm">Flip cards to reveal meaning. Click the info button for full word details.</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600" />{knownCards.length} known</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" />{Math.max(0, vocab.length - knownCards.length)} remaining</span>
        <button onClick={reset} className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors"><RotateCcw size={12} /> Reset</button>
      </div>
      <div className="h-1 bg-muted mb-8 overflow-hidden">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(knownCards.length / vocab.length) * 100}%` }} />
      </div>
      <div className="flex flex-col items-center gap-6">
        {knownCards.length >= vocab.length ? (
          <div className="w-full h-60 bg-card border border-border flex flex-col items-center justify-center text-center px-8">
            <Trophy size={48} className="text-accent mb-4" />
            <h3 className="text-2xl text-foreground font-medium mb-2">Great job!</h3>
            <p className="text-muted-foreground text-sm mb-4">You've reviewed all {vocab.length} cards.</p>
            <button onClick={reset} className="bg-primary text-primary-foreground px-6 py-2 hover:bg-accent transition-colors text-sm">Practice Again</button>
          </div>
        ) : (
          <>
            <div className="w-full h-60 bg-card border border-border cursor-pointer flex flex-col items-center justify-center text-center px-8 transition-all duration-150 hover:border-foreground/20 select-none relative"
              onClick={() => setFlipped(!flipped)}>
              <button onClick={e => { e.stopPropagation(); openVocab(currentCard); }}
                className="absolute top-3 right-3 text-muted-foreground/40 hover:text-accent transition-colors p-1">
                <Info size={15} />
              </button>
              {!flipped ? (
                <>
                  <p className="text-5xl text-foreground mb-3" style={{ fontFamily: "'Noto Serif JP', serif" }}>{currentCard.jp}</p>
                  <p className="text-base text-muted-foreground mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>{currentCard.rom}</p>
                  <button onClick={e => { e.stopPropagation(); speak(currentCard.jp); }} className="text-muted-foreground hover:text-accent transition-colors"><Volume2 size={16} /></button>
                  <p className="text-xs text-muted-foreground/40 mt-3">tap to reveal</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-medium text-foreground mb-2">{currentCard.en}</p>
                  <p className="text-base text-muted-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{currentCard.jp}</p>
                  <span className="mt-3 text-xs bg-secondary text-muted-foreground px-2 py-0.5 capitalize">{currentCard.type}</span>
                </>
              )}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => nextCard(false)} className="flex-1 flex items-center justify-center gap-2 border border-border py-3 text-sm text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors">
                <X size={14} /> Missed it
              </button>
              <button onClick={() => nextCard(true)} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 text-sm hover:bg-accent transition-colors">
                <Check size={14} /> Got it
              </button>
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{cardIndex + 1} / {vocab.length}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Games ────────────────────────────────────────────────────────────────────

function QuizGame() {
  const { word, openHiragana, close } = useWordModal();
  const pool = hiragana.filter(h => h.rom !== "");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState(() => pool[Math.floor(Math.random() * pool.length)]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const generate = useCallback((question: typeof pool[0]) => {
    const wrong = shuffle(pool.filter(h => h.rom !== question.rom)).slice(0, 3).map(h => h.rom);
    setOptions(shuffle([question.rom, ...wrong]));
    setSelected(null);
  }, []);

  useEffect(() => { generate(q); }, [q]);

  const answer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.rom;
    setTotal(t => t + 1);
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); }
    else setStreak(0);
    setTimeout(() => {
      if (total + 1 >= 10) { setFinished(true); return; }
      const next = pool[Math.floor(Math.random() * pool.length)];
      setQ(next);
    }, 900);
  };

  const restart = () => { setScore(0); setStreak(0); setTotal(0); setFinished(false); const next = pool[Math.floor(Math.random() * pool.length)]; setQ(next); generate(next); };

  if (finished) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Trophy size={40} className="text-accent mb-4" />
      <h3 className="text-3xl font-medium mb-2" style={{ fontFamily: "'Noto Serif JP', serif" }}>結果</h3>
      <p className="text-muted-foreground mb-1">Your score</p>
      <p className="text-6xl font-medium text-foreground mb-1">{score}<span className="text-2xl text-muted-foreground">/10</span></p>
      <p className="text-sm text-muted-foreground mb-8">{score >= 8 ? "Excellent! 素晴らしい！" : score >= 5 ? "Good effort! 頑張った！" : "Keep practicing! もっと練習！"}</p>
      <button onClick={restart} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm hover:bg-accent transition-colors">Play Again</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8">
      {word && <WordModal word={word} onClose={close} />}
      <div className="flex gap-6 text-sm text-muted-foreground w-full justify-center">
        <span>Question <span className="text-foreground font-medium">{Math.min(total + 1, 10)}</span>/10</span>
        <span>Score <span className="text-foreground font-medium">{score}</span></span>
        {streak >= 2 && <span className="text-accent flex items-center gap-1"><Zap size={12} />{streak} streak</span>}
      </div>
      <div className="relative group">
        <div className="w-48 h-48 bg-card border-2 border-border flex items-center justify-center cursor-pointer hover:border-accent/40 transition-colors"
          onClick={() => openHiragana(q.char, q.rom)}>
          <span className="text-8xl text-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{q.char}</span>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          click for details
        </div>
      </div>
      <p className="text-sm text-muted-foreground">What is the romaji for this character?</p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {options.map(opt => {
          const isCorrect = opt === q.rom;
          const isSelected = selected === opt;
          let cls = "py-3 text-base border transition-colors font-medium ";
          if (!selected) cls += "border-border bg-card hover:border-accent hover:text-accent cursor-pointer";
          else if (isCorrect) cls += "border-green-600 bg-green-600/10 text-green-700";
          else if (isSelected) cls += "border-destructive bg-destructive/10 text-destructive";
          else cls += "border-border bg-card text-muted-foreground opacity-50";
          return <button key={opt} onClick={() => answer(opt)} className={cls} style={{ fontFamily: "'DM Mono', monospace" }}>{opt}</button>;
        })}
      </div>
    </div>
  );
}

function MatchGame() {
  const pairs = shuffle(hiragana.filter(h => h.rom !== "")).slice(0, 6);
  const [cards] = useState(() => shuffle([
    ...pairs.map((p, i) => ({ id: i * 2, val: p.char, type: "char", pairId: i })),
    ...pairs.map((p, i) => ({ id: i * 2 + 1, val: p.rom, type: "rom", pairId: i })),
  ]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const flip = (id: number) => {
    if (flipped.length === 2 || matched.includes(id) || flipped.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next.map(i => cards.find(c => c.id === i)!);
      if (a.pairId === b.pairId) {
        const nm = [...matched, a.id, b.id];
        setMatched(nm);
        setFlipped([]);
        if (nm.length === cards.length) setDone(true);
      } else setTimeout(() => setFlipped([]), 900);
    }
  };

  const restart = () => window.location.reload();

  if (done) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Trophy size={36} className="text-accent mb-4" />
      <h3 className="text-2xl font-medium mb-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>完成！</h3>
      <p className="text-muted-foreground mb-6">Completed in <span className="text-foreground font-medium">{moves}</span> moves</p>
      <button onClick={restart} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm hover:bg-accent transition-colors">Play Again</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>Moves <span className="text-foreground font-medium">{moves}</span></span>
        <span>Matched <span className="text-foreground font-medium">{matched.length / 2}</span>/6</span>
      </div>
      <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <button key={card.id} onClick={() => flip(card.id)}
              className={`h-16 border transition-all duration-150 flex items-center justify-center text-center ${isMatched ? "bg-green-600/10 border-green-600/40 text-green-700" : isFlipped ? "bg-card border-accent text-foreground" : "bg-primary/5 border-border hover:border-accent/50 cursor-pointer"}`}>
              {isFlipped ? (
                <span className={card.type === "char" ? "text-xl" : "text-sm"} style={{ fontFamily: card.type === "char" ? "'Noto Serif JP', serif" : "'DM Mono', monospace" }}>{card.val}</span>
              ) : <span className="text-2xl text-foreground/10" style={{ fontFamily: "'Noto Serif JP', serif" }}>?</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Match each hiragana character to its romaji reading.</p>
    </div>
  );
}

function SpeedGame() {
  const pool = dictionary.filter(d => d.type !== "phrase").slice(0, 15);
  const [gameState, setGameState] = useState<"idle" | "playing" | "done">("idle");
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameState !== "playing") return;
    const t = setInterval(() => setTimeLeft(tl => { if (tl <= 1) { clearInterval(t); setGameState("done"); return 0; } return tl - 1; }), 1000);
    return () => clearInterval(t);
  }, [gameState]);

  const start = () => { setCurrent(0); setInput(""); setScore(0); setTimeLeft(30); setGameState("playing"); setTimeout(() => inputRef.current?.focus(), 50); };

  const handleInput = (val: string) => {
    setInput(val);
    const w = pool[current % pool.length];
    if (val.toLowerCase().trim() === w.en.toLowerCase() || val.toLowerCase().trim() === w.rom.toLowerCase()) {
      setScore(s => s + 1); setInput(""); setCurrent(c => c + 1);
    }
  };

  if (gameState === "idle") return (
    <div className="flex flex-col items-center py-12 text-center gap-4">
      <Clock size={36} className="text-accent" />
      <h3 className="text-2xl font-medium" style={{ fontFamily: "'Noto Serif JP', serif" }}>Speed Typing</h3>
      <p className="text-muted-foreground text-sm max-w-xs">Type the English meaning or romaji of the displayed Japanese word. You have 30 seconds.</p>
      <button onClick={start} className="mt-4 bg-accent text-accent-foreground px-6 py-2.5 text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"><Zap size={14} /> Start Game</button>
    </div>
  );

  if (gameState === "done") return (
    <div className="flex flex-col items-center py-12 text-center">
      <Trophy size={36} className="text-accent mb-4" />
      <h3 className="text-2xl font-medium mb-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>時間切れ！</h3>
      <p className="text-muted-foreground mb-2">Time's up!</p>
      <p className="text-6xl font-medium text-foreground mb-1">{score}</p>
      <p className="text-muted-foreground mb-8">words answered</p>
      <button onClick={start} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm hover:bg-accent transition-colors">Play Again</button>
    </div>
  );

  const w = pool[current % pool.length];
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span className={`flex items-center gap-1 font-medium ${timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}><Clock size={13} />{timeLeft}s</span>
        <span>Score <span className="text-foreground font-medium">{score}</span></span>
      </div>
      <div className="w-48 h-48 bg-card border-2 border-border flex flex-col items-center justify-center">
        <span className="text-5xl text-foreground" style={{ fontFamily: "'Noto Serif JP', serif" }}>{w.jp}</span>
        <span className="text-xs text-muted-foreground mt-2 capitalize">{w.type}</span>
      </div>
      <p className="text-sm text-muted-foreground">Type the English meaning or romaji</p>
      <input ref={inputRef} className="border-b-2 border-border focus:border-accent outline-none bg-transparent text-center text-xl text-foreground py-2 w-48 transition-colors"
        value={input} onChange={e => handleInput(e.target.value)} placeholder="type here…" autoComplete="off" />
    </div>
  );
}

function GamesPage() {
  const [game, setGame] = useState<GameType>("quiz");
  const [key, setKey] = useState(0);

  const games = [
    { id: "quiz" as GameType, label: "Character Quiz", icon: <Target size={16} />, desc: "Identify hiragana from 4 choices" },
    { id: "match" as GameType, label: "Memory Match", icon: <Layers size={16} />, desc: "Pair hiragana with their romaji" },
    { id: "speed" as GameType, label: "Speed Typing", icon: <Zap size={16} />, desc: "Translate as many words as possible in 30s" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-2">Games</p>
        <h2 className="text-4xl text-foreground mb-2" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>Practice Through Play</h2>
        <p className="text-muted-foreground text-sm">Learning sticks better when it's fun. Choose a game to drill your Japanese.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-10">
        {games.map(g => (
          <button key={g.id} onClick={() => { setGame(g.id); setKey(k => k + 1); }}
            className={`text-left p-4 border transition-all ${game === g.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-foreground/30"}`}>
            <div className={`mb-2 ${game === g.id ? "text-accent" : "text-muted-foreground"}`}>{g.icon}</div>
            <p className={`text-sm font-medium mb-1 ${game === g.id ? "text-primary-foreground" : "text-foreground"}`}>{g.label}</p>
            <p className={`text-xs ${game === g.id ? "text-primary-foreground/50" : "text-muted-foreground"}`}>{g.desc}</p>
          </button>
        ))}
      </div>
      <div className="border border-border bg-card p-8">
        <div key={key}>
          {game === "quiz" && <QuizGame />}
          {game === "match" && <MatchGame />}
          {game === "speed" && <SpeedGame />}
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  const { word, openKanji, close } = useWordModal();
  const [activeLesson, setActiveLesson] = useState(0);

  return (
    <>
      {word && <WordModal word={word} onClose={close} />}
      <section className="min-h-[90vh] grid md:grid-cols-2">
        <div className="bg-primary flex flex-col justify-center px-10 md:px-16 py-24 md:py-0 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
            <span className="text-[28rem] text-white leading-none" style={{ fontFamily: "'Noto Serif JP', serif" }}>語</span>
          </div>
          <div className="relative z-10">
            <p className="text-accent text-xs tracking-[0.3em] uppercase mb-6 font-medium">日本語を学ぼう</p>
            <h1 className="text-primary-foreground text-5xl md:text-6xl leading-tight mb-6" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>
              Learn Japanese<br /><em className="not-italic text-accent">the right way.</em>
            </h1>
            <p className="text-primary-foreground/60 text-base leading-relaxed max-w-sm mb-10">
              From first hiragana stroke to reading novels — lessons, games, a full dictionary, and instant translation.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setPage("flashcards")} className="bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
                Begin Learning <ChevronRight size={16} />
              </button>
              <button onClick={() => setPage("games")} className="border border-primary-foreground/20 text-primary-foreground/70 px-6 py-3 text-sm font-medium hover:border-primary-foreground/50 transition-colors flex items-center gap-2">
                <Gamepad2 size={15} /> Play Games
              </button>
            </div>
          </div>
        </div>
        <div className="bg-secondary flex flex-col justify-center items-center px-10 py-16 gap-8">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">Today's character — click to explore</p>
          <button className="relative group" onClick={() => openKanji("愛")}>
            <div className="w-44 h-44 bg-card border border-border flex items-center justify-center shadow-sm group-hover:border-accent/50 transition-colors">
              <span className="text-7xl text-foreground group-hover:scale-110 transition-transform" style={{ fontFamily: "'Noto Serif JP', serif" }}>愛</span>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-accent text-accent-foreground text-xs px-2 py-0.5 font-medium">N3</div>
            <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-1.5 py-0.5 whitespace-nowrap">
              Click for details
            </div>
          </button>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>ai</p>
            <p className="text-foreground font-medium text-lg">Love / Affection</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-2">
            {[
              { label: "Translate", icon: <ArrowLeftRight size={14} />, page: "translate" as Page },
              { label: "Dictionary", icon: <Search size={14} />, page: "dictionary" as Page },
              { label: "Flashcards", icon: <BookOpen size={14} />, page: "flashcards" as Page },
              { label: "Games", icon: <Gamepad2 size={14} />, page: "games" as Page },
            ].map(({ label, icon, page }) => (
              <button key={label} onClick={() => setPage(page)}
                className="flex items-center gap-2 justify-center border border-border bg-card py-2.5 text-sm text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors">
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-accent font-medium mb-3">Structured Path</p>
          <h2 className="text-4xl text-foreground" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>JLPT-aligned Lessons</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lessons.map((lesson, i) => (
            <button key={lesson.level} onClick={() => setActiveLesson(i)}
              className={`text-left p-6 border transition-all duration-200 ${activeLesson === i ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-foreground/30"}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium px-2 py-0.5"
                  style={{ background: activeLesson === i ? "rgba(255,255,255,0.15)" : lesson.color + "20", color: activeLesson === i ? "white" : lesson.color }}>{lesson.level}</span>
                <BookOpen size={14} className={activeLesson === i ? "text-primary-foreground/50" : "text-muted-foreground"} />
              </div>
              <h3 className={`font-medium mb-3 text-base ${activeLesson === i ? "text-primary-foreground" : "text-foreground"}`}>{lesson.title}</h3>
              <ul className="space-y-1.5 mb-4">
                {lesson.topics.map(t => (
                  <li key={t} className={`text-xs flex items-center gap-2 ${activeLesson === i ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />{t}
                  </li>
                ))}
              </ul>
              <p className={`text-xs ${activeLesson === i ? "text-primary-foreground/40" : "text-muted-foreground/60"}`}>{lesson.students.toLocaleString()} students</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-primary py-14 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { icon: <BookOpen size={20} />, title: "Structured Curriculum", desc: "Follow a clear path from N5 to N1 with no guesswork." },
            { icon: <PenTool size={20} />, title: "Stroke Order Practice", desc: "Learn correct writing strokes for every character." },
            { icon: <Layers size={20} />, title: "Spaced Repetition", desc: "Review vocabulary exactly when you're about to forget it." },
          ].map(f => (
            <div key={f.title} className="flex gap-4 items-start">
              <div className="text-accent mt-0.5 flex-shrink-0">{f.icon}</div>
              <div>
                <h3 className="text-primary-foreground font-medium mb-1">{f.title}</h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-widest uppercase text-accent font-medium mb-4">Get Started</p>
        <h2 className="text-5xl text-foreground mb-4" style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300 }}>始めましょう</h2>
        <p className="text-muted-foreground mb-10 text-sm">Join thousands building real fluency, one character at a time.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setPage("flashcards")} className="bg-accent text-accent-foreground px-8 py-3 font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
            Start Flashcards <ChevronRight size={16} />
          </button>
          <button onClick={() => setPage("games")} className="border border-border text-foreground px-8 py-3 font-medium hover:border-foreground/40 transition-colors flex items-center justify-center gap-2">
            <Star size={14} /> Try Games
          </button>
        </div>
      </section>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: { label: string; page: Page; icon: React.ReactNode }[] = [
    { label: "Home", page: "home", icon: <Home size={14} /> },
    { label: "Translate", page: "translate", icon: <ArrowLeftRight size={14} /> },
    { label: "Dictionary", page: "dictionary", icon: <Search size={14} /> },
    { label: "Writing", page: "writing", icon: <PenTool size={14} /> },
    { label: "Flashcards", page: "flashcards", icon: <BookOpen size={14} /> },
    { label: "Games", page: "games", icon: <Gamepad2 size={14} /> },
  ];

  const navigate = (p: Page) => { setPage(p); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("home")} className="flex items-center gap-2.5">
            <span className="text-accent font-bold text-xl" style={{ fontFamily: "'Noto Serif JP', serif" }}>日</span>
            <span className="text-sm font-medium tracking-widest uppercase text-foreground/70">Nihongo</span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => navigate(l.page)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 transition-colors ${page === l.page ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>
          <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-4 grid grid-cols-2 gap-2">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => navigate(l.page)}
                className={`flex items-center gap-2 text-sm py-2 ${page === l.page ? "text-accent font-medium" : "text-muted-foreground"}`}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="pt-14">
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "translate" && <TranslatePage />}
        {page === "dictionary" && <DictionaryPage />}
        {page === "writing" && <WritingPage />}
        {page === "flashcards" && <FlashcardsPage />}
        {page === "games" && <GamesPage />}
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-lg" style={{ fontFamily: "'Noto Serif JP', serif" }}>日</span>
            <span className="text-sm text-muted-foreground">Nihongo · Japanese Learning</span>
          </div>
          <p className="text-xs text-muted-foreground/50">頑張ってください — Keep up the good work.</p>
        </div>
      </footer>
    </div>
  );
}
