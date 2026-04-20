import { useEffect } from "react";

export const useRipple = () => {
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest(".button, .btn, .nav-item, .fab, .card.clickable");
      if (!target) return;

      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      target.appendChild(ripple);

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);
};
