# Presentation Analysis AI System

A comprehensive FastAPI-based application that analyzes presentations using multiple open-source AI models. This system provides detailed feedback on speech emotion, pitch analysis, facial expressions, eye contact, hand gestures, filler word detection, lexical richness, keyword relevance, volume consistency, speaking pace (WPM), and generates composite engagement/confidence scores.

## Features

### 🎯 Core Analysis Features
- **Speech Emotion Recognition**: Wav2Vec2-based emotion detection from audio
- **Pitch & Intonation Analysis**: Prosodic feature analysis using Praat/Parselmouth  
- **Facial Emotion Detection**: Real-time facial expression analysis using MediaPipe
- **Eye Contact Analysis**: Gaze tracking and attention measurement
- **Hand Gesture Recognition**: Professional gesture detection and analysis
- **Filler Word Detection**: Identification of "um", "uh", excessive pauses
- **Lexical Richness**: Vocabulary diversity and linguistic complexity
- **Keyword Relevance**: Topic coherence and content quality analysis
- **Volume Consistency**: Audio level stability and loudness analysis
- **Speaking Pace (WPM)**: Words-per-minute calculation and pacing analysis
- **Composite Scoring**: Weighted engagement and confidence scores

### 🚀 Technical Features
- **FastAPI Backend**: High-performance async API with automatic documentation
- **Modern Web Interface**: Clean, responsive HTML interface for file uploads
- **Docker Support**: Containerized deployment with hot reload for development
- **Modular Architecture**: Extensible design for adding new analysis models
- **Offline Capability**: All models run locally without external API dependencies
- **Multi-format Support**: Audio (.wav, .mp3, .m4a) and video (.mp4, .avi, .mov)
- **Real-time Processing**: Efficient async processing with progress feedback
- **Comprehensive Reporting**: Detailed JSON results with actionable recommendations

## Quick Start

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Python 3.11+ and Git (for local development)
- 4GB+ RAM (recommended for AI models)

### 🐳 Docker Setup (Recommended)

#### Development Mode (with Hot Reload)
```bash
# Clone the repository
git clone <repository-url>
cd AI

# Start development environment with hot reload
# Windows:
start-dev.bat
# Linux/macOS:
./start-dev.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

#### Production Mode
```bash
# Start production environment
# Windows:
start-prod.bat
# Linux/macOS:
docker-compose up --build
```

The application will be available at: **http://localhost:8000**

#### Docker Commands
```bash
# Stop containers
docker-compose down

# Rebuild containers (after code changes in production)
docker-compose up --build

# View logs
docker-compose logs -f

# Access container shell for debugging
docker-compose exec presentation-analyzer bash
```

### 🐍 Local Python Setup (Alternative)

#### Option 1: Automated Setup

**Windows (PowerShell):**
```powershell
# Clone the repository
git clone <repository-url>
cd AI

# Run setup script
.\setup.ps1
```

**Linux/macOS (Bash):**
```bash
# Clone the repository
git clone <repository-url>
cd AI

# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

#### Option 2: Manual Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir temp
mkdir static/uploads
```

### Running the Application (Local)

```bash
# Activate virtual environment (if not already active)
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Start the application
python main.py
```

## Development

### Hot Reload
The Docker development setup automatically enables hot reload. Any changes to your Python code will immediately restart the server without rebuilding the container.

### File Structure
```
AI/
├── app/
│   ├── models/           # AI model implementations
│   └── utils/           # Utility functions
├── templates/           # HTML templates
├── static/             # Static files (CSS, JS)
├── temp/              # Temporary file storage
├── docker-compose.yml          # Production Docker setup
├── docker-compose.dev.yml      # Development Docker setup
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev             # Development Docker image
├── requirements.txt           # Python dependencies
├── start-dev.bat/sh          # Development startup scripts
└── start-prod.bat            # Production startup script
```

## API Documentation

Once running, visit these URLs for detailed API documentation:
- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)

### Main Endpoints

#### `POST /analyze/full`
Complete presentation analysis including all features.

**Parameters:**
- `file`: Audio or video file (multipart/form-data)
- `analysis_options`: JSON object with feature toggles (optional)

**Example Request:**
```bash
curl -X POST "http://localhost:8000/analyze/full" \
  -F "file=@presentation.mp4" \
  -F "analysis_options={\"include_facial_analysis\": true, \"include_pitch_analysis\": true}"
