/*
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useRef, ChangeEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle2, Paintbrush, Globe, Cpu, Palette, Mail, ChevronRight, Camera, Upload, Phone, CreditCard, Sparkles, RefreshCw } from 'lucide-react';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'about' | 'contacts' | 'join';
}

export default function ContentModal({ isOpen, onClose, type }: ContentModalProps) {
  // Unified state for multiple picture uploads, first name, last name, phone number, and transaction success
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userNumber, setUserNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [pursuing, setPursuing] = useState('');
  const [profileImages, setProfileImages] = useState<string[]>([]);
  
  // Transaction loading and completion state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Razorpay Dynamic CDN Script loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const pendingLoads = Array.from(files).map((fileObj) => {
        const file = fileObj as File;
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      Promise.all(pendingLoads).then((loadedImages) => {
        setProfileImages((prev) => [...prev, ...loadedImages]);
      });
    }
  };

  const removeImage = (indexToRemove: number, e: MouseEvent) => {
    e.stopPropagation();
    setProfileImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !userNumber) return;
    
    setIsProcessing(true);
    setLoadingStep('Recording registration profile details...');
    
    try {
      // Dynamic profile details mapping for register pass
      const email = `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@education.com`;
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'registration',
          customerName: `${firstName} ${lastName}`,
          customerEmail: email,
          customerPhone: userNumber,
          firstName: firstName,
          lastName: lastName,
          qualification: qualification,
          pursuing: pursuing,
          profileImages: profileImages
        })
      });

      setLoadingStep('Connecting secure payment gateway...');

      // Redirect user to their custom Razorpay Payment gateway URL
      setTimeout(() => {
        setIsProcessing(false);
        const targetUrl = 'https://razorpay.me/@soumanjonhaldar5793';
        
        try {
          // Attempt to open in a new tab first so they do not lose their current app state
          const newWindow = window.open(targetUrl, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocker prevented opening new tab, redirect same window
            window.location.href = targetUrl;
          }
        } catch (err) {
          // Fallback to direct redirect
          window.location.href = targetUrl;
        }
      }, 1000);

    } catch (err) {
      console.error('Registration order error:', err);
      // Force direct redirection to requested gateway even on network or save failure
      window.location.href = 'https://razorpay.me/@soumanjonhaldar5793';
    }
  };

  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setUserNumber('');
    setQualification('');
    setPursuing('');
    setProfileImages([]);
    setPaymentSuccess(false);
    setTransactionId('');
  };

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-8 select-none" id="modal-about-content">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">01 / CONCEPT AND PHILOSOPHY</span>
              <h3 className="text-3xl md:text-4xl font-light tracking-tight text-white font-sans">
                The Future of Learning: <span className="font-semibold italic text-zinc-305">Empowering Minds with AI</span>.
              </h3>
              <p className="text-zinc-400 font-light leading-relaxed text-sm md:text-base">
                Artificial Intelligence is the fundamental engine driving the next industrial revolution. 
                Providing comprehensive AI education is crucial for preparing the next generation to navigate, shape, and innovate 
                within an increasingly automated world. It equips learners with critical thinking, ethical frameworks, 
                and essential computational skills necessary to solve complex global challenges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/15 space-y-3 shadow-[0_10px_20px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300">
                <Cpu className="w-5 h-5 text-zinc-300" />
                <h4 className="text-white text-base font-medium">Adaptive Intelligence</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Understanding how intelligent machines process, classify, and predict data. Demystifying machine learning to build real technical capability.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/15 space-y-3 shadow-[0_10px_20px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300">
                <Sparkles className="w-5 h-5 text-zinc-300" />
                <h4 className="text-white text-base font-medium">Ethical Frameworks</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Developing the critical thinking needed to guide AI responsibly, ensuring bias-free, fair, and humanitarian systems.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/15 space-y-3 shadow-[0_10px_20px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300">
                <Globe className="w-5 h-5 text-zinc-300" />
                <h4 className="text-white text-base font-medium">Global Progress</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Empowering creators and students everywhere to address grand challenges in health, environment, and universal accessibility.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/40 pt-6 flex flex-wrap gap-x-12 gap-y-3 text-xs text-zinc-500 font-mono">
              <div>INITIATIVE: <span className="text-zinc-300">AI LEARNING FOR ALL</span></div>
              <div>ACADEMIC YEAR: <span className="text-zinc-300">2026-2027</span></div>
              <div>PREPARED BY: <span className="text-zinc-300">EDUCATION NETWORK</span></div>
            </div>
          </div>
        );

      case 'contacts':
      case 'join':
        const titleText = type === 'contacts' ? 'PARTNER ALLIANCE PORTAL' : 'SECURE MEMBER REGISTRATION';
        const subtitleText = 'Registration Page';
        
        return (
          <div className="space-y-6" id={`modal-${type}-content`}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-zinc-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">{titleText} // PHASE 2</span>
            </div>
            
            <AnimatePresence mode="wait">
              {!paymentSuccess ? (
                <motion.div
                  key="unified-payment-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8"
                >
                  {/* Left Side: Drag and Drop/Picture Adding Panel */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-light tracking-tight text-white">{subtitleText}</h3>
                        <p className="text-sm text-emerald-400 font-light leading-relaxed">
                          (You should pay 250rs as a registration fee)
                        </p>
                      </div>

                      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2.5 text-xs text-zinc-300">
                        <span className="font-mono text-zinc-500 uppercase tracking-widest text-[9px] block">Required Documents</span>
                        <ol className="space-y-1.5 list-decimal list-inside font-light text-zinc-400">
                          <li>secondary/HS marksheet Picture</li>
                          <li>Secondary/HS registration & Admit picture</li>
                          <li>Adhaar Card Both side picture</li>
                          <li>Passport Size photo</li>
                        </ol>
                        <span className="text-[10px] text-zinc-500 font-light block mt-1">Please upload these documents in picture format.</span>
                      </div>
                    </div>

                    {/* Highly polished interactive picture adding block */}
                    <div className="relative group mt-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                        multiple
                      />
                      
                      <div 
                        onClick={triggerFileBrowser}
                        className={`w-full rounded-xl border flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer ${
                          profileImages.length > 0 
                            ? 'border-white/30 bg-white/[0.04]' 
                            : 'border-dashed border-white/10 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03]'
                        } shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]`}
                        role="button"
                        aria-label="Upload profile image button"
                      >
                        {profileImages.length > 0 ? (
                          <div className="relative w-full flex flex-col space-y-4">
                            {/* Grid dynamic container */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-h-[220px] overflow-y-auto p-1 text-left">
                              {profileImages.map((imgSrc, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/20 group/img shadow-md">
                                  <img 
                                    src={imgSrc} 
                                    alt={`Biometric upload ${idx + 1}`} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => removeImage(idx, e)}
                                    className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all duration-200 text-red-400 hover:text-red-300 font-mono text-[10px] tracking-wider uppercase font-semibold cursor-pointer"
                                    title="Click to remove"
                                  >
                                    REMOVE
                                  </button>
                                </div>
                              ))}
                              {/* Add node inside grid */}
                              <div 
                                onClick={(e) => { e.stopPropagation(); triggerFileBrowser(); }}
                                className="aspect-square rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-all duration-205"
                              >
                                <Upload className="w-5 h-5 mb-1 text-zinc-300" />
                                <span className="text-[10px] font-mono leading-none font-medium tracking-wide">ADD MORE</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center px-1 font-mono text-[10px] text-zinc-400">
                              <span>{profileImages.length} PICTURE{profileImages.length > 1 ? 'S' : ''} SELECTED</span>
                              <span className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wide">
                                <Camera className="w-3.5 h-3.5" /> ADD ANOTHER
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-3 text-zinc-405 group-hover:text-zinc-200 transition-colors py-8">
                            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5 text-zinc-300" />
                            </div>
                            <div>
                              <span className="text-xs font-mono font-medium block uppercase tracking-wider">ADD MULTIPLE PICTURES</span>
                              <span className="text-[10px] font-light text-zinc-500 block mt-1">Select one or multiple images up to 4MB</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Identity Details & Secure Checkout */}
                  <form onSubmit={handlePaymentSubmit} className="md:col-span-7 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      {/* Name Row (First Name & Last Name) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5" htmlFor="field-first-name">FIRST NAME</label>
                          <input
                            id="field-first-name"
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/15 focus:border-white/45 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none transition-all duration-300 placeholder:text-zinc-650 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]"
                            placeholder="e.g. Liam"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5" htmlFor="field-last-name">LAST NAME</label>
                          <input
                            id="field-last-name"
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/15 focus:border-white/45 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none transition-all duration-300 placeholder:text-zinc-650 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]"
                            placeholder="e.g. Vance"
                          />
                        </div>
                      </div>

                      {/* Number Section */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5" htmlFor="field-user-number">CONTACT NUMBER</label>
                        <div className="relative">
                          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-zinc-505 font-mono text-xs select-none">
                            <Phone className="w-3.5 h-3.5" />
                          </span>
                          <input
                            id="field-user-number"
                            type="tel"
                            required
                            value={userNumber}
                            onChange={(e) => setUserNumber(e.target.value)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/15 focus:border-white/45 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none transition-all duration-300 placeholder:text-zinc-650 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]"
                            placeholder="+1 (555) 0199"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 block mt-1.5">// SECURE IDENTITY HANDSHAKE ROUTE VIA TELEMETRY</span>
                      </div>

                      {/* Qualification & Pursuing Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5" htmlFor="field-qualification">Qualification (Secondary/HS)</label>
                          <input
                            id="field-qualification"
                            type="text"
                            required
                            value={qualification}
                            onChange={(e) => setQualification(e.target.value)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/15 focus:border-white/45 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none transition-all duration-300 placeholder:text-zinc-650 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]"
                            placeholder="e.g. HS"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5" htmlFor="field-pursuing">Pursuing</label>
                          <input
                            id="field-pursuing"
                            type="text"
                            required
                            value={pursuing}
                            onChange={(e) => setPursuing(e.target.value)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/15 focus:border-white/45 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none transition-all duration-300 placeholder:text-zinc-650 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.05)]"
                            placeholder="e.g. Science / Arts"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Real-time Dynamic Liquid Loader or the transparent color-less Payment Button */}
                    <div className="pt-2">
                      <AnimatePresence mode="wait">
                        {isProcessing ? (
                          <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center justify-center p-4 space-y-3 bg-white/[0.02] border border-white/10 rounded-xl"
                          >
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                            <div className="text-[10px] font-mono text-zinc-400 text-center tracking-widest uppercase">
                              {loadingStep}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="pay-button"
                            id="submit-payment-btn"
                            type="submit"
                            className="btn-liquid-base btn-liquid-glass w-full py-4 text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                          >
                            <CreditCard className="w-4 h-4 text-zinc-300" /> Complete registration
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* Payment Success Receipt Screen displaying picture, first name, last name, phone/number */
                <motion.div
                  key="unified-payment-success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 max-w-lg mx-auto text-center space-y-6"
                >
                  {/* Decorative glass ticket structure */}
                  <div className="relative p-7 rounded-2xl bg-white/[0.02] shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)] border border-white/15 backdrop-blur-3xl overflow-hidden space-y-6">
                    {/* Background light glare */}
                    <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                    <div className="flex flex-col items-center">
                      <div className="relative mb-3">
                        <CheckCircle2 className="w-16 h-16 text-zinc-200" />
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-black rounded-full p-1 border border-black shadow">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white">ACCESS GRANTED</h4>
                      <p className="text-[10px] font-mono tracking-widest text-[rgb(16,185,129)] mt-1 uppercase">// TRANSACTION COMPLETED</p>
                    </div>

                    {/* Receipt Body with Photo, names, phone number */}
                    <div className="border-t border-b border-white/10 py-5 my-2 space-y-4 text-left">
                      <div className="flex items-center gap-4">
                        {/* Multiple Profile Photos overlapping pile */}
                        {profileImages.length > 0 ? (
                          <div className="flex items-center -space-x-4 shrink-0">
                            {profileImages.slice(0, 4).map((img, index) => (
                              <div 
                                key={index} 
                                className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-955 bg-zinc-900 shadow-lg flex items-center justify-center"
                                style={{ zIndex: 10 - index }}
                              >
                                <img 
                                  src={img} 
                                  alt={`Verified biometric token ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                            {profileImages.length > 4 && (
                              <div 
                                className="relative w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-955 flex items-center justify-center text-white text-[10px] font-mono font-semibold shadow-lg"
                                style={{ zIndex: 5 }}
                              >
                                +{profileImages.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-955 shrink-0 bg-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-[9px] shadow-lg">
                            NO-PIC
                          </div>
                        )}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 block leading-none">// SUBJECT IDENTITY</span>
                          <span className="text-lg font-light text-white leading-none block">
                            {firstName} {lastName}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-[10px] font-mono select-none">
                        <div>
                          <span className="text-zinc-500 block uppercase">CONTACT NUMBER</span>
                          <span className="text-zinc-300 font-medium block truncate mt-0.5">{userNumber}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase">QUALIFICATION</span>
                          <span className="text-zinc-300 font-medium block truncate mt-0.5">{qualification || '-'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase">PURSUING</span>
                          <span className="text-zinc-300 font-medium block truncate mt-0.5">{pursuing || '-'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase">TRANSACTION ID</span>
                          <span className="text-zinc-300 font-medium block truncate mt-0.5">{transactionId}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase">MEMBERSHIP ACCESS</span>
                          <span className="text-zinc-300 font-medium block mt-0.5">EXECUTIVE TIER</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase">STATUS</span>
                          <span className="text-[rgb(16,185,129)] font-medium block mt-0.5">SECURED & VERIFIED</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="payment-return-btn"
                      onClick={handleResetForm}
                      className="text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-500 px-5 py-2.5 rounded-full transition-all cursor-pointer bg-white/[0.01] hover:bg-white/[0.04]"
                    >
                      SUBMIT NEW PROFILE RECORD
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono tracking-widest">// SLS TRANSACTION SEAL DEPLOYED SECURITY SHIELD CERTIFIED</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="content-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Frosted Glass Overlay Backing */}
          <motion.div
            id="content-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            id="content-modal-container"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-3xl bg-white/[0.04] backdrop-blur-3xl border border-white/25 rounded-2xl p-6 md:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.4),_inset_0_-3px_12px_rgba(0,0,0,0.4)] z-10 pointer-events-auto max-h-[85vh] overflow-y-auto select-none"
          >
            {/* Liquid Glass Kit - Top Refraction Curved Glare Line */}
            <div 
              className="absolute top-[1.5px] left-[5%] right-[5%] bg-gradient-to-b from-white/50 to-transparent rounded-full h-[6px] pointer-events-none"
              aria-hidden="true"
            />

            {/* Simulated background color-leak light nodes (exactly matching the Liquid Glass kit mockup) */}
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-purple-500/15 blur-3xl pointer-events-none -z-10" />
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-teal-500/15 blur-3xl pointer-events-none -z-10" />

            {/* Close Button with Glass hover states */}
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white hover:scale-110 border border-white/10 hover:border-white/30 bg-white/5 p-1.5 rounded-full transition-all cursor-pointer"
              aria-label="Close modal dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Inner Content */}
            <div className="pt-2">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
