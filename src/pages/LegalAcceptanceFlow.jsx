import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { LEGAL_TEXT } from '../constants/legalText';

export default function LegalAcceptanceFlow({ onComplete }) {
  const { currentUser, setCurrentUser, setRequiresLegal } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    signature: '',
    phone: currentUser?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const scrollContainerRef = useRef(null);

  const steps = [
    { id: 1, label: 'Terms & Conditions' },
    { id: 2, label: 'Privacy Policy' },
    { id: 3, label: 'Freelancer Agreement' },
  ];

  const currentStepData = steps.find((s) => s.id === currentStep);
  let documentText = '';

  if (currentStep === 1) documentText = LEGAL_TEXT.terms;
  if (currentStep === 2) documentText = LEGAL_TEXT.privacy;
  if (currentStep === 3) documentText = LEGAL_TEXT.agreement;

  // Reset scroll and agreement state when step changes
  useEffect(() => {
    setIsScrolledToBottom(false);
    setHasAgreed(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

    setIsScrolledToBottom(isAtBottom);
  };

  const handleNextStep = () => {
    if (!hasAgreed) {
      setError('You must scroll to the bottom and agree to proceed.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    setError('');

    if (!formData.fullName.trim()) { setError('Full name is required.'); return; }
    if (!formData.signature.trim()) { setError('Digital signature is required.'); return; }
    if (!formData.phone.trim()) { setError('Phone number is required.'); return; }
    if (!hasAgreed) { setError('You must scroll to the bottom and agree to proceed.'); return; }

    setIsSubmitting(true);

    try {
      console.log('🔄 Updating user profile with legal acceptance data...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          accepted_terms_at:        new Date().toISOString(),
          accepted_privacy_at:      new Date().toISOString(),
          accepted_agreement_at:    new Date().toISOString(),
          accepted_terms_version:   '1.0',
          requires_legal_acceptance: false,
          phone:                    formData.phone,
          updated_at:               new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('❌ User update error:', updateError);
        throw updateError;
      }

      console.log('✅ User profile updated successfully');

      console.log('🔄 Inserting agreement record...');
      const { error: insertError } = await supabase
        .from('agreements')
        .insert([{
          user_id:           currentUser.id,
          agreement_text:    LEGAL_TEXT.agreement,
          agreement_version: '1.0',
          signature_method:  'typed',
          signature:         formData.signature,
          signed_at:         new Date().toISOString(),
          full_name:         formData.fullName,
          email:             currentUser.email,
          phone:             formData.phone,
          status:            'signed',
          created_at:        new Date().toISOString(),
        }]);

      if (insertError) {
        console.error('❌ Agreement insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Agreement record inserted successfully');

      // Manually update the auth state to redirect to dashboard
      console.log('🔄 Manually updating auth state...');

      // Update the current user with the new profile data
      const updatedUser = {
        ...currentUser,
        accepted_terms_at: new Date().toISOString(),
        accepted_privacy_at: new Date().toISOString(),
        accepted_agreement_at: new Date().toISOString(),
        accepted_terms_version: '1.0',
        requires_legal_acceptance: false,
        phone: formData.phone,
      };

      setCurrentUser(updatedUser);
      setRequiresLegal(false);

      console.log('✅ Auth state updated, should redirect to dashboard now');

      // Small delay to ensure state updates are processed before component unmounts
      await new Promise(resolve => setTimeout(resolve, 200));

      // Call onComplete if provided (for refetchUser)
      if (onComplete) {
        await onComplete();
      }

    } catch (err) {
      console.error('❌ Legal acceptance error:', err);
      setError(err.message || 'Failed to save. Please try again.');
      setIsSubmitting(false); // Only reset on error, not on success
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            Please review and accept our legal documents to get started.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step.id < currentStep
                      ? 'bg-amber-500 text-gray-900'
                      : step.id === currentStep
                      ? 'bg-amber-500 text-gray-900'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    step.id
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step.id < currentStep ? 'bg-amber-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="text-xs text-gray-400">
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">
            {currentStepData.label}
          </h2>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-96 overflow-y-auto bg-gray-900 p-4 rounded border border-gray-700 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap"
          >
            {documentText}
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            {isScrolledToBottom
              ? '✓ Document fully read'
              : 'Scroll to the bottom to continue'}
          </div>
        </div>

        {/* Checkbox */}
        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="agree"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            disabled={!isScrolledToBottom}
            className="mt-1 w-5 h-5 accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label
            htmlFor="agree"
            className={`text-sm ${
              isScrolledToBottom ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            I have read and agree to this {currentStepData.label.toLowerCase()}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-900 border border-red-700 rounded p-4 text-red-200 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Step 3: Form Fields */}
        {currentStep === 3 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Digital Signature (Type your name)
              </label>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleInputChange}
                placeholder="Type your name as signature"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This serves as your digital signature for this agreement.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={!hasAgreed}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-900 font-medium rounded flex items-center justify-center gap-2 transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || !hasAgreed}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-900 font-medium rounded flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Complete & Continue'}
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          All documents must be reviewed and accepted to proceed to your dashboard.
        </p>
      </div>
    </div>
  );
}
