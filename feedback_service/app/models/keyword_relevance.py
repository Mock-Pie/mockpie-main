import re
import logging
from typing import Dict, List, Any
import numpy as np
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class KeywordRelevanceAnalyzer:
    """
    Keyword Relevance and Topic Coherence Analysis
    Uses KeyBERT and semantic similarity for keyword analysis
    Supports both English and Arabic
    """
    
    def __init__(self, transcription_service_english=None, transcription_service_arabic=None):
        self.transcription_service_english = transcription_service_english
        self.transcription_service_arabic = transcription_service_arabic
        
        # Initialize English models
        try:
            self.english_keybert = KeyBERT()
            logger.info("English KeyBERT model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load English KeyBERT: {e}")
            self.english_keybert = None
        
        try:
            self.english_sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("English sentence transformer loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load English sentence transformer: {e}")
            self.english_sentence_model = None
        
        # Initialize Arabic models
        try:
            self.arabic_sentence_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
            logger.info("Arabic sentence transformer loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load Arabic sentence transformer: {e}")
            self.arabic_sentence_model = None
        
        # Arabic text processing patterns
        self.arabic_patterns = {
            'tashkeel': re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FE]'),  # Arabic diacritics
            'arabic_chars': re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]'),
            'arabic_words': re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+')
        }
        
        # Arabic stopwords
        self.arabic_stop_words = {
            'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي',
            'كان', 'كانت', 'يكون', 'تكون', 'أنا', 'أنت', 'هو', 'هي', 'نحن', 'أنتم',
            'هم', 'هن', 'و', 'أو', 'لكن', 'إذا', 'إن', 'أن', 'ما', 'ماذا', 'كيف',
            'ماشي', 'تمام',
            'آآ','أين', 'متى', 'لماذا', 'ال', 'لا', 'نعم', 'أيضا', 'فقط', 'حيث', 'عندما'
        }

    def analyze(self, audio_path: str, language: str, target_keywords: str = "", transcript: str = None) -> Dict[str, Any]:
        logger.info(f"Starting Keyword Relevance Analysis for {audio_path} with language: {language}")
        try:
            if not isinstance(transcript, str) or not transcript.strip():
                return {
                    "error": "No transcript available for keyword analysis",
                    "extracted_keywords": [],
                    "relevance_analysis": {},
                    "overall_score": 5.0  # Default score when no transcript
                }

            detected_language = self._detect_language(transcript)
            logger.info(f"Analyzing keyword relevance for language: {detected_language}")

            extracted_keywords = self._extract_keywords(transcript, detected_language)
            coherence_analysis = self._analyze_topic_coherence(transcript, extracted_keywords, detected_language)

            target_analysis = {}
            if isinstance(target_keywords, str) and target_keywords.strip():
                target_analysis = self._analyze_target_keywords(transcript, extracted_keywords, target_keywords, detected_language)

            diversity_metrics = self._calculate_keyword_diversity(extracted_keywords)

            assessment = self._generate_relevance_assessment(coherence_analysis, target_analysis, diversity_metrics, detected_language)

            return {
                "language": detected_language,
                "transcript_length": len(transcript.split()),
                "extracted_keywords": extracted_keywords,
                "topic_coherence": coherence_analysis,
                "target_keyword_analysis": target_analysis,
                "keyword_diversity": diversity_metrics,
                "relevance_assessment": assessment,
                "recommendations": self._generate_recommendations(coherence_analysis, target_analysis, assessment, detected_language),
                "overall_score": assessment.get("overall_score", 5.0),  # Main score for the scoring system
                "relevance_score": assessment.get("overall_score", 5.0)  # Keep for backward compatibility
            }
        except Exception as e:
            logger.error(f"Error in keyword relevance analysis: {e}")
            return {
                "error": str(e),
                "extracted_keywords": [],
                "relevance_analysis": {},
                "overall_score": 5.0  # Default score on error
            }

    def _detect_language(self, text: str) -> str:
        try:
            arabic_chars = len(self.arabic_patterns['arabic_chars'].findall(text))
            total_chars = len(text.replace(' ', ''))
            if arabic_chars > total_chars * 0.3:
                return 'arabic'
            else:
                return 'english'
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
            return 'english'

    def _extract_keywords(self, text: str, language: str) -> Dict[str, List]:
        keywords = {"keybert": [], "combined": []}
        try:
            if language == 'english' and self.english_keybert:
                keybert_keywords = []
                try:
                    keybert_keywords = self.english_keybert.extract_keywords(
                        text, keyphrase_ngram_range=(1, 3), stop_words='english', top_n=15)
                except TypeError:
                    keybert_keywords = self.english_keybert.extract_keywords(
                        text, keyphrase_ngram_range=(1, 3), stop_words='english', top_k=15)
                if keybert_keywords:
                    keywords["keybert"] = [
                        {"keyword": str(kw[0]), "score": float(kw[1])} if isinstance(kw, (list, tuple)) and len(kw) >= 2
                        else {"keyword": str(kw), "score": 1.0}
                        for kw in keybert_keywords
                    ]
            all_keywords = {}
            for kw_data in keywords["keybert"]:
                if isinstance(kw_data, dict) and "keyword" in kw_data:
                    kw = kw_data["keyword"].lower().strip()
                    score = kw_data.get("score", 1.0)
                    if kw and len(kw) > 1:
                        if kw in all_keywords:
                            all_keywords[kw] = max(all_keywords[kw], score)
                        else:
                            all_keywords[kw] = score
            sorted_keywords = sorted(all_keywords.items(), key=lambda x: x[1], reverse=True)
            keywords["combined"] = [{"keyword": kw, "score": score} for kw, score in sorted_keywords[:15]]
            return keywords
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return {"keybert": [], "combined": []}

    def _analyze_topic_coherence(self, text: str, keywords: Dict, language: str) -> Dict[str, Any]:
        try:
            combined_keywords = keywords.get("combined", [])
            if not combined_keywords:
                return {"coherence_score": 0.0, "topic_focus": "unclear"}
            top_keywords = [kw["keyword"] for kw in combined_keywords[:10]]
            text_lower = text.lower()
            keyword_coverage = 0
            keyword_mentions = {}
            for kw in top_keywords:
                mentions = len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower))
                keyword_mentions[kw] = mentions
                if mentions > 0:
                    keyword_coverage += 1
            coverage_percentage = (keyword_coverage / len(top_keywords)) * 100 if top_keywords else 0
            semantic_coherence = 0.5
            if language == 'english' and self.english_sentence_model:
                try:
                    text_embedding = self.english_sentence_model.encode([text])
                    keyword_text = " ".join(top_keywords)
                    keyword_embedding = self.english_sentence_model.encode([keyword_text])
                    similarity = np.dot(text_embedding[0], keyword_embedding[0]) / (
                        np.linalg.norm(text_embedding[0]) * np.linalg.norm(keyword_embedding[0])
                    )
                    semantic_coherence = float(similarity)
                except Exception as e:
                    logger.warning(f"Semantic coherence calculation failed: {e}")
            coherence_score = (coverage_percentage / 100 * 0.4 + semantic_coherence * 0.6)
            if coherence_score > 0.5:
                topic_focus = "highly_focused"
            elif coherence_score > 0.3:
                topic_focus = "focused"
            elif coherence_score > 0.15:
                topic_focus = "somewhat_focused"
            else:
                topic_focus = "unfocused"
            return {
                "coherence_score": float(coherence_score),
                "topic_focus": topic_focus,
                "keyword_coverage_percentage": float(coverage_percentage),
                "semantic_coherence": float(semantic_coherence),
                "keyword_mentions": keyword_mentions,
                "top_keywords": top_keywords
            }
        except Exception as e:
            logger.error(f"Error analyzing topic coherence: {e}")
            return {"coherence_score": 0.0, "topic_focus": "unknown"}

    def _analyze_target_keywords(self, text: str, extracted_keywords: Dict, target_keywords: str, language: str) -> Dict[str, Any]:
        try:
            target_list = [kw.strip().lower() for kw in target_keywords.split(',') if kw.strip()]
            if not target_list:
                return {"target_coverage": 0.0, "matching_keywords": []}
            extracted_list = [kw["keyword"].lower() for kw in extracted_keywords.get("combined", [])]
            exact_matches = set(target_list) & set(extracted_list)
            partial_matches = set()
            for target in target_list:
                for extracted in extracted_list:
                    if target in extracted or extracted in target:
                        partial_matches.add((target, extracted))
            semantic_matches = []
            if language == 'english' and self.english_sentence_model and target_list and extracted_list:
                try:
                    target_embeddings = self.english_sentence_model.encode(target_list)
                    extracted_embeddings = self.english_sentence_model.encode(extracted_list[:10])
                    for i, target in enumerate(target_list):
                        similarities = np.dot(target_embeddings[i], extracted_embeddings.T)
                        best_match_idx = np.argmax(similarities)
                        best_similarity = similarities[best_match_idx]
                        if best_similarity > 0.3:
                            semantic_matches.append({
                                "target": target,
                                "matched": extracted_list[best_match_idx],
                                "similarity": float(best_similarity)
                            })
                except Exception as e:
                    logger.warning(f"Semantic matching failed: {e}")
            exact_coverage = len(exact_matches) / len(target_list) * 100
            total_matches = len(exact_matches) + len(partial_matches) + len(semantic_matches)
            total_coverage = min(100, total_matches / len(target_list) * 100)
            relevance_score = (exact_coverage * 0.6 +
                               (len(partial_matches) / len(target_list) * 100) * 0.3 +
                               (len(semantic_matches) / len(target_list) * 100) * 0.1)
            relevance_score = min(100, relevance_score)
            return {
                "target_keywords": target_list,
                "exact_matches": list(exact_matches),
                "partial_matches": list(partial_matches),
                "semantic_matches": semantic_matches,
                "exact_coverage_percentage": float(exact_coverage),
                "total_coverage_percentage": float(total_coverage),
                "relevance_score": float(relevance_score),
                "alignment": "excellent" if relevance_score > 60 else
                             "good" if relevance_score > 40 else
                             "fair" if relevance_score > 20 else "poor"
            }
        except Exception as e:
            logger.error(f"Error analyzing target keywords: {e}")
            return {"target_coverage": 0.0, "matching_keywords": []}

    def _calculate_keyword_diversity(self, keywords: Dict) -> Dict[str, Any]:
        try:
            combined_keywords = keywords.get("combined", [])
            if not combined_keywords:
                return {"diversity_score": 0.0, "keyword_distribution": "none"}
            scores = [kw["score"] for kw in combined_keywords]
            if len(scores) < 2:
                return {"diversity_score": 0.0, "keyword_distribution": "insufficient"}
            score_variance = np.var(scores)
            score_range = max(scores) - min(scores)
            diversity_score = min(1.0, score_variance * 10)
            keyword_lengths = [len(kw["keyword"].split()) for kw in combined_keywords]
            avg_keyword_length = np.mean(keyword_lengths)
            if diversity_score > 0.5:
                distribution = "highly_diverse"
            elif diversity_score > 0.25:
                distribution = "moderately_diverse"
            elif diversity_score > 0.1:
                distribution = "somewhat_diverse"
            else:
                distribution = "low_diversity"
            return {
                "diversity_score": float(diversity_score),
                "keyword_distribution": distribution,
                "score_variance": float(score_variance),
                "score_range": float(score_range),
                "average_keyword_length": float(avg_keyword_length),
                "total_unique_keywords": len(combined_keywords)
            }
        except Exception as e:
            logger.error(f"Error calculating keyword diversity: {e}")
            return {"diversity_score": 0.0, "keyword_distribution": "unknown"}

    def _generate_relevance_assessment(self, coherence: Dict, target_analysis: Dict, diversity: Dict, language: str) -> Dict[str, Any]:
        try:
            # Extract the three key scores
            semantic_coherence = coherence.get("semantic_coherence", 0.5)  # 0-1 range
            coherence_score = coherence.get("coherence_score", 0)  # 0-1 range
            diversity_score = diversity.get("diversity_score", 0)  # 0-1 range
            
            # Calculate overall score using balanced mix of all three scores
            # Weights: semantic_coherence (40%), coherence_score (35%), diversity_score (25%)
            overall_score = (
                semantic_coherence * 0.40 +  # Semantic similarity between text and keywords
                coherence_score * 0.35 +     # Topic focus and keyword coverage
                diversity_score * 0.25       # Keyword variety and distribution
            )
            
            # Scale to 0-10 range
            overall_score = overall_score * 10
            overall_score = min(10, max(0, overall_score))
            
            # Assessment level based on overall score
            if overall_score >= 8:
                assessment_level = "excellent"
            elif overall_score >= 6:
                assessment_level = "good"
            elif overall_score >= 4:
                assessment_level = "fair"
            else:
                assessment_level = "needs_improvement"
            
            topic_focus = coherence.get("topic_focus", "unknown")
            
            return {
                "overall_score": float(overall_score),  # Main score for the scoring system
                "overall_relevance_score": float(overall_score),  # Keep for backward compatibility
                "assessment_level": assessment_level,
                "topic_focus_quality": topic_focus,
                "content_alignment": target_analysis.get("alignment", "not_specified") if target_analysis else "no_target",
                "keyword_quality": "high" if diversity_score > 0.4 else "medium" if diversity_score > 0.2 else "low",
                "score_breakdown": {
                    "semantic_coherence": float(semantic_coherence * 10),  # 0-10 range
                    "coherence_score": float(coherence_score * 10),        # 0-10 range  
                    "diversity_score": float(diversity_score * 10),        # 0-10 range
                    "weights": {
                        "semantic_coherence": 0.40,
                        "coherence_score": 0.35,
                        "diversity_score": 0.25
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error generating relevance assessment: {e}")
            return {
                "overall_score": 5.0,
                "overall_relevance_score": 5.0,
                "assessment_level": "unknown",
                "score_breakdown": {
                    "semantic_coherence": 5.0,
                    "coherence_score": 5.0,
                    "diversity_score": 5.0,
                    "weights": {
                        "semantic_coherence": 0.40,
                        "coherence_score": 0.35,
                        "diversity_score": 0.25
                    }
                }
            }

    def _generate_recommendations(self, coherence: Dict, target_analysis: Dict, assessment: Dict, language: str) -> List[str]:
        recommendations = []
        try:
            coherence_score = coherence.get("coherence_score", 0)
            assessment_level = assessment.get("assessment_level", "unknown")
            if coherence_score < 0.3:
                recommendations.append("Improve topic focus - stay on subject and avoid tangents")
                recommendations.append("Use more consistent terminology throughout your presentation")
            if target_analysis:
                relevance_score = target_analysis.get("relevance_score", 0)
                if relevance_score < 40:
                    recommendations.append("Better address the specified topic keywords")
                    recommendations.append("Include more relevant terminology for your subject area")
            topic_focus = coherence.get("topic_focus", "unknown")
            if topic_focus in ["unfocused", "somewhat_focused"]:
                recommendations.append("Strengthen your central theme and key message")
            if assessment_level in ["fair", "needs_improvement"]:
                recommendations.append("Use more specific and technical vocabulary related to your topic")
            if not recommendations:
                recommendations.append("Excellent keyword relevance! Your content is well-focused and on-topic")
            return recommendations
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Unable to generate keyword relevance recommendations"]
