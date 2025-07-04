from lexicalrichness import LexicalRichness
import re
import nltk
import asyncio
import logging
from typing import Dict, List, Any
import string
import langdetect

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
        
        # Initialize English NLP tools
        try:
            from nltk.corpus import stopwords
            self.english_stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"Could not load English stopwords: {e}")
            self.english_stop_words = set()
        
        try:
            from nltk.stem import PorterStemmer
            self.english_stemmer = PorterStemmer()
        except Exception as e:
            logger.warning(f"Could not load English stemmer: {e}")
            self.english_stemmer = None
        
        # Initialize Arabic NLP tools
        try:
            # Arabic stopwords (common Arabic stopwords)
            self.arabic_stop_words = {
                'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي',
                'كان', 'كانت', 'يكون', 'تكون', 'أنا', 'أنت', 'هو', 'هي', 'نحن', 'أنتم',
                'هم', 'هن', 'و', 'أو', 'لكن', 'إذا', 'إن', 'أن', 'ما', 'ماذا', 'كيف',
                'أين', 'متى', 'لماذا', 'ال', 'لا', 'نعم', 'أيضا', 'فقط', 'حيث', 'عندما'
            }
        except Exception as e:
            logger.warning(f"Could not load Arabic stopwords: {e}")
            self.arabic_stop_words = set()
        
        # Arabic text processing patterns
        self.arabic_patterns = {
            'tashkeel': re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FE]'),  # Arabic diacritics
            'arabic_chars': re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]'),
            'arabic_words': re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+')
        }
    
    async def analyze(self, audio_path: str, language) -> Dict[str, Any]:
        """
        Analyze lexical richness from transcript
        Now uses centralized transcription service
        """
        print(f"📚 DEBUG: Starting Lexical Richness Analysis for {audio_path}")
        
        try:
            # Get transcript using centralized service
            if language == 'arabic' and self.transcription_service_arabic:
                transcript = await self.transcription_service_arabic.get_transcription(audio_path, language)
            elif self.transcription_service_english:
                transcript = await self.transcription_service_english.get_transcription(audio_path, language)
            else:
                transcript = None
            
            if not transcript or transcript.strip() == "":
                return {
                    "error": "No transcript available for lexical analysis",
                    "richness_metrics": {},
                    "vocabulary_statistics": {},
                    "overall_score": 5.0
                }
            
            # Detect language
            detected_language = self._detect_language(transcript)
            
            logger.info(f"Analyzing lexical richness for language: {detected_language}")
            
            # Clean and preprocess text
            cleaned_text = await self._preprocess_text(transcript, detected_language)
            
            # Calculate lexical richness metrics
            richness_metrics = await self._calculate_richness_metrics(cleaned_text, detected_language)
            
            # Calculate vocabulary statistics
            vocab_stats = await self._calculate_vocabulary_statistics(cleaned_text, detected_language)
            
            # Analyze complexity
            complexity_analysis = await self._analyze_complexity(cleaned_text, detected_language)
            
            # Generate assessment
            assessment = await self._generate_assessment(richness_metrics, vocab_stats, complexity_analysis, detected_language)
            
            # Extract overall score from assessment
            overall_score = assessment.get("richness_score", 5.0)
            
            return {
                "language": detected_language,
                "transcript_length": len(transcript.split()),
                "richness_metrics": richness_metrics,
                "vocabulary_statistics": vocab_stats,
                "complexity_analysis": complexity_analysis,
                "assessment": assessment,
                "overall_score": float(overall_score),
                "recommendations": await self._generate_recommendations(richness_metrics, vocab_stats, detected_language)
            }
            
        except Exception as e:
            logger.error(f"Error in lexical richness analysis: {e}")
            return {
                "error": str(e),
                "richness_metrics": {},
                "vocabulary_statistics": {},
                "overall_score": 5.0
            }
    
    async def _get_transcript(self, audio_path: str) -> str:
        """
        Get transcript using centralized transcription service
        """
        try:
            if self.transcription_service:
                # Use centralized transcription service
                transcription = await self.transcription_service.get_transcription(audio_path, language)
                
                if transcription:
                    logger.info(f"Transcription successful: {transcription[:100]}...")
                    return transcription
                else:
                    logger.warning("Transcription failed, using fallback")
            
            # Fallback to placeholder transcript
            return await self._get_fallback_transcript()
            
        except Exception as e:
            logger.error(f"Error getting transcript: {e}")
            return await self._get_fallback_transcript()
    
    async def _get_fallback_transcript(self) -> str:
        """Fallback transcript for testing"""
        if self.language == 'arabic':
            return """
            صباح الخير جميعاً، وشكراً لانضمامكم إلينا اليوم.
            أنا متحمس لتقديم أحدث النتائج البحثية حول الذكاء الاصطناعي
            وتطبيقاته في معالجة اللغة الطبيعية. فريقنا يعمل بجد
            لتطوير حلول مبتكرة يمكن أن تحول طريقة تفاعلنا مع التكنولوجيا.
            """
        else:
            return """
            Good morning everyone, and thank you for joining us today. 
            I'm excited to present our latest research findings on artificial intelligence 
            and its applications in natural language processing. Our team has been working 
            diligently to develop innovative solutions that can transform how we interact 
            with technology.
            """
    
    def _detect_language(self, text: str) -> str:
        """Detect language of the text"""
        try:
            # Check for Arabic characters
            arabic_chars = len(self.arabic_patterns['arabic_chars'].findall(text))
            total_chars = len(text.replace(' ', ''))
            
            if arabic_chars > total_chars * 0.3:  # If more than 30% are Arabic characters
                return 'arabic'
            else:
                return 'english'
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
            return 'english'  # Default to English
    
    async def _preprocess_text(self, text: str, language: str) -> str:
        """Clean and preprocess text for analysis"""
        try:
            if language == 'arabic':
                return await self._preprocess_arabic_text(text)
            else:
                return await self._preprocess_english_text(text)
        except Exception as e:
            logger.error(f"Error preprocessing text: {e}")
            return text
    
    async def _preprocess_english_text(self, text: str) -> str:
        """Preprocess English text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    async def _preprocess_arabic_text(self, text: str) -> str:
        """Preprocess Arabic text"""
        # Remove diacritics (tashkeel)
        text = self.arabic_patterns['tashkeel'].sub('', text)
        
        # Normalize Arabic characters
        text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
        text = text.replace('ى', 'ي').replace('ة', 'ه')
        
        # Remove punctuation
        text = re.sub(r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    async def _calculate_richness_metrics(self, text: str, language: str) -> Dict[str, float]:
        """Calculate various lexical richness metrics"""
        try:
            # Initialize LexicalRichness
            try:
                lex = LexicalRichness(text)
                
                # Calculate standard metrics
                ttr = lex.ttr  # Type-Token Ratio
                mtld = lex.mtld(threshold=0.72)  # Measure of Textual Lexical Diversity
                hdd = lex.hdd(draws=42)  # HD-D (hypergeometric distribution D)
                
                richness_metrics = {
                    "type_token_ratio": float(ttr),
                    "mtld": float(mtld) if mtld != float('inf') else 0.0,
                    "hdd": float(hdd),
                }
                
            except Exception as e:
                logger.warning(f"LexicalRichness library error: {e}")
                # Fallback calculation
                richness_metrics = await self._calculate_basic_richness(text, language)
            
            return richness_metrics
            
        except Exception as e:
            logger.error(f"Error calculating richness metrics: {e}")
            return {}
    
    async def _calculate_basic_richness(self, text: str, language: str) -> Dict[str, float]:
        """Basic richness calculation as fallback"""
        try:
            words = text.split()
            unique_words = set(words)
            
            # Basic Type-Token Ratio
            ttr = len(unique_words) / len(words) if len(words) > 0 else 0
            
            # Root TTR (more stable for longer texts)
            root_ttr = len(unique_words) / (len(words) ** 0.5) if len(words) > 0 else 0
            
            # Corrected TTR (Corrected Type-Token Ratio)
            cttr = len(unique_words) / (2 * len(words)) ** 0.5 if len(words) > 0 else 0
            
            return {
                "type_token_ratio": float(ttr),
                "root_ttr": float(root_ttr),
                "corrected_ttr": float(cttr),
                "mtld": 0.0,  # Not available in basic calculation
                "hdd": 0.0    # Not available in basic calculation
            }
            
        except Exception as e:
            logger.error(f"Error in basic richness calculation: {e}")
            return {"type_token_ratio": 0.0}
    
    async def _calculate_vocabulary_statistics(self, text: str, language: str) -> Dict[str, Any]:
        """Calculate vocabulary statistics"""
        try:
            words = text.split()
            unique_words = set(words)
            
            # Remove stopwords for content words analysis
            if language == 'arabic':
                content_words = [word for word in words if word not in self.arabic_stop_words]
            else:
                content_words = [word for word in words if word not in self.english_stop_words]
            unique_content_words = set(content_words)
            
            # Calculate word frequency distribution
            word_freq = {}
            for word in words:
                word_freq[word] = word_freq.get(word, 0) + 1
            
            # Sort by frequency
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            
            # Calculate hapax legomena (words appearing only once)
            hapax_legomena = sum(1 for freq in word_freq.values() if freq == 1)
            
            # Calculate average word length
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
            
        except Exception as e:
            logger.error(f"Error calculating vocabulary statistics: {e}")
            return {}
    
    async def _analyze_complexity(self, text: str, language: str) -> Dict[str, Any]:
        """Analyze language complexity"""
        try:
            words = text.split()
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            # Calculate averages
            avg_words_per_sentence = len(words) / len(sentences) if sentences else 0
            
            # Identify complex words (more than 6 characters or with multiple syllables)
            complex_words = [word for word in words if len(word) > 6]
            complex_word_ratio = len(complex_words) / len(words) if words else 0
            
            # Calculate syllable count (rough approximation)
            total_syllables = sum(self._count_syllables(word) for word in words)
            avg_syllables_per_word = total_syllables / len(words) if words else 0
            
            return {
                "average_words_per_sentence": float(avg_words_per_sentence),
                "complex_word_ratio": float(complex_word_ratio),
                "average_syllables_per_word": float(avg_syllables_per_word),
                "total_sentences": len(sentences),
                "sentence_variety": "high" if len(set(len(s.split()) for s in sentences)) > 3 else "medium"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing complexity: {e}")
            return {}
    
    def _count_syllables(self, word: str) -> int:
        """Rough syllable counting"""
        try:
            word = word.lower()
            vowels = "aeiouy"
            syllable_count = 0
            previous_was_vowel = False
            
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not previous_was_vowel:
                    syllable_count += 1
                previous_was_vowel = is_vowel
            
            # Handle silent 'e'
            if word.endswith('e') and syllable_count > 1:
                syllable_count -= 1
            
            return max(1, syllable_count)  # At least one syllable
            
        except Exception:
            return 1
    
    async def _generate_assessment(self, richness_metrics: Dict, vocab_stats: Dict, complexity: Dict, language: str) -> Dict[str, Any]:
        """Generate overall lexical assessment"""
        try:
            ttr = richness_metrics.get("type_token_ratio", 0)
            vocab_size = vocab_stats.get("vocabulary_size", 0)
            complex_ratio = complexity.get("complex_word_ratio", 0)
            
            # Calculate overall richness score (0-10)
            richness_score = 0
            
            # TTR contribution (0-4 points)
            if ttr > 0.7:
                richness_score += 4
            elif ttr > 0.5:
                richness_score += 3
            elif ttr > 0.3:
                richness_score += 2
            else:
                richness_score += 1
            
            # Vocabulary size contribution (0-3 points)
            if vocab_size > 100:
                richness_score += 3
            elif vocab_size > 50:
                richness_score += 2
            else:
                richness_score += 1
            
            # Complexity contribution (0-3 points)
            if complex_ratio > 0.3:
                richness_score += 3
            elif complex_ratio > 0.2:
                richness_score += 2
            else:
                richness_score += 1
            
            # Classify richness level
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
            
        except Exception as e:
            logger.error(f"Error generating assessment: {e}")
            return {
                "richness_score": 5.0,
                "richness_level": "unknown"
            }
    
    async def _generate_recommendations(self, richness_metrics: Dict, vocab_stats: Dict, language: str) -> List[str]:
        """Generate recommendations for improving lexical richness"""
        recommendations = []
        
        try:
            ttr = richness_metrics.get("type_token_ratio", 0)
            vocab_size = vocab_stats.get("vocabulary_size", 0)
            content_ratio = vocab_stats.get("content_word_ratio", 0)
            
            if ttr < 0.4:
                recommendations.append("Increase vocabulary variety - avoid repeating the same words")
                recommendations.append("Use synonyms and alternative expressions")
            
            if vocab_size < 50:
                recommendations.append("Expand your vocabulary - use more diverse terminology")
            
            if content_ratio < 0.6:
                recommendations.append("Use more content words and fewer filler words")
            
            hapax_ratio = vocab_stats.get("hapax_legomena", 0) / vocab_size if vocab_size > 0 else 0
            if hapax_ratio < 0.3:
                recommendations.append("Include more unique words to demonstrate vocabulary breadth")
            
            if not recommendations:
                recommendations.append("Excellent vocabulary richness! Maintain your diverse language use")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate vocabulary recommendations"]
