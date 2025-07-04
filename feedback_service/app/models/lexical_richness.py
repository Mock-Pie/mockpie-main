import re
import nltk
import string
import logging
from typing import Dict, Any, List
from lexicalrichness import LexicalRichness

logger = logging.getLogger(__name__)

class LexicalRichnessAnalyzer:
    """
    Lexical Richness and Vocabulary Diversity Analysis
    Uses various metrics to assess vocabulary richness
    Supports both English and Arabic
    """

    def __init__(self, transcription_service_english=None, transcription_service_arabic=None):
        self.transcription_service_english = transcription_service_english
        self.transcription_service_arabic = transcription_service_arabic

        # Download required NLTK data
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
        except Exception as e:
            logger.warning(f"Could not download NLTK data: {e}")

        # English stopwords
        try:
            from nltk.corpus import stopwords
            self.english_stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"Could not load English stopwords: {e}")
            self.english_stop_words = set()

        # Arabic stopwords
        self.arabic_stop_words = {
            'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي',
            'كان', 'كانت', 'يكون', 'تكون', 'أنا', 'أنت', 'هو', 'هي', 'نحن', 'أنتم',
            'هم', 'هن', 'و', 'أو', 'لكن', 'إذا', 'إن', 'أن', 'ما', 'ماذا', 'كيف',
            'أين', 'متى', 'لماذا', 'ال', 'لا', 'نعم', 'أيضا', 'فقط', 'حيث', 'عندما'
        }

        self.arabic_patterns = {
            'tashkeel': re.compile(r'[\u064B-\u065F\u0670-\u06ED\u08D4-\u08FE]'),  # Arabic diacritics
            'arabic_chars': re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]'),
        }

    def analyze(self, audio_path: str, language: str, transcript: str = None) -> Dict[str, Any]:
        logger.info(f"Starting Lexical Richness Analysis for {audio_path}")
        try:
            if not isinstance(transcript, str) or not transcript.strip():
                return {
                    "error": "No transcript available for lexical analysis",
                    "richness_metrics": {},
                    "vocabulary_statistics": {},
                    "overall_score": 5.0
                }

            detected_language = self._detect_language(transcript)
            cleaned_text = self._preprocess_text(transcript, detected_language)
            richness_metrics = self._calculate_richness_metrics(cleaned_text)
            vocab_stats = self._calculate_vocabulary_statistics(cleaned_text, detected_language)
            complexity_analysis = self._analyze_complexity(cleaned_text)
            assessment = self._generate_assessment(richness_metrics, vocab_stats, complexity_analysis)
            overall_score = assessment.get("richness_score", 5.0)

            return {
                "language": detected_language,
                "transcript_length": len(transcript.split()),
                "richness_metrics": richness_metrics,
                "vocabulary_statistics": vocab_stats,
                "complexity_analysis": complexity_analysis,
                "assessment": assessment,
                "overall_score": float(overall_score),
                "recommendations": self._generate_recommendations(richness_metrics, vocab_stats)
            }
        except Exception as e:
            logger.error(f"Error in lexical richness analysis: {e}")
            return {
                "error": str(e),
                "richness_metrics": {},
                "vocabulary_statistics": {},
                "overall_score": 5.0
            }

    def _detect_language(self, text: str) -> str:
        try:
            arabic_chars = len(self.arabic_patterns['arabic_chars'].findall(text))
            total_chars = len(text.replace(' ', ''))
            return 'arabic' if arabic_chars > total_chars * 0.3 else 'english'
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
            return 'english'

    def _preprocess_text(self, text: str, language: str) -> str:
        if language == 'arabic':
            text = self.arabic_patterns['tashkeel'].sub('', text)
            text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
            text = text.replace('ى', 'ي').replace('ة', 'ه')
            text = re.sub(r'[^\u0600-\u06FF\s]', '', text)
        else:
            text = text.lower()
            text = text.translate(str.maketrans('', '', string.punctuation))
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _calculate_richness_metrics(self, text: str) -> Dict[str, float]:
        try:
            lex = LexicalRichness(text)
            ttr = lex.ttr
            mtld = lex.mtld(threshold=0.72)
            hdd = lex.hdd(draws=42)
            return {
                "type_token_ratio": float(ttr),
                "mtld": float(mtld) if mtld != float('inf') else 0.0,
                "hdd": float(hdd),
            }
        except Exception as e:
            logger.warning(f"LexicalRichness library error: {e}")
            words = text.split()
            unique_words = set(words)
            ttr = len(unique_words) / len(words) if len(words) > 0 else 0
            return {
                "type_token_ratio": float(ttr),
                "mtld": 0.0,
                "hdd": 0.0
            }

    def _calculate_vocabulary_statistics(self, text: str, language: str) -> Dict[str, Any]:
        words = text.split()
        unique_words = set(words)
        if language == 'arabic':
            content_words = [w for w in words if w not in self.arabic_stop_words]
        else:
            content_words = [w for w in words if w not in self.english_stop_words]
        unique_content_words = set(content_words)
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        hapax_legomena = sum(1 for freq in word_freq.values() if freq == 1)
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        return {
            "total_words": len(words),
            "unique_words": len(unique_words),
            "content_words": len(content_words),
            "unique_content_words": len(unique_content_words),
            "hapax_legomena": hapax_legomena,
            "average_word_length": float(avg_word_length),
            "most_frequent_words": sorted_words[:10],
            "vocabulary_size": len(unique_words),
            "content_word_ratio": len(content_words) / len(words) if words else 0
        }

    def _analyze_complexity(self, text: str) -> Dict[str, Any]:
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_words_per_sentence = len(words) / len(sentences) if sentences else 0
        complex_words = [word for word in words if len(word) > 6]
        complex_word_ratio = len(complex_words) / len(words) if words else 0
        return {
            "average_words_per_sentence": float(avg_words_per_sentence),
            "complex_word_ratio": float(complex_word_ratio),
            "total_sentences": len(sentences),
        }

    def _generate_assessment(self, richness_metrics: Dict, vocab_stats: Dict, complexity: Dict) -> Dict[str, Any]:
        ttr = richness_metrics.get("type_token_ratio", 0)
        vocab_size = vocab_stats.get("vocabulary_size", 0)
        complex_ratio = complexity.get("complex_word_ratio", 0)
        richness_score = 0
        if ttr > 0.7:
            richness_score += 4
        elif ttr > 0.5:
            richness_score += 3
        elif ttr > 0.3:
            richness_score += 2
        else:
            richness_score += 1
        if vocab_size > 100:
            richness_score += 3
        elif vocab_size > 50:
            richness_score += 2
        else:
            richness_score += 1
        if complex_ratio > 0.3:
            richness_score += 3
        elif complex_ratio > 0.2:
            richness_score += 2
        else:
            richness_score += 1
        if richness_score >= 8:
            richness_level = "excellent"
        elif richness_score >= 6:
            richness_level = "good"
        elif richness_score >= 4:
            richness_level = "fair"
        else:
            richness_level = "limited"
        return {
            "richness_score": float(richness_score),
            "richness_level": richness_level,
            "vocabulary_sophistication": "high" if complex_ratio > 0.25 else "medium" if complex_ratio > 0.15 else "basic",
            "language_variety": "diverse" if ttr > 0.6 else "moderate" if ttr > 0.4 else "repetitive"
        }

    def _generate_recommendations(self, richness_metrics: Dict, vocab_stats: Dict) -> List[str]:
        recommendations = []
        ttr = richness_metrics.get("type_token_ratio", 0)
        vocab_size = vocab_stats.get("vocabulary_size", 0)
        content_ratio = vocab_stats.get("content_word_ratio", 0)
        if ttr < 0.4:
            recommendations.append("Increase vocabulary variety - avoid repeating the same words.")
        if vocab_size < 50:
            recommendations.append("Expand your vocabulary - use more diverse terminology.")
        if content_ratio < 0.6:
            recommendations.append("Use more content words and fewer filler words.")
        hapax_ratio = vocab_stats.get("hapax_legomena", 0) / vocab_size if vocab_size > 0 else 0
        if hapax_ratio < 0.3:
            recommendations.append("Include more unique words to demonstrate vocabulary breadth.")
        if not recommendations:
            recommendations.append("Excellent vocabulary richness! Maintain your diverse language use.")
        return recommendations
