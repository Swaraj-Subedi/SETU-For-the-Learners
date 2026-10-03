import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useSessionStore } from '@/store/session';
import { Button } from './Button';
import { Notice } from './Notice';
import type { LLMProvider } from '@/types';

export interface ModelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModelSheet: React.FC<ModelSheetProps> = ({ open, onOpenChange }) => {
  const {
    llmConfig,
    updateLLMConfig,
    isModelConnected,
    setModelConnection,
  } = useSessionStore();

  const [provider, setProvider] = useState<LLMProvider>(llmConfig.provider);
  const [ollamaAddress, setOllamaAddress] = useState(llmConfig.ollamaAddress);
  const [ollamaModel, setOllamaModel] = useState(llmConfig.ollamaModel);
  const [openaiAddress, setOpenaiAddress] = useState(llmConfig.openaiAddress);
  const [openaiModel, setOpenaiModel] = useState(llmConfig.openaiModel);
  const [geminiApiKey, setGeminiApiKey] = useState(llmConfig.geminiApiKey);
  const [geminiModel, setGeminiModel] = useState(llmConfig.geminiModel);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    updateLLMConfig({
      provider,
      ollamaAddress,
      ollamaModel,
      openaiAddress,
      openaiModel,
      geminiApiKey,
      geminiModel,
    });
    onOpenChange(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save current fields into store first
    updateLLMConfig({
      provider,
      ollamaAddress,
      ollamaModel,
      openaiAddress,
      openaiModel,
      geminiApiKey,
      geminiModel,
    });

    try {
      if (provider === 'mock' || import.meta.env.VITE_ENABLE_MOCK === 'true') {
        await new Promise((r) => setTimeout(r, 400));
        setTestResult({
          success: true,
          message: 'Connected successfully (Deterministic Mock Mode).',
        });
        setModelConnection('connected', true);
        setIsTesting(false);
        return;
      }

      if (provider === 'ollama') {
        const res = await fetch(`${ollamaAddress.replace(/\/$/, '')}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const models = Array.isArray(data.models) ? data.models.map((m: { name?: string }) => m.name || '') : [];
          const hasModel = models.some((m: string) => m.toLowerCase().includes(ollamaModel.toLowerCase()));
          setTestResult({
            success: true,
            message: hasModel
              ? `Connected to Ollama. Model '${ollamaModel}' is installed and ready.`
              : `Connected to Ollama, but '${ollamaModel}' was not found in downloaded models. Available: ${models.slice(0, 3).join(', ') || 'none'}.`,
          });
          setModelConnection('connected', true);
        } else {
          throw new Error(`Ollama returned status ${res.status}`);
        }
      } else if (provider === 'openai_compat') {
        const res = await fetch(`${openaiAddress.replace(/\/$/, '')}/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          setTestResult({
            success: true,
            message: 'Connected to OpenAI-compatible endpoint successfully.',
          });
          setModelConnection('connected', true);
        } else {
          throw new Error(`Endpoint returned status ${res.status}`);
        }
      } else if (provider === 'gemini') {
        if (!geminiApiKey.trim()) {
          throw new Error('Please enter your Gemini API key to test connection.');
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey.trim()}`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(6000),
          }
        );
        if (res.ok) {
          setTestResult({
            success: true,
            message: 'Gemini API key verified successfully.',
          });
          setModelConnection('connected', true);
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Gemini API returned error ${res.status}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect';
      setTestResult({
        success: false,
        message: msg,
      });
      setModelConnection('error', false, msg);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-40 transition-opacity" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-lg bg-ivory border-l border-sage/60 p-6 sm:p-8 z-50 overflow-y-auto shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sage/40 pb-4 mb-6">
              <div>
                <Dialog.Title className="text-xl font-serif text-ink">
                  Model configuration
                </Dialog.Title>
                <Dialog.Description className="text-xs text-ink-soft mt-1">
                  Choose where question generation runs. Everything stays on your machine by default.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="quiet" size="sm" aria-label="Close model configuration">
                  Close
                </Button>
              </Dialog.Close>
            </div>

            {/* Provider Selection */}
            <div className="space-y-4 mb-6">
              <span className="block text-xs uppercase font-medium tracking-label text-sage-ink">
                Provider
              </span>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-paper border border-sage/40 rounded-sm cursor-pointer hover:border-ink/60">
                  <input
                    type="radio"
                    name="provider"
                    value="ollama"
                    checked={provider === 'ollama'}
                    onChange={() => setProvider('ollama')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      Ollama on this computer (Default, Private)
                    </div>
                    <div className="text-[11px] text-ink-soft mt-0.5">
                      100% offline and free. Recommended for privacy.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-paper border border-sage/40 rounded-sm cursor-pointer hover:border-ink/60">
                  <input
                    type="radio"
                    name="provider"
                    value="openai_compat"
                    checked={provider === 'openai_compat'}
                    onChange={() => setProvider('openai_compat')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      LM Studio or OpenAI-compatible server
                    </div>
                    <div className="text-[11px] text-ink-soft mt-0.5">
                      Connect to LM Studio, vLLM, LocalAI, or custom OpenAI-compatible server.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-paper border border-sage/40 rounded-sm cursor-pointer hover:border-ink/60">
                  <input
                    type="radio"
                    name="provider"
                    value="gemini"
                    checked={provider === 'gemini'}
                    onChange={() => setProvider('gemini')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      Google Gemini (Own API key)
                    </div>
                    <div className="text-[11px] text-ink-soft mt-0.5">
                      Fast cloud inference. Key kept in memory only, never saved.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Provider specific inputs */}
            {provider === 'ollama' && (
              <div className="space-y-3 mb-6 p-4 bg-paper/60 border border-sage/40 rounded-sm">
                <div>
                  <label htmlFor="ollama-addr" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Server Address
                  </label>
                  <input
                    id="ollama-addr"
                    type="text"
                    value={ollamaAddress}
                    onChange={(e) => setOllamaAddress(e.target.value)}
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label htmlFor="ollama-model" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Model Name
                  </label>
                  <input
                    id="ollama-model"
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink"
                  />
                  <span className="block text-[10px] text-ink-soft mt-1">
                    Default: qwen2.5:14b-instruct (or mistral, llama3.1)
                  </span>
                </div>
              </div>
            )}

            {provider === 'openai_compat' && (
              <div className="space-y-3 mb-6 p-4 bg-paper/60 border border-sage/40 rounded-sm">
                <div>
                  <label htmlFor="openai-addr" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Base URL
                  </label>
                  <input
                    id="openai-addr"
                    type="text"
                    value={openaiAddress}
                    onChange={(e) => setOpenaiAddress(e.target.value)}
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label htmlFor="openai-model" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Model Identifier
                  </label>
                  <input
                    id="openai-model"
                    type="text"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            )}

            {provider === 'gemini' && (
              <div className="space-y-3 mb-6 p-4 bg-paper/60 border border-sage/40 rounded-sm">
                <div>
                  <label htmlFor="gemini-key" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Gemini API Key
                  </label>
                  <input
                    id="gemini-key"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink font-mono"
                  />
                  <p className="text-[11px] text-ink-soft mt-1.5 leading-snug">
                    Kept in tab memory only; never stored in localStorage, cookies or backend. Note: any key typed into a browser is visible to that tab.
                  </p>
                </div>
                <div>
                  <label htmlFor="gemini-model" className="block text-[11px] font-medium text-sage-ink uppercase tracking-label mb-1">
                    Model
                  </label>
                  <input
                    id="gemini-model"
                    type="text"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full bg-paper px-3 py-2 text-xs text-ink rounded-sm border-b border-sage/60 focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            )}

            {/* Test Connection Result */}
            {testResult && (
              <Notice
                variant={testResult.success ? 'info' : 'error'}
                title={testResult.success ? 'Connection confirmed' : 'Connection failed'}
                className="mb-6"
              >
                {testResult.message}
              </Notice>
            )}

            {/* Unreachable Ollama PowerShell Guidance */}
            {(!isModelConnected || testResult?.success === false) && provider === 'ollama' && (
              <div className="p-4 bg-paper border border-sage/40 rounded-sm text-xs text-ink-soft space-y-2 mb-6">
                <p className="font-semibold text-ink text-[11px] uppercase tracking-label">
                  Windows PowerShell Setup for Ollama:
                </p>
                <ol className="list-decimal pl-4 space-y-1 font-mono text-[11px]">
                  <li>Install Ollama from ollama.com</li>
                  <li>Pull the model: <code className="bg-ivory px-1 rounded">ollama pull qwen2.5:14b-instruct</code></li>
                  <li>
                    If browser blocks requests (CORS), set in PowerShell:
                    <div className="bg-ivory p-1.5 mt-1 rounded text-[10px] break-all">
                      $env:OLLAMA_ORIGINS="http://localhost:5173" ; ollama serve
                    </div>
                  </li>
                </ol>
                <p className="text-[11px] text-ink-soft mt-1">
                  Note: Running locally with <code className="font-mono">npm run dev</code> works with Ollama&apos;s default settings. Your browser may request permission to reach local network devices.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-sage/40 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? 'Testing connection…' : 'Test connection'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
            >
              Save and close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
