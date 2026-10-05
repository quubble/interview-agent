// Text-to-Speech & Speech Recognition helper for InterviewPilot AI

export const speechService = {
  isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  isSttSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  },

  speak(text: string, onEnd?: () => void): void {
    if (!this.isTtsSupported()) return;
    try {
      window.speechSynthesis.cancel(); // Stop any existing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (preferred) {
        utterance.voice = preferred;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  },

  stopSpeaking(): void {
    if (this.isTtsSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  createRecognition(
    onResult: (transcript: string) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): any | null {
    if (!this.isSttSupported()) return null;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (fullTranscript) {
          onResult(fullTranscript);
        }
      };

      recognition.onerror = onError;
      recognition.onend = onEnd;
      return recognition;
    } catch (e) {
      console.warn('Speech recognition initialization error:', e);
      return null;
    }
  }
};
