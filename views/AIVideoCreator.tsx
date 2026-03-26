
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  Video, Sparkles, Image as ImageIcon, Mic, Play, 
  Loader2, ArrowLeft, CheckCircle2, AlertCircle, Info, ShieldAlert,
  Download, Share2, Trash2, MessageCircle, Facebook, Instagram, History
} from 'lucide-react';
import { dbService } from '../services/firebase';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface AIVideoCreatorProps {
  userId: string;
}

const AIVideoCreator: React.FC<AIVideoCreatorProps> = ({ userId }) => {
  const [step, setStep] = useState<'INITIAL' | 'PROMPT' | 'GENERATING' | 'RESULT'>('INITIAL');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Cartoon');
  const [movement, setMovement] = useState('Falando');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [previewVideo, setPreviewVideo] = useState<any | null>(null);

  useEffect(() => {
    checkApiKey();
    const unsubscribe = dbService.sync('ai_videos', userId, (data) => {
      setSavedVideos(data);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (step === 'RESULT' && generatedImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % generatedImages.length);
      }, 8000); // Troca de cena a cada 8 segundos
      return () => clearInterval(interval);
    }
  }, [step, generatedImages]);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const pcmToWav = (pcmBase64: string, sampleRate: number = 24000): Blob => {
    const binaryString = atob(pcmBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const buffer = new ArrayBuffer(44 + bytes.length);
    const view = new DataView(buffer);

    const writeString = (v: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        v.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bytes.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bytes.length, true);

    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(bytes);

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const generateAnimation = async () => {
    setGeneratedVideoUrl(null);
    setGeneratedAudioUrl(null);
    setGeneratedImages([]);
    setCurrentImageIndex(0);
    setStep('GENERATING');
    setError(null);
    try {
      const currentApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      // 1. Expand Prompt into a Script (Roteiro) for ~1 minute
      setLoadingStatus('1️⃣ Criando roteiro detalhado (60s)...');
      let fullScript = prompt;
      try {
        const scriptResponse = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: `Crie um roteiro de narração de exatamente 1 minuto (cerca de 180 palavras) baseado no seguinte tema: "${prompt}". 
          O roteiro deve ser dividido em 3 partes claras (Início, Meio e Fim). 
          Retorne APENAS o texto da narração contínua.`,
        });
        fullScript = scriptResponse.text || prompt;
      } catch (scriptErr: any) {
        console.error("Script generation failed:", scriptErr);
        if (scriptErr.message?.includes('403') || scriptErr.message?.includes('permission')) {
          setHasApiKey(false);
          throw new Error("Erro de permissão na API. Por favor, configure sua chave API.");
        }
      }

      setLoadingStatus('2️⃣ Gerando cenas cinematográficas...');

      // 2. Generate 3 Scenes (Images)
      const scenePrompts = [
        `Cinematic 2D animation style, scene 1: beginning of ${prompt}, style ${style}, high quality, vibrant colors, expressive character, professional design, 16:9 aspect ratio`,
        `Cinematic 2D animation style, scene 2: middle of ${prompt}, style ${style}, high quality, vibrant colors, expressive character, professional design, 16:9 aspect ratio`,
        `Cinematic 2D animation style, scene 3: conclusion of ${prompt}, style ${style}, high quality, vibrant colors, expressive character, professional design, 16:9 aspect ratio`
      ];

      const imageUrls: string[] = [];
      for (let i = 0; i < scenePrompts.length; i++) {
        setLoadingStatus(`2️⃣ Gerando cena ${i+1} de 3...`);
        try {
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: scenePrompts[i] }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
          });

          let base64Image = '';
          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              base64Image = part.inlineData.data;
              break;
            }
          }
          if (base64Image) {
            // Upload immediately to storage
            const imageBlob = await (await fetch(`data:image/png;base64,${base64Image}`)).blob();
            const storageUrl = await dbService.uploadFile(userId, imageBlob, 'png');
            imageUrls.push(storageUrl);
          }
        } catch (imageErr) {
          console.error(`Scene ${i+1} failed:`, imageErr);
        }
      }

      if (imageUrls.length === 0) throw new Error("Falha ao gerar imagens das cenas.");
      setGeneratedImages(imageUrls);

      setLoadingStatus('3️⃣ Gerando narração inteligente (60s)...');

      // 3. Generate Audio (TTS) for the full script
      let storageAudioUrl = null;
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Narração profissional e pausada: ${fullScript}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        if (base64Audio) {
          const audioBlob = pcmToWav(base64Audio);
          storageAudioUrl = await dbService.uploadFile(userId, audioBlob, 'wav');
          setGeneratedAudioUrl(storageAudioUrl);
        }
      } catch (ttsErr: any) {
        console.error("TTS generation failed:", ttsErr);
      }

      setLoadingStatus('4️⃣ Finalizando animação...');
      
      // Save to Firestore with Storage URLs ONLY
      await dbService.add('ai_videos', userId, {
        videoUrl: imageUrls[0], // Primary image
        allImages: imageUrls,   // All scenes
        audioUrl: storageAudioUrl,
        prompt: fullScript,
        originalPrompt: prompt,
        style,
        movement,
        isSmart: true,
        timestamp: Date.now()
      });

      setStep('RESULT');

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setError("Erro de permissão na API. Por favor, configure sua chave API para continuar.");
        setHasApiKey(false);
      } else {
        setError(err.message || "Erro na geração.");
      }
      setStep('PROMPT');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir permanentemente este vídeo?")) {
      try {
        await dbService.del('ai_videos', id);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Erro ao excluir o vídeo.");
      }
    }
  };

  const handleDownload = async (url: string, id: string, isSmart?: boolean) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = isSmart ? 'png' : 'mp4';
      link.download = `nexus-ai-${id.substring(0, 6)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: direct link
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `nexus-ai-${id.substring(0, 6)}`;
      link.click();
    }
  };

  const handleShare = (url: string, platform: 'wa' | 'fb' | 'ig') => {
    const text = encodeURIComponent("Olha essa animação que criei com IA no Nexus! 🔥");
    const link = encodeURIComponent(url);
    
    let shareUrl = '';
    if (platform === 'wa') shareUrl = `https://api.whatsapp.com/send?text=${text}%20${link}`;
    if (platform === 'fb') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
    if (platform === 'ig') {
      alert("Para o Instagram, baixe o vídeo e poste nos seus Stories ou Reels!");
      return;
    }
    
    window.open(shareUrl, '_blank');
  };

  const handleAdjust = (video: any) => {
    setPrompt(video.prompt);
    setStyle(video.style || 'Cartoon');
    setMovement(video.movement || 'Falando');
    setStep('PROMPT');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg">
            <Video size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Animação com IA</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crie vídeos profissionais em segundos</p>
          </div>
        </div>
        {step !== 'INITIAL' && (
          <button 
            onClick={() => setStep('INITIAL')}
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </header>

      {!hasApiKey && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-black text-amber-900 uppercase mb-1">Chave de API Necessária</h3>
            <p className="text-xs text-amber-700 font-medium">Para gerar vídeos com a tecnologia Veo, você precisa conectar sua própria chave de API do Google AI Studio (projeto pago).</p>
          </div>
          <button 
            onClick={handleOpenKeyDialog}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-700 transition-all"
          >
            Configurar Chave
          </button>
        </div>
      )}

      {step === 'INITIAL' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="nexus-card p-8 flex flex-col items-center text-center space-y-6 group cursor-pointer" onClick={() => setStep('PROMPT')}>
              <div className="w-20 h-20 bg-brand-blue/5 text-brand-blue rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Criar com Prompt</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Descreva seu personagem e o que ele deve fazer em texto.</p>
              </div>
              <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-green transition-colors">Começar Agora</button>
            </div>

            <div className="nexus-card p-8 flex flex-col items-center text-center space-y-6 opacity-50 cursor-not-allowed">
              <div className="w-20 h-20 bg-brand-orange/10 text-brand-orange rounded-[2rem] flex items-center justify-center">
                <Mic size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Usar Áudio</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Grave sua voz e a IA criará um personagem falando por você.</p>
              </div>
              <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Em Breve</button>
            </div>
          </div>

          {savedVideos.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <History size={18} className="text-brand-orange" />
                <h2 className="text-lg font-black text-slate-900 uppercase italic">Suas Criações</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVideos.map((video) => (
                  <div key={video.id} className="nexus-card overflow-hidden flex flex-col">
                    <div 
                      className="aspect-video bg-slate-900 relative group cursor-pointer overflow-hidden"
                      onClick={() => setPreviewVideo(video)}
                    >
                      {video.isSmart ? (
                        <div className="w-full h-full relative">
                          <img src={video.videoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Smart Animation" />
                          <div className="absolute top-2 right-2 px-2 py-1 bg-brand-green text-white text-[8px] font-black uppercase rounded shadow-lg">Smart AI</div>
                          {video.audioUrl && <audio src={video.audioUrl} className="hidden" />}
                        </div>
                      ) : (
                        <video src={video.videoUrl} className="w-full h-full object-contain" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <div className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform">
                          <Play size={20} fill="currentColor" />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjust(video);
                          }}
                          className="p-3 bg-brand-green text-white rounded-full hover:scale-110 transition-transform"
                          title="Ajustar / Reutilizar"
                        >
                          <Sparkles size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase line-clamp-2 h-8">{video.prompt}</p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleShare(video.videoUrl, 'wa')}
                            className="p-2 text-brand-green hover:bg-brand-green/5 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleShare(video.videoUrl, 'fb')}
                            className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
                            title="Facebook"
                          >
                            <Facebook size={18} />
                          </button>
                          <button 
                            onClick={() => handleShare(video.videoUrl, 'ig')}
                            className="p-2 text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors"
                            title="Instagram"
                          >
                            <Instagram size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleDownload(video.videoUrl, video.id, video.isSmart)}
                            className="p-2 text-brand-cyan hover:bg-brand-cyan/5 rounded-lg transition-colors"
                            title="Baixar"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(video.id)}
                            className="p-2 text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'PROMPT' && (
        <div className="nexus-card p-8 space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-brand-orange" /> Descreva sua animação
            </label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='Ex: "Um personagem animado falando sobre nunca desistir, estilo anime, fundo escuro. Adicione características como óculos, chapéu e uma jaqueta azul."'
              className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-brand-cyan outline-none transition-all resize-none"
            />
          </div>

          <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl flex items-center gap-3 text-brand-blue">
            <Info size={18} />
            <p className="text-[10px] font-bold uppercase">Dica: Você pode adicionar múltiplos personagens e detalhes específicos. Os vídeos podem ter até 1 minuto de duração total.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo Visual</label>
              <div className="grid grid-cols-2 gap-2">
                {['Anime', 'Cartoon', 'Realista', '3D'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${style === s ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-brand-cyan'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimento</label>
              <div className="grid grid-cols-2 gap-2">
                {['Falando', 'Andando', 'Dançando', 'Gesticulando'].map((m) => (
                  <button 
                    key={m}
                    onClick={() => setMovement(m)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${movement === m ? 'bg-brand-green text-white border-brand-green shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-brand-cyan'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
              <AlertCircle size={18} />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase">{error}</p>
                {!hasApiKey && (
                  <button 
                    onClick={handleOpenKeyDialog}
                    className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-700 transition-colors"
                  >
                    Configurar Chave API
                  </button>
                )}
              </div>
            </div>
          )}

          <button 
            onClick={generateAnimation}
            disabled={!prompt}
            className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 ${!prompt ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-green transform hover:scale-[1.02]'}`}
          >
            <Sparkles size={20} /> GERAR ANIMAÇÃO
          </button>
        </div>
      )}

      {step === 'GENERATING' && (
        <div className="nexus-card p-12 flex flex-col items-center justify-center text-center space-y-8 animate-fade">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-brand-cyan rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Video size={32} className="text-brand-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-brand-blue uppercase italic mb-2">Processando Magia...</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">{loadingStatus}</p>
          </div>
          <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-cyan h-full animate-progress-bar"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium max-w-xs">Isso pode levar alguns minutos dependendo da complexidade da animação.</p>
        </div>
      )}

      {step === 'RESULT' && (generatedVideoUrl || generatedImages.length > 0) && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="nexus-card overflow-hidden bg-slate-900 aspect-video flex items-center justify-center shadow-2xl relative group">
            {generatedVideoUrl ? (
              <video 
                src={generatedVideoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                <img 
                  src={generatedImages[currentImageIndex]} 
                  className="w-full h-full object-cover animate-ken-burns" 
                  alt="AI Generated Animation"
                  key={generatedImages[currentImageIndex]}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center animate-pulse">
                      <Play size={24} className="text-white fill-current" />
                    </div>
                    <div>
                      <p className="text-white font-black italic uppercase tracking-tighter">Animação Inteligente Ativa</p>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Cena {currentImageIndex + 1} de {generatedImages.length} + Voz IA</p>
                    </div>
                  </div>
                </div>
                {generatedAudioUrl && (
                  <audio src={generatedAudioUrl} autoPlay className="hidden" />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleDownload(generatedVideoUrl || generatedImages[0] || '', 'new', !generatedVideoUrl)}
              className="py-5 bg-brand-green text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-brand-green/90 transition-all"
            >
              <Download size={18} /> BAIXAR
            </button>
            <button 
              onClick={() => setStep('PROMPT')}
              className="py-5 bg-brand-cyan text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-brand-cyan/90 transition-all"
            >
              <Sparkles size={18} /> AJUSTAR
            </button>
            <button 
              onClick={() => setStep('INITIAL')}
              className="py-5 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-brand-blue/90 transition-all"
            >
              <History size={18} /> MINHA LISTA
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-12 animate-fade">
          <button 
            onClick={() => setPreviewVideo(null)}
            className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative">
            {previewVideo.isSmart ? (
              <div className="w-full h-full relative overflow-hidden">
                <img src={previewVideo.videoUrl} className="w-full h-full object-cover animate-ken-burns" alt="Preview" />
                {previewVideo.audioUrl && <audio src={previewVideo.audioUrl} autoPlay controls className="absolute bottom-4 left-4 right-4 opacity-50 hover:opacity-100 transition-opacity" />}
              </div>
            ) : (
              <video src={previewVideo.videoUrl} controls autoPlay className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <footer className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center shrink-0">
          <Sparkles size={20} />
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Esta é a <strong>Versão Inteligente</strong> da Animação IA. 
          Utilizamos geração de imagens de alta fidelidade e voz neural para criar vídeos 
          sem a necessidade de APIs pagas de vídeo, garantindo escala e economia.
        </p>
      </footer>

      <style>{`
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-bar {
          animation: progress-bar 60s linear infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
        @keyframes ken-burns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.2) translate(-2%, -2%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .animate-ken-burns {
          animation: ken-burns 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AIVideoCreator;
