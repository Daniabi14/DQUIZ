"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Gamepad2, User, Hash, School, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function JoinGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill PIN if provided in query params (e.g. from QR code scan: /join?pin=582941)
  useEffect(() => {
    const pinParam = searchParams.get("pin");
    if (pinParam) {
      setPin(pinParam.replace(/\s+/g, ""));
    }
  }, [searchParams]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setPin(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pin.trim();
    const cleanName = name.trim();
    const cleanRoll = rollNumber.trim();

    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg("Please enter a valid Game PIN.");
      return;
    }
    if (!cleanName) {
      setErrorMsg("Student Name is required.");
      return;
    }
    if (!cleanRoll) {
      setErrorMsg("Roll Number / Participant ID is required.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Search for live game with this PIN
      const gamesRef = collection(db, "games");
      const q = query(gamesRef, where("gamePin", "==", cleanPin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Check if in dev demo mode where game might be in local storage
        const localGameRaw = localStorage.getItem(`dquiz_game_${cleanPin}`);
        if (localGameRaw) {
          const localGame = JSON.parse(localGameRaw);
          if (localGame.status === "FINISHED") {
            setErrorMsg("This game session has already finished.");
            setIsLoading(false);
            return;
          }
          if (localGame.isJoiningLocked) {
            setErrorMsg("This game is no longer accepting new participants.");
            setIsLoading(false);
            return;
          }

          // Join local dev session
          const playerId = `player_${cleanRoll.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
          const session = {
            playerId,
            gameId: localGame.id,
            gamePin: cleanPin,
            name: cleanName,
            rollNumber: cleanRoll,
            institution: institution.trim() || undefined,
            joinedAt: Date.now(),
          };
          localStorage.setItem("dquiz_student_session", JSON.stringify(session));

          showToast({
            type: "success",
            title: "Joined Game!",
            message: `Welcome ${cleanName}. Waiting for the host...`,
          });
          router.push(`/game/${localGame.id}`);
          return;
        }

        setErrorMsg("Game not found. Please check the PIN and try again.");
        setIsLoading(false);
        return;
      }

      const gameDoc = querySnapshot.docs[0];
      const gameData = gameDoc.data();
      const gameId = gameDoc.id;

      // 2. Validate Game State
      if (gameData.status === "FINISHED") {
        setErrorMsg("This game has already finished.");
        setIsLoading(false);
        return;
      }

      if (gameData.isJoiningLocked) {
        setErrorMsg("This game is locked and not accepting new participants.");
        setIsLoading(false);
        return;
      }

      // 3. Check for Duplicate Roll Number within this game
      const playersRef = collection(db, "games", gameId, "players");
      const duplicateQuery = query(playersRef, where("rollNumber", "==", cleanRoll));
      const duplicateSnapshot = await getDocs(duplicateQuery);

      let playerId = "";
      if (!duplicateSnapshot.empty) {
        const existingPlayerDoc = duplicateSnapshot.docs[0];
        const existingPlayer = existingPlayerDoc.data();

        // If reconnecting player
        playerId = existingPlayerDoc.id;
        showToast({
          type: "info",
          title: "Reconnected",
          message: `Resuming session for ${cleanRoll}`,
        });
      } else {
        // Register new player doc in Firestore
        const newPlayerRef = doc(playersRef);
        playerId = newPlayerRef.id;

        await setDoc(newPlayerRef, {
          id: playerId,
          gameId,
          name: cleanName,
          rollNumber: cleanRoll,
          institution: institution.trim() || null,
          connectionStatus: "connected",
          hasAnsweredCurrentQuestion: false,
          score: 0,
          joinedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
        });
      }

      // 4. Save player session locally
      const session = {
        playerId,
        gameId,
        gamePin: cleanPin,
        name: cleanName,
        rollNumber: cleanRoll,
        institution: institution.trim() || undefined,
        joinedAt: Date.now(),
      };
      localStorage.setItem("dquiz_student_session", JSON.stringify(session));

      showToast({
        type: "success",
        title: "Joined Game!",
        message: `Welcome, ${cleanName}!`,
      });

      router.push(`/game/${gameId}`);
    } catch (err: any) {
      console.error("Join game error:", err);
      // Fallback for dev / offline testing:
      const fallbackPlayerId = `dev_player_${Date.now()}`;
      const session = {
        playerId: fallbackPlayerId,
        gameId: `game_${cleanPin}`,
        gamePin: cleanPin,
        name: cleanName,
        rollNumber: cleanRoll,
        institution: institution.trim() || undefined,
        joinedAt: Date.now(),
      };
      localStorage.setItem("dquiz_student_session", JSON.stringify(session));
      showToast({
        type: "info",
        title: "Entered Lobby",
        message: `Connected with PIN ${cleanPin}`,
      });
      router.push(`/game/demo_${cleanPin}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              JOIN GAME
            </h1>
            <p className="text-xs text-slate-400">
              Enter your Game PIN and Participant ID to enter the live quiz.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PIN Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Game PIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="000 000"
                  className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.3em] py-3.5 bg-slate-950 border-2 border-brand-500/40 focus:border-brand-400 rounded-xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Name Input */}
            <Input
              label="Student Name"
              placeholder="e.g. Daniel Abishek"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              required
            />

            {/* Roll Number / Participant ID */}
            <Input
              label="Roll Number / Participant ID"
              placeholder="e.g. 23CS001"
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              required
            />

            {/* Optional Institution */}
            <Input
              label="Institution / Department (Optional)"
              placeholder="e.g. Dept of Computing"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium text-center"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="xl"
              isLoading={isLoading}
              className="w-full mt-2 font-bold tracking-wide shadow-lg shadow-brand-600/25"
            >
              <span>JOIN GAME</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              🔒 Privacy Protected. Participant rankings and results are confidential.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      }
    >
      <JoinGameForm />
    </Suspense>
  );
}
