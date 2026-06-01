import { useEffect, useMemo, useRef } from 'react';

export default function VerificationCodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  ariaLabel = 'Verification code',
}) {
  const inputRefs = useRef([]);
  const digits = useMemo(() => {
    const chars = Array.from({ length }, (_, index) => value?.[index] || '');
    return chars;
  }, [length, value]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const updateValue = (index, nextValue) => {
    const chars = Array.from({ length }, (_, charIndex) => value?.[charIndex] || '');
    chars[index] = nextValue;
    const next = chars.join('').slice(0, length);
    onChange(next);

    if (nextValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const chars = Array.from({ length }, (_, charIndex) => value?.[charIndex] || '');
      if (chars[index]) {
        chars[index] = '';
        onChange(chars.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const previousChars = Array.from({ length }, (_, charIndex) => value?.[charIndex] || '');
        previousChars[index - 1] = '';
        onChange(previousChars.join(''));
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) {
      return;
    }

    const chars = Array.from({ length }, (_, index) => pasted[index] || '');
    onChange(chars.join(''));
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex flex-wrap gap-3" aria-label={ariaLabel} role="group">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          value={digit}
          onChange={(event) => updateValue(index, event.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="h-14 w-12 rounded-2xl border border-white/15 bg-slate-950/70 text-center text-xl font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