```

#### `POST /analyze/partial`
Selective analysis with specific features.

**Parameters:**
- `file`: Audio or video file
- `features`: List of features to analyze

**Available Features:**
- `speech_emotion`
- `pitch_analysis`
- `facial_emotion`
- `eye_contact`
- `hand_gesture`
- `filler_detection`
- `lexical_richness`
- `keyword_relevance`
- `volume_consistency`
- `wpm_calculation`

#### `GET /`
Web interface for file upload and result visualization.

## Project Structure

```
AI/
├── app/
│   ├── models/           # AI analysis models
│   │   ├── speech_emotion.py      # Speech emotion recognition
│   │   ├── pitch_analysis.py      # Pitch and intonation analysis
│   │   ├── facial_emotion.py      # Facial expression detection
│   │   ├── eye_contact.py         # Eye gaze tracking
│   │   ├── hand_gesture.py        # Hand gesture recognition
│   │   ├── filler_detection.py    # Filler words and pauses
│   │   ├── lexical_richness.py    # Vocabulary analysis
│   │   ├── keyword_relevance.py   # Content relevance scoring
│   │   ├── volume_consistency.py  # Audio volume analysis
│   │   └── wpm_calculator.py      # Speaking pace calculation
│   └── utils/            # Utility modules
│       ├── file_processor.py      # File handling and conversion
│       └── composite_scorer.py    # Overall scoring system
├── templates/
│   └── index.html        # Web interface
├── static/               # Static assets
├── temp/                 # Temporary file storage
├── main.py               # FastAPI application entry point
├── requirements.txt      # Python dependencies
├── setup.sh              # Linux/macOS setup script
├── setup.ps1             # Windows setup script
└── README.md             # Documentation
```

## Analysis Output Format

The API returns comprehensive analysis results in JSON format:

```json
{
  "status": "success",
  "file_info": {
    "filename": "presentation.mp4",
    "duration": 120.5,
    "format": "video"
  },
  "analysis_results": {
    "speech_emotion": {
      "dominant_emotion": "confident",
      "emotion_distribution": {"confident": 0.7, "neutral": 0.2, "nervous": 0.1},
      "emotional_stability": 0.85
    },
    "pitch_analysis": {
      "average_f0": 145.2,
      "pitch_range": 80.5,
      "intonation_patterns": {...}
    },
    "facial_emotion": {
      "dominant_expression": "engaged",
      "expression_timeline": [...],
      "engagement_score": 0.82
    },
    "composite_scores": {
      "overall_engagement": 8.2,
      "confidence_level": 7.8,
      "professionalism": 8.5
    },
    "recommendations": [
      "Maintain consistent eye contact with the camera",
      "Consider varying your speaking pace for emphasis",
      "Excellent use of hand gestures - continue this"
    ]
  },
  "processing_time": 45.2
}
```

## Model Details

### Speech Emotion Recognition
- **Model**: Wav2Vec2-based transformer
- **Emotions**: Confident, Nervous, Excited, Calm, Frustrated, Neutral
- **Features**: Temporal emotion tracking, stability analysis

### Pitch Analysis  
- **Engine**: Parselmouth (Python Praat interface)
- **Metrics**: F0 contours, pitch range, intonation patterns
- **Features**: Prosodic variation, speaking rhythm analysis

### Facial Emotion Detection
- **Framework**: MediaPipe + Transformer models
- **Expressions**: Happy, Surprised, Focused, Neutral, Concerned
- **Features**: Real-time face tracking, expression timeline

### Eye Contact Analysis
- **Technology**: MediaPipe Face Mesh + GazeTracking
- **Metrics**: Gaze direction, attention consistency, camera engagement
- **Features**: Eye movement patterns, distraction detection

### Hand Gesture Recognition
- **Framework**: MediaPipe Hands
- **Gestures**: Professional presentation gestures
- **Features**: Gesture frequency, appropriateness scoring

### Filler Detection
- **Engine**: Whisper ASR + pattern matching
- **Detection**: "Um", "uh", "like", excessive pauses
- **Features**: Frequency analysis, fluency scoring

### Lexical Analysis
- **Tools**: NLTK, LexicalRichness, spaCy
- **Metrics**: TTR, vocabulary diversity, readability
- **Features**: Content sophistication, clarity assessment

### Volume Consistency
- **Library**: librosa, pyloudnorm  
- **Metrics**: Loudness levels, dynamic range, consistency
- **Features**: Audio quality assessment, volume recommendations

### Speaking Pace (WPM)
- **Engine**: Whisper with word-level timestamps
- **Metrics**: Words per minute, pacing variation, pause patterns
- **Features**: Temporal analysis, rhythm assessment

## Configuration

### Analysis Options
Customize analysis behavior by modifying the analysis options:

```json
{
  "include_facial_analysis": true,
  "include_pitch_analysis": true,
  "face_detection_confidence": 0.5,
  "emotion_sensitivity": 0.7,
  "enable_detailed_logging": false
}
```

### Model Configuration
Models are automatically downloaded on first use. To pre-download:

```python
# In Python shell
from app.models.speech_emotion import SpeechEmotionAnalyzer
analyzer = SpeechEmotionAnalyzer()  # Downloads model
```

## Performance & Hardware

### Minimum Requirements
- **CPU**: 4-core processor
- **RAM**: 4GB available memory
- **Storage**: 2GB free space (for models)
- **GPU**: Optional (CUDA-compatible for acceleration)

### Processing Times (approximate)
- **Audio only (5 min)**: 30-60 seconds
- **Video analysis (5 min)**: 2-4 minutes
- **Full analysis (5 min)**: 3-6 minutes

### GPU Acceleration
Install PyTorch with CUDA support for faster processing:

```bash
# CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Troubleshooting

