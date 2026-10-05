import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasEnvKey: boolean;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  hasEnvKey,
  onKeyUpdated,
}) => {
  const [apiKey, setApiKey] = useState(storageService.getApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiService.verifyGemini(apiKey.trim() || undefined);
      setTestResult({
        success: res.success,
        message: res.success
          ? 'Live Gemini 1.5 Flash connection confirmed successfully!'
          : (res.error || res.message || 'Connection test failed'),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to reach server verification endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    storageService.saveApiKey(apiKey.trim());
    setSavedSuccess(true);
    onKeyUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    storageService.removeApiKey();
    setApiKey('');
    setTestResult(null);
    onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl border border-slate-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Gemini API Key Configuration</h3>
            <p className="text-xs text-slate-400">Secure server-side execution</p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mb-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Zero-Exposure Architecture</span>
          </div>
          <p>
            Your API key is never bundled in client code. It is securely loaded from your server's <code className="text-brand-300 font-mono">.env</code> file or passed via local session headers to the server endpoint.
          </p>
        </div>

        {/* Status */}
        {hasEnvKey ? (
          <div className="mb-4 flex items-center space-x-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Server Environment Key Active:</strong> A valid key is loaded in your server environment. You can also override it below.
            </span>
          </div>
        ) : (
          <div className="mb-4 flex items-center space-x-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              No API key found in <code className="font-mono">.env</code>. You can paste your key below, or use the built-in adaptive mock engine.
            </span>
          </div>
        )}

        {/* Input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-brand-400 hover:text-brand-300 hover:underline"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear key
              </button>
            )}
          </div>
        </div>

        {/* Live Test Feedback Banner */}
        {testResult && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start space-x-2 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {testResult.success ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-snug break-words">
              <strong>{testResult.success ? 'Success: ' : 'Error: '}</strong>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                <span>Testing API...</span>
              </>
            ) : (
              <span>Test Live Key</span>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 transition-all flex items-center space-x-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Apply</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
