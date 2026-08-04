"use client";

import { useState } from "react";

type Props = {
  visible: boolean;
  onToggle: () => void;
};

export function PasswordVisibilityToggle({ visible, onToggle }: Props) {
  const [blinking, setBlinking] = useState(false);

  function handleClick() {
    onToggle();
    setBlinking(true);
    window.setTimeout(() => setBlinking(false), 320);
  }

  const iconUrl = visible ? "/assets/open_eye.png" : "/assets/closed_eye.png";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center"
    >
      <span
        aria-hidden="true"
        className={`inline-block h-[18px] w-[18px] origin-center bg-brown ${blinking ? "animate-blink" : ""}`}
        style={{
          WebkitMaskImage: `url(${iconUrl})`,
          maskImage: `url(${iconUrl})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </button>
  );
}
