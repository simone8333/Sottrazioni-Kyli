/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RefreshCw, Star, Trophy, Flame } from 'lucide-react';

interface Problem {
  minuend: number;
  subtrahend: number;
  answer: number;
}

interface QueuedProblem {
  minuend: number;
  subtrahend: number;
  wait: number;
}

export default function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongQueue, setWrongQueue] = useState<QueuedProblem[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setWrongQueue([]);
    setHistory([]);
    generateProblem();
  };

  const generateProblem = useCallback(() => {
    setWrongQueue(currentQueue => {
      const updatedQueue = currentQueue.map(p => ({ ...p, wait: p.wait - 1 }));
      
      setHistory(currentHistory => {
        let nextMinuend = 0;
        let nextSubtrahend = 0;
        let found = false;

        const readyFromQueue = updatedQueue.find(p => p.wait <= 0);
        if (readyFromQueue && Math.random() > 0.5) {
          nextMinuend = readyFromQueue.minuend;
          nextSubtrahend = readyFromQueue.subtrahend;
          found = true;
          setTimeout(() => {
            setWrongQueue(q => q.filter(p => p !== readyFromQueue));
          }, 0);
        }

        let attempts = 0;
        while (!found && attempts < 50) {
          attempts++;
          if (score <= 30) {
            nextMinuend = Math.floor(Math.random() * 8) + 11;
          } else {
            const tens = Math.floor(Math.random() * 9) + 1;
            const units = Math.floor(Math.random() * 8) + 1;
            nextMinuend = tens * 10 + units;
          }

          const units = nextMinuend % 10;
          const minS = units + 1;
          const maxS = 9;
          
          if (minS <= maxS) {
            nextSubtrahend = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
            const problemKey = `${nextMinuend}-${nextSubtrahend}`;
            if (!currentHistory.includes(problemKey)) {
              found = true;
            }
          }
        }

        const answer = nextMinuend - nextSubtrahend;
        setProblem({ minuend: nextMinuend, subtrahend: nextSubtrahend, answer });
        setUserAnswer(null);
        setCurrentInput("");
        setIsCorrect(null);
        
        return [`${nextMinuend}-${nextSubtrahend}`, ...currentHistory].slice(0, 10);
      });

      return updatedQueue;
    });
  }, [score]);

  useEffect(() => {
    generateProblem();
  }, []);

  const handleAnswer = (val: number) => {
    if (isCorrect !== null || !problem) return;

    const answerStr = problem.answer.toString();
    const newInput = currentInput + val.toString();

    if (answerStr.length === 1) {
      // Single digit answer logic
      setUserAnswer(val);
      if (val === problem.answer) {
        setIsCorrect(true);
        const points = streak >= 5 ? 2 : 1;
        setScore((s) => s + points);
        setStreak((s) => s + 1);
      } else {
        setIsCorrect(false);
        setScore((s) => Math.max(0, s - 1));
        setStreak(0);
        setWrongQueue(prev => [...prev, { ...problem, wait: 2 }]);
      }
    } else {
      // Two digit answer logic
      if (newInput.length === 1) {
        // First digit
        setUserAnswer(val);
        if (newInput !== answerStr[0]) {
          setIsCorrect(false);
          setScore((s) => Math.max(0, s - 1));
          setStreak(0);
          setWrongQueue(prev => [...prev, { ...problem, wait: 2 }]);
        } else {
          setCurrentInput(newInput);
        }
      } else {
        // Second digit
        const finalVal = parseInt(newInput);
        setUserAnswer(finalVal);
        if (newInput === answerStr) {
          setIsCorrect(true);
          const points = streak >= 5 ? 2 : 1;
          setScore((s) => s + points);
          setStreak((s) => s + 1);
        } else {
          setIsCorrect(false);
          setScore((s) => Math.max(0, s - 1));
          setStreak(0);
          setWrongQueue(prev => [...prev, { ...problem, wait: 2 }]);
        }
        setCurrentInput("");
      }
    }
  };

  const nextQuestion = () => {
    generateProblem();
  };

  if (!problem) return null;

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col items-center p-2 font-sans text-slate-900 overflow-hidden">
      {/* Header / Score - Compact */}
      <div className="w-full max-w-md py-2 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-200">
            <Trophy className="text-yellow-500 w-5 h-5" />
            <span className="font-black text-lg text-slate-700">{score}</span>
          </div>
          <button 
            onClick={resetGame}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 transition-colors active:scale-90"
            title="Ricomincia"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        
        <AnimatePresence>
          {streak > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl font-black shadow-sm border ${streak >= 5 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-yellow-400 border-yellow-300 text-yellow-900'}`}
            >
              <Flame size={18} className={streak >= 5 ? 'animate-pulse' : ''} />
              <span className="text-sm">{streak} {streak >= 5 ? '+2' : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="w-full max-w-md flex flex-col items-center justify-between flex-1 min-h-0 py-2">
        {/* Problem Display - Compact and Single Line */}
        <motion.div 
          key={`${problem.minuend}-${problem.subtrahend}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full p-4 sm:p-6 rounded-[2rem] shadow-lg border-2 border-indigo-50 flex flex-col items-center justify-center gap-2 shrink-0"
        >
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-indigo-700 flex items-center justify-center gap-3 w-full">
            <span>{problem.minuend}</span>
            <span className="text-pink-400">−</span>
            <span>{problem.subtrahend}</span>
            <span className="text-indigo-100">=</span>
            <div className={`w-20 h-16 sm:w-24 sm:h-20 rounded-2xl border-4 flex items-center justify-center shadow-inner transition-colors ${isCorrect === true ? 'border-green-200 bg-green-50' : isCorrect === false ? 'border-red-200 bg-red-50' : 'border-dashed border-indigo-100 bg-slate-50'}`}>
              <AnimatePresence mode="wait">
                {userAnswer !== null || isCorrect !== null ? (
                  <motion.span 
                    key={userAnswer}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl sm:text-5xl font-black ${isCorrect === true ? 'text-green-500' : isCorrect === false ? 'text-red-500' : 'text-indigo-600'}`}
                  >
                    {userAnswer}
                    {isCorrect === null && problem.answer >= 10 && currentInput.length === 1 && (
                      <span className="text-indigo-100 ml-1">_</span>
                    )}
                  </motion.span>
                ) : (
                  <div className="flex gap-1">
                    <span className="text-indigo-100 text-4xl">_</span>
                    {problem.answer >= 10 && (
                      <span className="text-indigo-100 text-4xl">_</span>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isCorrect === true && (
                <motion.div 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center gap-2 text-green-600 font-black text-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>BRAVO!</span>
                </motion.div>
              )}
              {isCorrect === false && (
                <motion.div 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center gap-2 text-red-500 font-black text-lg"
                >
                  <XCircle className="w-5 h-5" />
                  <span>OPS! Era {problem.answer}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Answer Buttons - Tighter Grid */}
        <div className="grid grid-cols-3 gap-2 w-full px-1 flex-1 max-h-[400px] items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              disabled={isCorrect !== null}
              onClick={() => handleAnswer(num)}
              className={`
                h-full min-h-[60px] max-h-[80px] rounded-2xl text-3xl font-black shadow-md transition-all flex items-center justify-center
                ${(currentInput === num.toString() || (userAnswer === num && currentInput === ""))
                  ? (isCorrect === true ? 'bg-green-500 text-white border-green-600' : isCorrect === false ? 'bg-red-500 text-white border-red-600' : 'bg-indigo-500 text-white border-indigo-600')
                  : 'bg-white text-indigo-900 border-b-4 border-indigo-100 active:border-b-0 active:translate-y-1'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {num}
            </motion.button>
          ))}
          <div className="col-start-2 h-full min-h-[60px] max-h-[80px]">
            <motion.button
              whileTap={{ scale: 0.9 }}
              disabled={isCorrect !== null}
              onClick={() => handleAnswer(0)}
              className={`
                w-full h-full rounded-2xl text-3xl font-black shadow-md transition-all flex items-center justify-center
                ${(currentInput === "0" || (userAnswer === 0 && currentInput === ""))
                  ? (isCorrect === true ? 'bg-green-500 text-white border-green-600' : isCorrect === false ? 'bg-red-500 text-white border-red-600' : 'bg-indigo-500 text-white border-indigo-600')
                  : 'bg-white text-indigo-900 border-b-4 border-indigo-100 active:border-b-0 active:translate-y-1'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              0
            </motion.button>
          </div>
        </div>

        {/* Fixed Bottom Action Area */}
        <div className="w-full p-2 shrink-0 h-20 flex items-center">
          <AnimatePresence>
            {isCorrect !== null && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="w-full h-full bg-indigo-600 text-white rounded-2xl text-xl font-black shadow-lg flex items-center justify-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                <RefreshCw className="w-6 h-6" />
                <span>PROSSIMA!</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