### Common Issues

#### "ModuleNotFoundError" for audio/video libraries
```bash
# Linux: Install system dependencies
sudo apt-get update
sudo apt-get install ffmpeg portaudio19-dev

# macOS: Install with Homebrew
brew install ffmpeg portaudio

# Windows: FFmpeg should be automatically handled by pip
```

#### "Model download failed"
- Ensure stable internet connection
- Check available disk space (models require 1-2GB)
- Try running with administrator/sudo privileges

#### High memory usage
- Reduce batch sizes in model configuration
- Process shorter audio/video segments
- Close other applications during analysis

#### Slow processing
- Install GPU-accelerated PyTorch (see Performance section)
- Use smaller/faster model variants in configuration
- Reduce analysis window sizes

### Error Codes
- **400**: Invalid file format or corrupted upload
- **413**: File too large (increase FastAPI limits if needed)
- **500**: Internal processing error (check logs)

### Logging
Enable detailed logging for debugging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Contributing

We welcome contributions! Areas for improvement:
- Additional emotion models
- More gesture recognition patterns
- Enhanced web interface
- Mobile app integration
- Real-time streaming analysis

### Development Setup
```bash
# Install development dependencies
pip install -r requirements.txt
pip install pytest black flake8

# Run tests
pytest

# Format code
black .
```

## License

This project is open source. See individual model licenses for specific terms.

## Acknowledgments

- **Hugging Face**: Transformer models and pipelines
- **MediaPipe**: Computer vision frameworks
- **Whisper**: Speech recognition technology
- **Praat/Parselmouth**: Acoustic analysis tools
- **FastAPI**: Modern web framework

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at /docs
3. Create an issue with detailed error logs
4. Include system information and sample files (if possible)

---

**Version**: 1.0.0  
**Last Updated**: December 2024-Playground" 




# AI Services Documentation

This document provides comprehensive information about all AI services in the AI Presentation Analyzer, including their metrics calculation methods and the AI models they use.

## Table of Contents

