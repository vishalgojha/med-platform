import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, Share, PlusSquare, X } from "lucide-react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Chrome/Android/Edge
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a short delay to not be intrusive immediately
            setTimeout(() => setShowInstallModal(true), 2000);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIosDevice) {
             setIsIOS(true);
             // Show prompt for iOS users too
             setTimeout(() => setShowInstallModal(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
        setShowInstallModal(false);
    };

    return (
        <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        Install MediScribe
                    </DialogTitle>
                    <DialogDescription>
                        Install our app for a better experience, faster access, and full screen usage.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-2">
                    {isIOS ? (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm text-slate-700 border border-slate-100">
                            <p className="font-medium">To install on iOS:</p>
                            <div className="flex items-center gap-3">
                                <Share className="w-4 h-4 text-blue-600" />
                                <span>1. Tap the <strong>Share</strong> button</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <PlusSquare className="w-4 h-4 text-blue-600" />
                                <span>2. Scroll down and tap <strong>Add to Home Screen</strong></span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 border border-slate-100">
                                Get quick access to MediScribe directly from your home screen.
                            </div>
                            <Button onClick={handleInstall} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Install Now
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => setShowInstallModal(false)} className="text-slate-400">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}