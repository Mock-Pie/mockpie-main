import re, nltk, string, logging
from typing import Dict, Any, List
from lexicalrichness import LexicalRichness
import numpy as np

logger = logging.getLogger(__name__)

class LexicalRichnessAnalyzer:
    """
    Lexical Richness and Vocabulary Diversity Analysis
    Supports English, Modern-Standard Arabic, and Egyptian Colloquial Arabic
    """

    # ---------- 1.  INITIALISATION ----------
    def __init__(self,
                 transcription_service_english=None,
                 transcription_service_arabic=None):
        self.transcription_service_english = transcription_service_english
        self.transcription_service_arabic  = transcription_service_arabic

        # download minimal NLTK data
        for pkg in ("punkt", "stopwords"):
            try:
                nltk.download(pkg, quiet=True)
            except:  # noqa
                pass

        # English stop-words
        try:
            from nltk.corpus import stopwords
            self.english_stop_words = set(stopwords.words("english"))
        except:  # noqa
            self.english_stop_words = set()

        # Standard Arabic stop-words  (≈ 40 common tokens)
        self.msa_stop_words = {
            "في","من","إلى","على","هذا","هذه","ذلك","الذي","التي","كان","كانت","يكون","أنا","أنت",
            "هو","هي","نحن","هم","هن","و","أو","لكن","إذا","إن","أن","ما","ماذا","كيف","أين","متى",
            "لماذا","لا","نعم","أيضا","فقط","حيث","عندما","كل","أي","هناك","هنا"
        }

        # ---------- Egyptian colloquial additions ----------
        self.egy_stop_words = {
            "مش","ما","يعني","اوي","قوي","كده","كدا","كدة","تمام","طيب","برضه","برضة","بص","لسه",
            "عشان","ليه","فيه","كده","اه","ايوه","واهو","جامد","او","حاجة","حاجه","جدا","بس",
            "انا","انت","انتي","هو","هي","احنا"
        }

        # Compiled regexes for Arabic processing
        self.arabic_patterns = {
            "tashkeel": re.compile(r"[\u064B-\u065F\u0670-\u06ED\u08D4-\u08FE]"),
            "arabic_chars": re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
        }

    # ---------- 2.  PUBLIC API ----------
    def analyze(self,
                transcript: str,
                language : str = "english") -> Dict[str, Any]:
        """
        transcript – already-generated text of the speech
        language   – 'english' | 'arabic'
        """
        if not transcript or not transcript.strip():
            return {"error": "No transcript supplied", "overall_score": 5.0}

        detected_lang = self._detect_language(transcript)
        text          = self._preprocess_text(transcript, detected_lang)
        metrics       = self._calculate_richness_metrics(text)
        vocab_stats   = self._calculate_vocabulary_statistics(text, detected_lang)
        complexity    = self._analyze_complexity(text)
        assessment    = self._generate_assessment(metrics, vocab_stats, complexity, detected_lang)
        recs          = self._generate_recommendations(metrics, vocab_stats, detected_lang)

        return {
            "language"            : detected_lang,
            "transcript_length"   : len(transcript.split()),
            "richness_metrics"    : metrics,
            "vocabulary_statistics": vocab_stats,
            "complexity_analysis" : complexity,
            "assessment"          : assessment,
            "overall_score"       : assessment["richness_score"],
            "recommendations"     : recs
        }

    # ---------- 3.  LANGUAGE DETECTION ----------
    def _detect_language(self, text: str) -> str:
        arabic_chars = len(self.arabic_patterns["arabic_chars"].findall(text))
        total_chars  = len(text.translate(str.maketrans("", "", " \n")))
        return "arabic" if arabic_chars > total_chars * 0.3 else "english"

    # ---------- 4.  CLEANING ----------
    def _preprocess_text(self, text: str, lang: str) -> str:
        if lang == "arabic":
            # remove diacritics and normalise common letters
            text = self.arabic_patterns["tashkeel"].sub("", text)
            text = (text.replace("أ", "ا")
                        .replace("إ", "ا")
                        .replace("آ", "ا")
                        .replace("ى", "ي")
                        .replace("ة", "ه"))
            text = re.sub(r"[^\u0600-\u06FF\s]", "", text)
        else:
            text = text.lower().translate(str.maketrans("", "", string.punctuation))
        return re.sub(r"\s+", " ", text).strip()

    # ---------- 5.  RICHNESS METRICS ----------
    def _calculate_richness_metrics(self, text: str) -> Dict[str, float]:
        try:
            lex = LexicalRichness(text)
            return {
                "type_token_ratio": round(lex.ttr, 3),
                "mtld"            : round(lex.mtld(threshold=0.72) if lex.mtld() != float("inf") else 0, 2),
                "hdd"             : round(lex.hdd(draws=42), 3)
            }
        except Exception as e:
            logger.warning(f"LexicalRichness error: {e}")
            words = text.split()
            uniq  = set(words)
            return {"type_token_ratio": len(uniq)/len(words) if words else 0,
                    "mtld": 0, "hdd": 0}

    # ---------- 6.  VOCAB STATS ----------
    def _calculate_vocabulary_statistics(self, text: str, lang: str) -> Dict[str, Any]:
        words   = text.split()
        unique  = set(words)
        stopset = (self.msa_stop_words | self.egy_stop_words) if lang == "arabic" else self.english_stop_words
        content = [w for w in words if w not in stopset]
        freq    = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        hapax = sum(1 for f in freq.values() if f == 1)
        return {
            "total_words"         : len(words),
            "unique_words"        : len(unique),
            "content_word_ratio"  : round(len(content)/len(words), 3) if words else 0,
            "hapax_legomena"      : hapax,
            "most_frequent_words" : sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]
        }

    # ---------- 7.  TEXT COMPLEXITY ----------
    def _analyze_complexity(self, text: str) -> Dict[str, Any]:
        words = text.split()
        sents = [s for s in re.split(r"[.!?]+", text) if s.strip()]
        avg_ws = len(words)/len(sents) if sents else 0
        long_words = sum(1 for w in words if len(w) > 6)
        return {
            "avg_words_per_sentence": round(avg_ws,2),
            "complex_word_ratio"   : round(long_words/len(words),3) if words else 0,
            "sentence_count"       : len(sents)
        }

    # ---------- 8.  ASSESSMENT (refined thresholds) ----------
    def _generate_assessment(self,
                             rich : Dict[str,float],
                             vocab: Dict[str,Any],
                             comp : Dict[str,Any],
                             lang : str) -> Dict[str,Any]:
        ttr   = rich["type_token_ratio"]
        vsize = vocab["unique_words"]
        cwr   = comp["complex_word_ratio"]

        # Language-specific baselines
        if lang == "arabic":
            ttr_thresh = (0.55, 0.4)   # excellent ≥0.55, good ≥0.4
            vsize_base = 80
        else:                          # English
            ttr_thresh = (0.6, 0.45)
            vsize_base = 100

        score = 0
        # TTR (max 4 pts)
        score += 4 if ttr >= ttr_thresh[0] else 3 if ttr >= ttr_thresh[1] else 2 if ttr >= 0.3 else 1
        # Vocabulary size (max 3 pts)
        score += 3 if vsize > vsize_base+50 else 2 if vsize > vsize_base else 1
        # Complex word ratio (max 3 pts)
        score += 3 if cwr > 0.28 else 2 if cwr > 0.18 else 1

        level = ("excellent" if score>=8 else
                 "good"      if score>=6 else
                 "fair"      if score>=4 else "limited")
        return {"richness_score": score, "richness_level": level}

    # ---------- 9.  RECOMMENDATIONS ----------
    def _generate_recommendations(self,
                                  rich : Dict[str,float],
                                  vocab: Dict[str,Any],
                                  lang : str) -> List[str]:
        recs = []
        ttr  = rich["type_token_ratio"]
        vsize= vocab["unique_words"]
        content_ratio = vocab["content_word_ratio"]

        if ttr < 0.4:
            recs.append("Diversify your vocabulary—avoid repeating the same words.")
        if vsize < 80:
            recs.append("Introduce more varied terminology to expand vocabulary.")
        if content_ratio < 0.55:
            recs.append("Use more content words and fewer fillers/stop-words.")
        hapax_ratio = vocab["hapax_legomena"]/vsize if vsize else 0
        if hapax_ratio < 0.25:
            recs.append("Add unique words to showcase lexical breadth.")
        return recs or ["Excellent lexical richness—keep it up!"]

    # ---------- 10.  ERROR RESULT ----------
    @staticmethod
    def _create_error_result(msg: str) -> Dict[str,Any]:
        return {"error": msg, "overall_score": 5.0}
