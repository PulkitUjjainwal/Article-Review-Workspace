"use client";

import { useState, useEffect } from "react";

interface WelcomeTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Article Review Workspace! 👋",
    description: "Let's take a quick tour to help you get started with systematic literature reviews.",
    icon: "🎉",
  },
  {
    title: "Import Your Articles 📥",
    description: "Upload Excel or CSV files with your research articles. We support PubMed format and automatically validate your data.",
    icon: "📥",
  },
  {
    title: "Review Made Easy ✅",
    description: "Use Include/Exclude/Maybe to quickly screen articles. Add notes for detailed reasoning.",
    icon: "✅",
  },
  {
    title: "Keyboard Shortcuts ⌨️",
    description: "Power users love our shortcuts! Press 'j/k' to navigate, 'i/e/m' to review, and '?' to see all shortcuts.",
    icon: "⌨️",
  },
  {
    title: "Command Palette 🚀",
    description: "Press Cmd+K (or Ctrl+K) anytime to quickly access any feature. It's like a search bar for your workflow!",
    icon: "🚀",
  },
  {
    title: "You're All Set! 🎊",
    description: "Start by creating an organization, then a project. Import your articles and begin your systematic review.",
    icon: "🎊",
  },
];

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay before showing for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-t-2xl bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-purple-50 text-5xl shadow-lg ring-4 ring-blue-100">
              {step.icon}
            </div>
          </div>

          {/* Step Counter */}
          <div className="mb-2 text-center text-sm font-semibold text-blue-600">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Title */}
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            {step.title}
          </h2>

          {/* Description */}
          <p className="mb-8 text-center text-lg leading-relaxed text-gray-600">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="mb-6 flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-4">
            {currentStep > 0 ? (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="rounded-lg px-6 py-3 font-semibold text-gray-500 transition hover:text-gray-700"
              >
                Skip Tour
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Get Started
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="rounded-b-2xl bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">💡</span>
            <span>
              Press <kbd className="rounded bg-white px-2 py-1 shadow-sm">?</kbd> anytime to see keyboard shortcuts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
