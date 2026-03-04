import React, { useState, useRef } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoicePlayer({ 
  text, 
  className,
  variant = "icon", // "icon" | "button" | "mini"
  label = "Listen",
  autoPlay = false 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const generateAndPlay = async () => {
    if (!text || text.trim().length === 0) return;

    // If already have audio, just toggle play/pause
    if (audioRef.current && audioUrlRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await appClient.functions.invoke('textToSpeech', { text });
      
      // Create blob from array buffer
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);

    } catch (err) {
      console.error('Voice generation error:', err);
      setError('Failed to generate voice');
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Auto-play if enabled
  React.useEffect(() => {
    if (autoPlay && text) {
      generateAndPlay();
    }
  }, [autoPlay, text]);

  if (variant === "mini") {
    return (
      <button
        onClick={isPlaying ? stopPlaying : generateAndPlay}
        disabled={isLoading || !text}
        className={cn(
          "p-1 rounded-full transition-colors",
          isPlaying ? "text-[#5b9a8b] bg-[#5b9a8b]/10" : "text-slate-400 hover:text-[#5b9a8b] hover:bg-[#5b9a8b]/5",
          className
        )}
        title={isPlaying ? "Stop" : "Listen"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isPlaying ? stopPlaying : generateAndPlay}
        disabled={isLoading || !text}
        className={cn(
          "shrink-0",
          isPlaying && "text-[#5b9a8b]",
          className
        )}
        title={isPlaying ? "Stop" : "Listen"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={isPlaying ? stopPlaying : generateAndPlay}
      disabled={isLoading || !text}
      className={cn(
        "gap-2",
        isPlaying && "border-[#5b9a8b] text-[#5b9a8b]",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      {isPlaying ? "Stop" : label}
    </Button>
  );
}