1. [Speech Analysis Services](#speech-analysis-services)
2. [Visual Analysis Services](#visual-analysis-services)
3. [Content Analysis Services](#content-analysis-services)
4. [Composite Scoring System](#composite-scoring-system)

---

## Speech Analysis Services

### 1. Speech Emotion Recognition (`speech_emotion.py`)

**AI Models Used:**
- **Primary Model**: `superb/wav2vec2-base-superb-er` (HuggingFace)
- **Fallback Model**: `facebook/wav2vec2-large-xlsr-53` (HuggingFace)
- **Fallback Method**: Acoustic feature analysis (librosa)

**Metrics Calculation:**

#### Emotional Variance
```python
emotional_variance = np.var(list(emotions.values()))
```
- **Description**: Measures the spread of emotional probabilities
- **Range**: 0.0 - 1.0
- **Interpretation**: Higher variance indicates more emotional expression

#### Emotional Intensity
```python
emotional_intensity = max(emotions.values())
```
- **Description**: Maximum probability among all emotions
- **Range**: 0.0 - 1.0
- **Interpretation**: Higher intensity indicates stronger emotional expression

#### Neutrality Score
```python
neutrality_score = emotions.get('neutral', 0.0)
```
- **Description**: Probability of neutral emotion
- **Range**: 0.0 - 1.0
- **Interpretation**: Higher score indicates more neutral delivery

**Output Metrics:**
- `dominant_emotion`: Emotion with highest probability
- `confidence`: Confidence in dominant emotion classification
- `emotional_variance`: Spread of emotional probabilities
- `emotional_intensity`: Strength of emotional expression
- `neutrality_score`: Neutral emotion probability

---

### 2. Pitch Analysis (`pitch_analysis.py`)

**AI Models Used:**
- **Primary Tool**: Parselmouth (Praat wrapper)
- **Fallback**: Librosa pitch extraction

**Metrics Calculation:**

#### Pitch Statistics
```python
mean_pitch = np.mean(pitch_values)
median_pitch = np.median(pitch_values)
std_pitch = np.std(pitch_values)
pitch_range = max_pitch - min_pitch
voiced_percentage = (voiced_frames / total_frames) * 100
```

#### Intonation Analysis
```python
# Pitch contour classification
if abs(slope) < 0.1:
    contour_type = "flat"
elif slope > 0.1:
    contour_type = "rising"
else:
    contour_type = "falling"

# Pitch movements
rises = np.sum(diff > 2)  # Significant rises
falls = np.sum(diff < -2)  # Significant falls
```

#### Variation Metrics
```python
coefficient_of_variation = std_pitch / mean_pitch
pitch_stability = 1 - (coefficient_of_variation / 2)
```

**Output Metrics:**
- `mean_pitch`: Average fundamental frequency (Hz)
- `pitch_range`: Range of pitch variation (Hz)
- `voiced_frames_percentage`: Percentage of voiced speech
- `intonation_variability`: Standard deviation of pitch changes
- `speaking_style`: Classification (monotone, dynamic, etc.)

---

### 3. Volume Consistency (`volume_consistency.py`)

**AI Models Used:**
- **Primary Tool**: Pyloudnorm (ITU-R BS.1770 loudness)
- **Fallback**: Librosa RMS energy analysis

**Metrics Calculation:**

#### RMS Energy Analysis
```python
rms = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)
rms_db = librosa.amplitude_to_db(rms, ref=np.max)
dynamic_range = max_rms - min_rms
```

#### LUFS Loudness Analysis
```python
meter = pyln.Meter(sample_rate)
loudness = meter.integrated_loudness(audio)
loudness_range = max_loudness - min_loudness
```

#### Consistency Score
```python
consistency_score = 1 - (std_loudness / abs(mean_loudness))
overall_consistency_score = (rms_consistency + loudness_consistency) / 2
```

**Output Metrics:**
- `mean_rms_db`: Average RMS energy in dB
- `dynamic_range_db`: Range of volume variation
- `integrated_loudness_lufs`: Overall loudness (LUFS)
- `consistency_score`: Volume consistency (0-10)
- `volume_quality_score`: Overall volume quality assessment

---

### 4. Filler Word Detection (`filler_detection.py`)

**AI Models Used:**
- **Primary Transcription**: Wit.ai (configurable)
- **Fallback Transcription**: OpenAI Whisper (`base` model)
- **Filler Detection**: Rule-based pattern matching

**Metrics Calculation:**

#### Filler Word Analysis
```python
filler_rate = (total_fillers / total_words) * 100
filler_density = total_fillers / duration_minutes
```

#### Pause Analysis
```python
pause_percentage = (total_pause_time / total_duration) * 100
average_pause_duration = np.mean(pause_durations)
pause_frequency = len(pauses) / duration_minutes
```

#### Disfluency Metrics
```python
overall_disfluency_score = (filler_rate * 0.6) + (pause_percentage * 0.4)
fluency_score = max(0, 10 - (overall_disfluency_score * 10))
```

**Output Metrics:**
- `filler_rate`: Percentage of filler words
- `total_fillers`: Count of filler words
- `pause_percentage`: Percentage of time spent pausing
- `fluency_score`: Overall speech fluency (0-10)
- `disfluency_metrics`: Comprehensive disfluency analysis

---

### 5. Stutter Detection (`stutter_detection.py`)

**AI Models Used:**
- **Primary Model**: `HareemFatima/distilhubert-finetuned-stutterdetection` (HuggingFace)
- **Processing**: 5-second audio segments
- **Fallback**: Acoustic feature analysis

**Metrics Calculation:**

#### Segment Analysis
```python
# Process audio in 5-second segments
segment_samples = int(segment_duration * sample_rate)
segments = [audio[i:i+segment_samples] for i in range(0, len(audio), segment_samples)]

# Analyze each segment
for segment in segments:
    stutter_probability = model.predict(segment)
    stutter_detected = stutter_probability > 0.5
```

#### Aggregation Metrics
```python
overall_stutter_probability = np.mean([seg["stutter_probability"] for seg in segments])
fluency_score = (1.0 - overall_stutter_probability) * 10.0
stutter_frequency = stutter_segments_count / duration_minutes
```

**Output Metrics:**
- `stutter_probability`: Overall probability of stuttering (0-1)
- `fluency_score`: Speech fluency score (0-10)
- `stutter_segments_count`: Number of segments with stuttering
- `stutter_timeline`: Timestamped stutter events
- `confidence`: Model confidence in detection

---

### 6. WPM Calculator (`wpm_calculator.py`)

**AI Models Used:**
- **Primary Transcription**: Wit.ai (configurable)
- **Fallback Transcription**: OpenAI Whisper (`base` model)
- **Fallback**: Google Speech Recognition

**Metrics Calculation:**

#### Basic WPM
```python
word_count = len(re.findall(r'\b\w+\b', transcription))
wpm = (word_count / duration_seconds) * 60
```

#### Pace Consistency
```python
wpm_values = [seg['wpm'] for seg in segment_analysis]
mean_wpm = np.mean(wpm_values)
std_wpm = np.std(wpm_values)
cv = std_wpm / mean_wpm  # Coefficient of variation
consistency_score = max(0, 1 - cv)
```

#### Optimal Ranges
```python
wpm_ranges = {
    'presentation': {'min': 120, 'max': 160, 'optimal': 140},
    'conversation': {'min': 140, 'max': 180, 'optimal': 160},
    'audiobook': {'min': 150, 'max': 200, 'optimal': 175}
}
```

**Output Metrics:**
- `overall_wpm`: Words per minute
- `pace_consistency`: Consistency of speaking pace (0-1)
- `segment_analysis`: WPM for each speech segment
- `pause_analysis`: Pause patterns and statistics
- `assessment`: WPM assessment for context

---

## Visual Analysis Services

### 7. Facial Emotion Recognition (`facial_emotion.py`)

**AI Models Used:**
- **Face Detection**: MediaPipe Face Detection
- **Emotion Classification**: `j-hartmann/emotion-english-distilroberta-base` (HuggingFace)
- **Fallback**: Heuristic analysis based on facial features

**Metrics Calculation:**

#### Emotion Statistics
```python
# Aggregate emotions over time
emotion_counts = {}
for frame_emotions in emotions_over_time:
    for emotion, prob in frame_emotions["emotions"].items():
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + prob

# Calculate averages
avg_emotions = {emotion: count / len(emotions_over_time) for emotion, count in emotion_counts.items()}
```

#### Engagement Metrics
```python
positive_emotions = avg_emotions.get('happy', 0) + avg_emotions.get('surprise', 0)
negative_emotions = avg_emotions.get('angry', 0) + avg_emotions.get('sad', 0) + avg_emotions.get('fear', 0)
engagement_score = (positive_emotions - negative_emotions + 1) * 5  # Scale to 0-10
```

#### Temporal Analysis
```python
emotion_transitions = []
for i in range(1, len(emotions_over_time)):
    prev_dominant = max(emotions_over_time[i-1]["emotions"].items(), key=lambda x: x[1])[0]
    curr_dominant = max(emotions_over_time[i]["emotions"].items(), key=lambda x: x[1])[0]
    if prev_dominant != curr_dominant:
        emotion_transitions.append((prev_dominant, curr_dominant))
```

**Output Metrics:**
- `face_detection_rate`: Percentage of frames with detected faces
- `emotion_statistics`: Average emotion probabilities
- `engagement_metrics`: Emotional engagement score
- `temporal_analysis`: Emotion change patterns
- `dominant_emotion`: Most frequent emotion

---

### 8. Eye Contact Analysis (`eye_contact.py`)

**AI Models Used:**
- **Primary**: Gaze-tracking library (if available)
- **Fallback**: OpenCV Haar cascades for face and eye detection

**Metrics Calculation:**

#### Eye Contact Percentage
```python
eye_contact_frames = sum(1 for data in eye_contact_data if data["looking_center"])
eye_contact_percentage = (eye_contact_frames / total_frames) * 100
```

#### Attention Score
```python
attention_score = (eye_contact_percentage / 100) * 10
if attention_score < 3:
    attention_level = "low"
elif attention_score < 7:
    attention_level = "moderate"
else:
    attention_level = "high"
```

#### Gaze Distribution
```python
gaze_distribution = {
    "center": sum(1 for data in eye_contact_data if data["looking_center"]),
    "left": sum(1 for data in eye_contact_data if data["looking_left"]),
    "right": sum(1 for data in eye_contact_data if data["looking_right"])
}
```

**Output Metrics:**
- `eye_contact_percentage`: Percentage of time looking at camera
- `attention_score`: Overall attention score (0-10)
- `gaze_distribution`: Distribution of gaze directions
- `pupils_detected_percentage`: Percentage of frames with detected pupils
- `confidence`: Detection confidence

---

### 9. Posture Analysis (`posture_analysis.py`)

**AI Models Used:**
- **Primary**: MediaPipe Pose
- **Fallback**: None (requires MediaPipe)

**Metrics Calculation:**

#### Bad Posture Detection
```python
def detect_bad_postures(keypoints):
    bad_poses = []
    
    # Slouching detection
    if keypoints["shoulder_angle"] < 160:  # Degrees
        bad_poses.append("slouching")
    
    # Head tilt detection
    if abs(keypoints["head_tilt"]) > 15:  # Degrees
        bad_poses.append("head_tilt")
    
    # Leaning detection
    if abs(keypoints["body_lean"]) > 10:  # Degrees
        bad_poses.append("leaning")
    
    return bad_poses
```

#### Posture Metrics
```python
bad_posture_frames = sum(1 for frame in timeline if frame["bad_poses"])
posture_score = max(0, 10 - (bad_posture_frames / total_frames) * 10)

# Duration of bad postures
for pose_type in ["slouching", "head_tilt", "leaning"]:
    pose_duration = sum(timer["duration"] for timer in pose_timers[pose_type])
    pose_percentage = (pose_duration / total_duration) * 100
```

**Output Metrics:**
- `overall_posture_score`: Overall posture quality (0-10)
- `bad_posture_percentage`: Percentage of time in bad posture
- `posture_timeline`: Timestamped posture events
- `pose_durations`: Duration of each bad posture type
- `recommendations`: Posture improvement suggestions

---

### 10. Hand Gesture Detection (`hand_gesture.py`)

**AI Models Used:**
- **Primary**: MediaPipe Hands
- **Gesture Classification**: Rule-based landmark analysis

**Metrics Calculation:**

#### Gesture Statistics
```python
hands_visible_percentage = (hands_detected_frames / total_frames) * 100
gesture_variety = len(gesture_distribution)
average_hands_per_frame = sum(data["hands_detected"] for data in gesture_data) / total_frames
```

#### Engagement Metrics
```python
engagement_score = 0
if hands_visible_percentage > 50:
    engagement_score += 4
elif hands_visible_percentage > 20:
    engagement_score += 2

if gesture_variety > 3:
    engagement_score += 3
elif gesture_variety > 1:
    engagement_score += 1

if hand_usage.get("both", 0) > 0:
    engagement_score += 2
```

**Output Metrics:**
- `hands_visible_percentage`: Percentage of frames with visible hands
- `gesture_distribution`: Count of each gesture type
- `hand_usage_distribution`: Left/right/both hand usage
- `engagement_metrics`: Gesture-based engagement score
- `most_common_gesture`: Most frequently used gesture

---

## Content Analysis Services

### 11. Lexical Richness (`lexical_richness.py`)

**AI Models Used:**
- **Transcription**: Wit.ai (configurable)
- **NLP Tools**: NLTK, lexicalrichness library
- **Language Support**: English and Arabic

**Metrics Calculation:**

#### Basic Richness Metrics
```python
lex = LexicalRichness(text)

# Type-Token Ratio (TTR)
ttr = lex.ttr

# Root Type-Token Ratio (RTTR)
rttr = lex.rttr

# Corrected Type-Token Ratio (CTTR)
cttr = lex.cttr

# Bilogarithmic Type-Token Ratio (BilogTTR)
bilog_ttr = lex.bilog_ttr

# Uber Index
uber_index = lex.uber_index
```

#### Vocabulary Statistics
```python
unique_words = len(set(words))
total_words = len(words)
vocabulary_density = unique_words / total_words

# Word length analysis
word_lengths = [len(word) for word in words]
avg_word_length = np.mean(word_lengths)
long_words_percentage = sum(1 for length in word_lengths if length > 6) / len(word_lengths) * 100
```

#### Complexity Analysis
```python
# Flesch Reading Ease (English only)
flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)

# Syllable count
syllables_per_word = total_syllables / total_words
```

**Output Metrics:**
- `ttr`: Type-Token Ratio
- `rttr`: Root Type-Token Ratio
- `cttr`: Corrected Type-Token Ratio
- `uber_index`: Uber Index
- `vocabulary_density`: Unique words ratio
- `complexity_score`: Overall complexity assessment

---

### 12. Keyword Relevance (`keyword_relevance.py`)

**AI Models Used:**
- **Transcription**: Wit.ai (configurable)
- **Keyword Extraction**: KeyBERT, YAKE
- **Semantic Similarity**: Sentence Transformers
- **Language Support**: English and Arabic

**Metrics Calculation:**

#### Keyword Extraction
```python
# KeyBERT extraction
keybert_keywords = self.english_keybert.extract_keywords(
    text, 
    keyphrase_ngram_range=(1, 3),
    stop_words='english',
    use_maxsum=True,
    nr_candidates=20,
    top_k=10
)

# YAKE extraction
yake_keywords = self.english_yake.extract_keywords(text)
```

#### Topic Coherence
```python
# Semantic similarity between keywords
keyword_embeddings = sentence_model.encode(keywords)
similarity_matrix = cosine_similarity(keyword_embeddings)
coherence_score = np.mean(similarity_matrix[np.triu_indices_from(similarity_matrix, k=1)])
```

#### Target Keyword Analysis
```python
# Compare extracted keywords with target keywords
target_embeddings = sentence_model.encode(target_keywords)
extracted_embeddings = sentence_model.encode(extracted_keywords)

similarities = cosine_similarity(target_embeddings, extracted_embeddings)
relevance_score = np.max(similarities, axis=1).mean()
```

**Output Metrics:**
- `extracted_keywords`: Keywords found in text
- `topic_coherence`: Semantic coherence of topics
- `relevance_score`: Relevance to target keywords
- `keyword_diversity`: Variety of keywords used
- `coverage_score`: Topic coverage assessment

---

## Composite Scoring System

### 13. Composite Scorer (`composite_scorer.py`)

**AI Models Used:**
- **Weighted aggregation** of all individual service scores
- **No additional AI models**

**Metrics Calculation:**

#### Model Weights
```python
model_weights = {
    "speech_emotion": 0.11,      # Emotional delivery
    "wpm_analysis": 0.09,        # Speaking pace
    "pitch_analysis": 0.09,      # Vocal variety
    "volume_consistency": 0.07,  # Audio clarity
    "filler_detection": 0.07,    # Speech quality
    "stutter_detection": 0.12,   # Speech fluency (highest)
    "lexical_richness": 0.07,    # Vocabulary
    "facial_emotion": 0.09,      # Visual emotion
    "eye_contact": 0.11,         # Audience engagement
    "hand_gesture": 0.05,        # Non-verbal communication
    "posture_analysis": 0.13,    # Professional appearance (highest)
    "keyword_relevance": 0.05,   # Content relevance
}
```

#### Weighted Score Calculation
```python
weighted_scores = []
for key, value in analysis_results.items():
    if isinstance(value, dict) and "score" in value:
        weight = model_weights.get(key, 0.05)
        score = value["score"]
        weighted_scores.append((score, weight))

overall_score = sum(score * weight for score, weight in weighted_scores) / sum(weight for _, weight in weighted_scores)
```

#### Category Scores
```python
speech_models = ["speech_emotion", "wpm_analysis", "pitch_analysis", "volume_consistency", "filler_detection", "stutter_detection", "lexical_richness"]
visual_models = ["facial_emotion", "eye_contact", "hand_gesture", "posture_analysis"]

speech_score = calculate_category_score(component_info, speech_models)
visual_score = calculate_category_score(component_info, visual_models)
```

**Output Metrics:**
- `composite_score.engagement`: Visual engagement score
- `composite_score.confidence`: Speech confidence score
- `composite_score.professionalism`: Overall professionalism
- `composite_score.overall`: Weighted overall score
- `category_scores`: Speech, visual, and content scores
- `component_info`: Detailed breakdown of each model's contribution

---

## Performance Characteristics

### GPU Acceleration
All AI services support GPU acceleration when available:
- **PyTorch models**: Automatic CUDA detection
- **Transformers**: GPU pipeline support
- **MediaPipe**: CPU-optimized (GPU not required)
- **Fallback**: Automatic CPU fallback

### Processing Times (Estimated)
- **Speech Analysis**: 5-15 seconds per minute of audio
- **Visual Analysis**: 10-30 seconds per minute of video
- **Content Analysis**: 2-5 seconds per transcript
- **Overall Analysis**: 20-60 seconds for complete presentation

### Accuracy Metrics
- **Speech Recognition**: 85-95% (Wit.ai), 80-90% (Whisper)
- **Emotion Recognition**: 70-85% (depending on audio quality)
- **Face Detection**: 90-95% (MediaPipe)
- **Posture Detection**: 80-90% (MediaPipe Pose)
- **Keyword Extraction**: 75-85% (semantic relevance)

---

## Configuration Options

### Environment Variables
```bash
# Transcription method
TRANSCRIPTION_METHOD=wit  # or 'whisper'

# Language support
LANGUAGE=english  # or 'arabic', 'auto'

# GPU configuration
CUDA_VISIBLE_DEVICES=0
NVIDIA_VISIBLE_DEVICES=all

# Model caching
TRANSFORMERS_CACHE=/app/.cache/huggingface
HF_HOME=/app/.cache/huggingface
```

### Model Weights Customization
The composite scorer weights can be customized by modifying the `model_weights` dictionary in `composite_scorer.py` to adjust the importance of different aspects in the final score.

---

## Integration Points

### API Endpoints
- Individual model endpoints: `/api/{model-name}`
- Overall analysis: `/api/overall-feedback`
- Audio-only analysis: `/api/audio-only-feedback`
- GPU status: `/api/gpu-status`
- Health check: `/api/health`

### Data Flow
1. **Input**: Audio/video file upload
2. **Processing**: Parallel execution of relevant AI services
3. **Aggregation**: Composite scoring with weighted combination
4. **Output**: Comprehensive analysis report with scores and recommendations

This documentation provides a complete overview of all AI services, their underlying models, and how they calculate their respective metrics to provide comprehensive presentation analysis. 